import 'server-only';
import { getDrive } from '@/lib/google-drive';
import { getAdminClient } from '@/lib/supabase/server';

export interface SyncResult {
  success: boolean;
  count: number;
  error?: string;
}

/**
 * Synchronizes photos from the session's Google Drive folder to Supabase `photos` table.
 */
export async function syncPhotos(sessionId: string): Promise<SyncResult> {
  const supabase = getAdminClient();

  // 1. Fetch session to get drive_folder_id
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, drive_folder_id, client_name')
    .eq('id', sessionId)
    .single();

  if (sessionErr || !session) {
    throw new Error('Sesi tidak ditemukan di database.');
  }

  const folderId = session.drive_folder_id;
  const drive = getDrive();

  // 2. Fetch all image files from Google Drive folder
  interface DriveImage {
    id: string;
    name: string;
    width: number | null;
    height: number | null;
  }

  const allFiles: DriveImage[] = [];
  let pageToken: string | undefined = undefined;

  try {
    do {
      const res: any = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, imageMediaMetadata(width,height))',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageToken,
      });

      const files = res.data.files || [];
      for (const f of files) {
        if (f.id && f.name) {
          allFiles.push({
            id: f.id,
            name: f.name,
            width: f.imageMediaMetadata?.width ?? null,
            height: f.imageMediaMetadata?.height ?? null,
          });
        }
      }

      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);
  } catch (err: unknown) {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'service account';
    const msg = err instanceof Error ? err.message : String(err);

    console.error('Google Drive sync error:', err);

    if (
      msg.includes('File not found') ||
      msg.includes('notFound') ||
      msg.includes('404') ||
      msg.includes('403') ||
      msg.includes('insufficientFilePermissions')
    ) {
      throw new Error(
        `Folder Google Drive tidak dapat diakses atau belum di-share ke service account: ${serviceAccountEmail}. Pastikan folder sudah dibagikan dengan akses Viewer.`
      );
    }

    throw new Error(`Gagal membaca folder Google Drive: ${msg}`);
  }

  // 3. Natural sort by file_name
  allFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  // 4. Batch upsert into photos table (chunks of 200 for reliability)
  const rows = allFiles.map((f, index) => {
    // code = file name without extension, preserving exact case and underscores
    const lastDotIndex = f.name.lastIndexOf('.');
    const code = lastDotIndex > 0 ? f.name.substring(0, lastDotIndex) : f.name;

    return {
      session_id: sessionId,
      drive_file_id: f.id,
      file_name: f.name,
      code,
      width: f.width,
      height: f.height,
      sort_order: index,
    };
  });

  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: upsertErr } = await supabase
      .from('photos')
      .upsert(chunk, { onConflict: 'session_id,drive_file_id' });

    if (upsertErr) {
      throw new Error(`Gagal menyimpan foto ke database: ${upsertErr.message}`);
    }
  }

  // 5. Clean up photos deleted from Google Drive
  const currentDriveFileIds = allFiles.map((f) => f.id);
  if (currentDriveFileIds.length > 0) {
    const { error: delErr } = await supabase
      .from('photos')
      .delete()
      .eq('session_id', sessionId)
      .not('drive_file_id', 'in', `(${currentDriveFileIds.join(',')})`);

    if (delErr) {
      console.warn('Warning deleting removed photos:', delErr.message);
    }
  } else {
    // If no images found in Drive, delete all existing photos for this session
    await supabase.from('photos').delete().eq('session_id', sessionId);
  }

  // 6. Update session last_synced_at
  await supabase
    .from('sessions')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', sessionId);

  return {
    success: true,
    count: allFiles.length,
  };
}
