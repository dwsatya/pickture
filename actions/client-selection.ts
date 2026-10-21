'use server';

import { getAdminClient } from '@/lib/supabase/server';
import { formatPhotoCodes, renderMessageTemplate, buildWhatsAppUrl } from '@/lib/format-codes';
import { revalidatePath } from 'next/cache';

export interface ClientSessionResponse {
  valid: boolean;
  reason?: 'NOT_FOUND' | 'SUBMITTED' | 'CLOSED' | 'EXPIRED';
  session?: {
    id: string;
    slug: string;
    client_name: string;
    university: string | null;
    max_selection: number;
    status: 'draft' | 'open' | 'submitted' | 'closed';
    expires_at: string | null;
    submitted_at: string | null;
  };
  photos?: Array<{
    id: string;
    drive_file_id: string;
    file_name: string;
    code: string;
    width: number | null;
    height: number | null;
    sort_order: number;
  }>;
  selectedPhotoIds?: string[];
}

/**
 * Loads the public client session by slug without exposing sensitive fields
 * like drive_folder_id, client_phone, or admin notes.
 */
export async function getClientSession(slug: string): Promise<ClientSessionResponse> {
  const supabase = getAdminClient();

  // 1. Fetch session by slug
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, slug, client_name, university, max_selection, status, expires_at, submitted_at')
    .eq('slug', slug)
    .single();

  if (error || !session) {
    return { valid: false, reason: 'NOT_FOUND' };
  }

  // Check expiration
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return { valid: false, reason: 'EXPIRED', session };
  }

  // Check status
  if (session.status === 'submitted') {
    return { valid: false, reason: 'SUBMITTED', session };
  }

  if (session.status === 'closed') {
    return { valid: false, reason: 'CLOSED', session };
  }

  // 2. Fetch photos ordered by sort_order
  const { data: photos } = await supabase
    .from('photos')
    .select('id, drive_file_id, file_name, code, width, height, sort_order')
    .eq('session_id', session.id)
    .order('sort_order', { ascending: true });

  // 3. Fetch currently selected photo IDs
  const { data: selections } = await supabase
    .from('selections')
    .select('photo_id')
    .eq('session_id', session.id);

  const selectedPhotoIds = (selections || []).map((s) => s.photo_id);

  return {
    valid: true,
    session,
    photos: photos || [],
    selectedPhotoIds,
  };
}

/**
 * Toggles a photo selection atomically on the server via RPC function.
 */
export async function toggleSelection(slug: string, photoId: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc('toggle_selection', {
    p_slug: slug,
    p_photo_id: photoId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Typecast json result from postgres
  const result = data as {
    ok: boolean;
    error?: string;
    selected?: boolean;
    count?: number;
  };

  return result;
}

/**
 * Submits the selected photos, locks the session to 'submitted',
 * records the submission history, and returns the WhatsApp URL.
 */
export async function submitSelection(slug: string) {
  const supabase = getAdminClient();

  // 1. Fetch session and lock/validate
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, slug, client_name, university, max_selection, status, expires_at')
    .eq('slug', slug)
    .single();

  if (sessionErr || !session) {
    return { success: false, error: 'Sesi tidak ditemukan.' };
  }

  if (session.status !== 'open') {
    return { success: false, error: 'Sesi ini sudah tidak dapat menerima pilihan.' };
  }

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return { success: false, error: 'Sesi ini sudah kedaluwarsa.' };
  }

  // 2. Fetch current selections with photo codes
  const { data: selections, error: selErr } = await supabase
    .from('selections')
    .select('photo_id, photos:photos!selections_photo_id_fkey(code, file_name)')
    .eq('session_id', session.id);

  if (selErr) {
    return { success: false, error: 'Gagal mengambil pilihan foto.' };
  }

  const count = selections?.length || 0;
  if (count < 1) {
    return { success: false, error: 'Silakan pilih minimal 1 foto sebelum mengirim.' };
  }

  if (count > session.max_selection) {
    return {
      success: false,
      error: `Jumlah foto terpilih (${count}) melebihi batas maksimal (${session.max_selection}).`,
    };
  }

  // 3. Fetch settings for message formatting
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  const separator = settings?.code_separator || ' OR ';
  const whatsappNumber = settings?.whatsapp_number || '628000000000';
  const template =
    settings?.message_template ||
    'Halo kak, saya {nama} sudah memilih {jumlah} foto:\n\n{kode}';

  // Extract and natural-sort codes
  const photoCodes = (selections || [])
    .map((s: any) => s.photos?.code)
    .filter(Boolean) as string[];

  const formattedCodes = formatPhotoCodes(photoCodes, separator);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const clientPageUrl = `${appUrl}/p/${session.slug}`;

  const message = renderMessageTemplate({
    template,
    nama: session.client_name,
    jumlah: count,
    kode: formattedCodes,
    kampus: session.university || '',
    link: clientPageUrl,
  });

  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, message);

  // 4. Record into submissions history
  const { error: subErr } = await supabase.from('submissions').insert({
    session_id: session.id,
    photo_codes: photoCodes,
    photo_count: count,
  });

  if (subErr) {
    console.error('Error recording submission:', subErr);
  }

  // 5. Update session status to 'submitted'
  const { error: updateErr } = await supabase
    .from('sessions')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  if (updateErr) {
    return { success: false, error: 'Gagal mengunci sesi.' };
  }

  revalidatePath(`/p/${slug}`);
  revalidatePath('/admin');
  revalidatePath(`/admin/sessions/${session.id}`);

  return {
    success: true,
    whatsappUrl,
    photoCount: count,
  };
}
