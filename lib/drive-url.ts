/**
 * Extracts Google Drive folder ID from various URL formats or plain ID:
 * - https://drive.google.com/drive/folders/1a2b3c4d5e?usp=sharing
 * - https://drive.google.com/drive/u/0/folders/1a2b3c4d5e
 * - 1a2b3c4d5e
 */
export function extractDriveFolderId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Match folder link pattern
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // If plain ID given (typically 28 to 45 alphanumeric characters with underscores and dashes)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
