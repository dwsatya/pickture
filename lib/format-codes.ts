/**
 * Formats photo codes with natural sort and separator (e.g. "NYK_8273 OR NYK_8301").
 */
export function formatPhotoCodes(codes: string[], separator: string = ' OR '): string {
  if (!codes || codes.length === 0) return '';
  const sorted = [...codes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return sorted.join(separator);
}

export interface MessageParams {
  template: string;
  nama: string;
  jumlah: number | string;
  kode: string;
  kampus?: string | null;
  link?: string | null;
}

/**
 * Replaces placeholders in the WhatsApp message template:
 * {nama}, {jumlah}, {kode}, {kampus}, {link}
 */
export function renderMessageTemplate({
  template,
  nama,
  jumlah,
  kode,
  kampus = '',
  link = '',
}: MessageParams): string {
  return template
    .replace(/{nama}/g, nama)
    .replace(/{jumlah}/g, String(jumlah))
    .replace(/{kode}/g, kode)
    .replace(/{kampus}/g, kampus || '')
    .replace(/{link}/g, link || '');
}

/**
 * Builds the WhatsApp web URL.
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
