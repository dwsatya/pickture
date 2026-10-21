'use server';

import { customAlphabet } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/supabase/auth';
import { getAdminClient } from '@/lib/supabase/server';
import { sessionSchema, SessionInput } from '@/lib/validations';
import { extractDriveFolderId } from '@/lib/drive-url';
import { syncPhotos } from '@/lib/sync-photos';
import { Database, SessionStatus } from '@/lib/supabase/types';

// 10-character alphanumeric unique slug
const generateSlug = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
);

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new client session, parses the Drive folder ID, generates a slug,
 * and immediately triggers photo sync.
 */
export async function createSession(data: SessionInput): Promise<ActionResponse<{ id: string; slug: string; photoCount: number }>> {
  await requireAdmin();

  const parsed = sessionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data form tidak valid.',
    };
  }

  const {
    client_name,
    client_phone,
    university,
    graduation_date,
    drive_url,
    max_selection,
    expires_at,
    notes,
  } = parsed.data;

  // Parse folder ID from Drive URL
  const folderId = extractDriveFolderId(drive_url);
  if (!folderId) {
    return {
      success: false,
      error: 'Link Google Drive tidak valid. Pastikan link berbentuk folder Google Drive.',
    };
  }

  const supabase = getAdminClient();
  const slug = generateSlug();

  // Insert new session
  const { data: newSession, error: insertErr } = await supabase
    .from('sessions')
    .insert({
      slug,
      client_name: client_name.trim(),
      client_phone: client_phone ? client_phone.trim() : null,
      university: university ? university.trim() : null,
      graduation_date: graduation_date || null,
      drive_folder_id: folderId,
      max_selection: max_selection || 30,
      status: 'open',
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      notes: notes ? notes.trim() : null,
    })
    .select('id, slug')
    .single();

  if (insertErr || !newSession) {
    return {
      success: false,
      error: `Gagal menyimpan sesi: ${insertErr?.message || 'Unknown error'}`,
    };
  }

  // Run immediate Google Drive sync
  let photoCount = 0;
  try {
    const syncRes = await syncPhotos(newSession.id);
    photoCount = syncRes.count;
  } catch (syncErr: unknown) {
    const errMsg = syncErr instanceof Error ? syncErr.message : String(syncErr);
    // Sesi tetap terbuat, tapi berikan warning error sync
    revalidatePath('/admin');
    return {
      success: true,
      data: { id: newSession.id, slug: newSession.slug, photoCount: 0 },
      error: `Sesi berhasil dibuat, namun sinkronisasi foto tertunda: ${errMsg}`,
    };
  }

  revalidatePath('/admin');
  return {
    success: true,
    data: { id: newSession.id, slug: newSession.slug, photoCount },
  };
}

/**
 * Updates session metadata (client details, quota, expiration date, status, notes).
 */
export async function updateSession(
  id: string,
  data: {
    client_name?: string;
    client_phone?: string | null;
    university?: string | null;
    graduation_date?: string | null;
    max_selection?: number;
    status?: SessionStatus;
    expires_at?: string | null;
    notes?: string | null;
  }
): Promise<ActionResponse> {
  await requireAdmin();
  const supabase = getAdminClient();

  type SessionUpdate = Database['public']['Tables']['sessions']['Update'];
  const updatePayload: SessionUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (data.client_name !== undefined) updatePayload.client_name = data.client_name.trim();
  if (data.client_phone !== undefined) updatePayload.client_phone = data.client_phone ? data.client_phone.trim() : null;
  if (data.university !== undefined) updatePayload.university = data.university ? data.university.trim() : null;
  if (data.graduation_date !== undefined) updatePayload.graduation_date = data.graduation_date || null;
  if (data.max_selection !== undefined) updatePayload.max_selection = data.max_selection;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.expires_at !== undefined) updatePayload.expires_at = data.expires_at ? new Date(data.expires_at).toISOString() : null;
  if (data.notes !== undefined) updatePayload.notes = data.notes ? data.notes.trim() : null;

  const { error } = await supabase.from('sessions').update(updatePayload).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/sessions/${id}`);
  return { success: true };
}

/**
 * Triggers manual re-synchronization of photos from Google Drive.
 */
export async function syncSession(id: string): Promise<ActionResponse<{ count: number }>> {
  await requireAdmin();

  try {
    const res = await syncPhotos(id);
    revalidatePath('/admin');
    revalidatePath(`/admin/sessions/${id}`);
    return { success: true, data: { count: res.count } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Unlocks a submitted session back to 'open' status while keeping current selections intact.
 */
export async function unlockSession(id: string): Promise<ActionResponse> {
  await requireAdmin();
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'open', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/sessions/${id}`);
  return { success: true };
}

/**
 * Closes a session manually (status 'closed').
 */
export async function closeSession(id: string): Promise<ActionResponse> {
  await requireAdmin();
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/sessions/${id}`);
  return { success: true };
}

/**
 * Deletes a session and all its associated photos, selections, and submissions (cascades).
 */
export async function deleteSession(id: string): Promise<ActionResponse> {
  await requireAdmin();
  const supabase = getAdminClient();

  const { error } = await supabase.from('sessions').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  return { success: true };
}
