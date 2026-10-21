'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/supabase/auth';
import { getAdminClient } from '@/lib/supabase/server';
import { settingsSchema, SettingsInput } from '@/lib/validations';
import { sanitizeWhatsAppNumber } from '@/lib/utils';

export interface SettingsData {
  id: number;
  whatsapp_number: string;
  code_separator: string;
  default_max_selection: number;
  message_template: string;
  updated_at?: string;
}

export interface SettingsResponse {
  success: boolean;
  data?: SettingsData;
  error?: string;
}

/**
 * Fetches application settings (row id = 1).
 * If settings table is empty, seeds the default record.
 */
export async function getSettings(): Promise<SettingsData> {
  await requireAdmin();
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching settings:', error.message);
  }

  if (!data) {
    // Seed default settings row
    const defaultSettings: Omit<SettingsData, 'updated_at'> = {
      id: 1,
      whatsapp_number: '628000000000',
      code_separator: ' OR ',
      default_max_selection: 30,
      message_template: 'Halo kak, saya {nama} sudah memilih {jumlah} foto:\n\n{kode}',
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('settings')
      .upsert(defaultSettings)
      .select()
      .single();

    if (insertErr || !inserted) {
      return defaultSettings as SettingsData;
    }

    return inserted as SettingsData;
  }

  return data as SettingsData;
}

/**
 * Updates application settings with validation.
 */
export async function updateSettings(rawValues: SettingsInput): Promise<SettingsResponse> {
  await requireAdmin();

  // Normalize WhatsApp number before validation
  const sanitizedWhatsApp = sanitizeWhatsAppNumber(rawValues.whatsapp_number);

  const parsed = settingsSchema.safeParse({
    ...rawValues,
    whatsapp_number: sanitizedWhatsApp,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pengaturan tidak valid.',
    };
  }

  const { whatsapp_number, code_separator, default_max_selection, message_template } =
    parsed.data;

  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('settings')
    .upsert({
      id: 1,
      whatsapp_number,
      code_separator,
      default_max_selection,
      message_template,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message || 'Gagal menyimpan pengaturan.',
    };
  }

  // Revalidate relevant pages
  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  revalidatePath('/admin/sessions/new');

  return {
    success: true,
    data: data as SettingsData,
  };
}
