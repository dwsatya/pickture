export { cn } from "cn";

/**
 * Normalizes phone numbers (e.g. 0812... -> 62812..., +62... -> 62..., strips spaces/dashes)
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
}
