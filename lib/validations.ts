import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const sessionSchema = z.object({
  client_name: z.string().min(1, 'Nama klien wajib diisi'),
  client_phone: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  graduation_date: z.string().optional().nullable(),
  drive_url: z.string().min(1, 'Link Google Drive wajib diisi'),
  max_selection: z.coerce.number().int().positive('Batas maksimal minimal 1').default(30),
  expires_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const settingsSchema = z.object({
  whatsapp_number: z
    .string()
    .regex(/^62[0-9]{8,13}$/, 'Nomor WhatsApp harus berformat 62xxx (tanpa + atau spasi)'),
  code_separator: z.string().min(1, 'Separator tidak boleh kosong'),
  default_max_selection: z.coerce.number().int().positive('Default maksimal minimal 1'),
  message_template: z.string().min(1, 'Template pesan tidak boleh kosong'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
