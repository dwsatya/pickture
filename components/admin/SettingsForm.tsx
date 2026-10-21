'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SettingsData,
  updateSettings,
} from '@/actions/admin-settings';
import { sanitizeWhatsAppNumber } from '@/lib/utils';
import {
  MessageSquare,
  Phone,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCheck,
  Check,
  Info,
  Layers,
  FileCode2,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface SettingsFormProps {
  initialSettings: SettingsData;
}

const DEFAULT_PRESETS = {
  whatsapp_number: '628000000000',
  code_separator: ' OR ',
  default_max_selection: 30,
  message_template: 'Halo kak, saya {nama} sudah memilih {jumlah} foto:\n\n{kode}',
};

const SEPARATOR_PRESETS = [
  { label: 'OR (Windows Explorer)', value: ' OR ', desc: 'Rekomendasi pencarian Explorer' },
  { label: 'Koma ( , )', value: ', ', desc: 'Format daftar standar' },
  { label: 'Baris Baru (Enter)', value: '\n', desc: 'Satu kode per baris' },
  { label: 'Spasi Tunggal', value: ' ', desc: 'Pemisah spasi' },
];

const VARIABLE_TAGS = [
  { tag: '{nama}', desc: 'Nama Klien', sample: 'Budi Santoso' },
  { tag: '{jumlah}', desc: 'Jumlah Foto Terpilih', sample: '25' },
  { tag: '{kode}', desc: 'Daftar Kode Foto', sample: 'NYK_0102 OR NYK_0105 OR NYK_0109' },
  { tag: '{kampus}', desc: 'Nama Universitas', sample: 'Universitas Indonesia' },
  { tag: '{link}', desc: 'Tautan Galeri Klien', sample: 'https://pickture.app/p/abc123xyz' },
];

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsapp_number);
  const [codeSeparator, setCodeSeparator] = useState(initialSettings.code_separator);
  const [defaultMaxSelection, setDefaultMaxSelection] = useState(
    initialSettings.default_max_selection
  );
  const [messageTemplate, setMessageTemplate] = useState(initialSettings.message_template);
  const [isPending, startTransition] = useTransition();

  // Cleaned number for WA link preview
  const cleanedWaNumber = sanitizeWhatsAppNumber(whatsappNumber);
  const isValidWaNumber = /^62[0-9]{8,13}$/.test(cleanedWaNumber);

  // Generate live WhatsApp message preview
  const generatePreviewMessage = () => {
    const sampleCodes = ['NYK_0821', 'NYK_0824', 'NYK_0830'];
    const separator = codeSeparator === '\\n' ? '\n' : codeSeparator;
    const formattedCodes = sampleCodes.join(separator);

    let text = messageTemplate;
    text = text.replace(/{nama}/g, 'Budi Santoso');
    text = text.replace(/{jumlah}/g, '3');
    text = text.replace(/{kode}/g, formattedCodes);
    text = text.replace(/{kampus}/g, 'Universitas Indonesia');
    text = text.replace(/{link}/g, 'http://localhost:3000/p/contoh-slug');
    return text;
  };

  // Insert variable into template textarea
  const insertVariable = (tag: string) => {
    setMessageTemplate((prev) => `${prev} ${tag}`);
    toast.info(`Variabel ${tag} ditambahkan ke template`);
  };

  // Reset to default presets
  const handleReset = () => {
    if (confirm('Kembalikan semua pengaturan ke nilai bawaan (default)?')) {
      setWhatsappNumber(DEFAULT_PRESETS.whatsapp_number);
      setCodeSeparator(DEFAULT_PRESETS.code_separator);
      setDefaultMaxSelection(DEFAULT_PRESETS.default_max_selection);
      setMessageTemplate(DEFAULT_PRESETS.message_template);
      toast.info('Pengaturan dikembalikan ke nilai default.');
    }
  };

  // Submit update
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!whatsappNumber.trim()) {
      toast.error('Nomor WhatsApp wajib diisi.');
      return;
    }

    if (!isValidWaNumber) {
      toast.error(
        'Format nomor WhatsApp tidak valid. Gunakan format 62xxx atau 08xxx (minimal 10 digit).'
      );
      return;
    }

    if (!codeSeparator) {
      toast.error('Pemisah kode foto tidak boleh kosong.');
      return;
    }

    if (defaultMaxSelection < 1) {
      toast.error('Batas maksimal minimal 1 foto.');
      return;
    }

    if (!messageTemplate.trim()) {
      toast.error('Template pesan WhatsApp tidak boleh kosong.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateSettings({
          whatsapp_number: whatsappNumber,
          code_separator: codeSeparator,
          default_max_selection: Number(defaultMaxSelection),
          message_template: messageTemplate,
        });

        if (!res.success) {
          toast.error(res.error || 'Gagal menyimpan pengaturan.');
          return;
        }

        toast.success('Pengaturan berhasil disimpan!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan.';
        toast.error(msg);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
            <span>Konfigurasi Sistem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Pengaturan Aplikasi
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Atur nomor WhatsApp tujuan, pemisah kode foto, batas maksimal foto, dan template pesan klien.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isPending}
            className="h-10 px-4 rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Default</span>
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            className="h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: WhatsApp Utama */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Nomor WhatsApp Utama (Fotografer)
                </h2>
                <p className="text-xs text-stone-500">
                  Nomor yang akan menerima kiriman kode foto terpilih dari klien
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-xs font-semibold text-stone-700 block">
                Nomor WhatsApp
              </Label>
              <div className="relative">
                <Input
                  id="whatsapp"
                  type="text"
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  disabled={isPending}
                  className="h-11 rounded-xl bg-stone-50/60 border-stone-200 text-sm focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                <p className="text-[11px] text-stone-500">
                  Format tersimpan: <code className="font-semibold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded">{cleanedWaNumber || '-'}</code>
                  {!isValidWaNumber && whatsappNumber && (
                    <span className="text-red-500 ml-2">Format belum valid</span>
                  )}
                </p>

                {isValidWaNumber && (
                  <a
                    href={`https://wa.me/${cleanedWaNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    <span>Uji Buka Chat WhatsApp</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Separator & Default Max Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Format Ekstraksi & Sesi
                </h2>
                <p className="text-xs text-stone-500">
                  Sesuaikan pemisah kode foto untuk pencarian Windows Explorer / Lightroom
                </p>
              </div>
            </div>

            {/* Separator Input & Presets */}
            <div className="space-y-3">
              <Label htmlFor="separator" className="text-xs font-semibold text-stone-700 block">
                Pemisah Kode Foto (Separator)
              </Label>
              <Input
                id="separator"
                type="text"
                placeholder="Contoh:  OR  atau , "
                value={codeSeparator}
                onChange={(e) => setCodeSeparator(e.target.value)}
                disabled={isPending}
                className="h-11 rounded-xl bg-stone-50/60 border-stone-200 text-sm focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-mono"
              />

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-stone-500">Pilih Preset Cepat:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SEPARATOR_PRESETS.map((preset) => {
                    const isSelected = codeSeparator === preset.value;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setCodeSeparator(preset.value)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-xs'
                            : 'bg-stone-50/50 border-stone-200 hover:bg-stone-100/70 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{preset.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-amber-600" />}
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sample output */}
              <div className="p-3 rounded-xl bg-stone-100 border border-stone-200/80 text-xs">
                <p className="text-[11px] font-semibold text-stone-600 mb-1">
                  Contoh Hasil Teks Kode Terpilih:
                </p>
                <code className="text-stone-800 font-mono text-[11px] break-all">
                  {['NYK_0821', 'NYK_0824', 'NYK_0830'].join(codeSeparator)}
                </code>
              </div>
            </div>

            {/* Default Max Selection */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <Label htmlFor="maxSelection" className="text-xs font-semibold text-stone-700 block">
                Default Batas Maksimal Foto (Per Sesi Baru)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="maxSelection"
                  type="number"
                  min="1"
                  max="500"
                  value={defaultMaxSelection}
                  onChange={(e) => setDefaultMaxSelection(Number(e.target.value))}
                  disabled={isPending}
                  className="h-11 w-32 rounded-xl bg-stone-50/60 border-stone-200 text-sm focus:bg-white focus:border-amber-500 font-mono text-center font-bold"
                />
                <span className="text-xs text-stone-500">
                  Foto per klien (otomatis terisi saat membuat sesi baru)
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Template Pesan WhatsApp */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Template Pesan WhatsApp Klien
                </h2>
                <p className="text-xs text-stone-500">
                  Pesan otomatis yang dibuka di WhatsApp saat klien menekan tombol Kirim
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="template" className="text-xs font-semibold text-stone-700">
                  Isi Template Pesan
                </Label>
                <span className="text-[11px] text-stone-400">Gunakan tag variabel di bawah</span>
              </div>

              <textarea
                id="template"
                rows={5}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                disabled={isPending}
                className="w-full rounded-2xl bg-stone-50/60 border border-stone-200 p-3.5 text-xs sm:text-sm font-mono text-stone-800 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all resize-y"
              />

              {/* Variable Chips */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-stone-600">
                  Klik tag untuk menyisipkan ke template:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_TAGS.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariable(v.tag)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200/80 text-stone-800 text-xs font-mono transition-colors cursor-pointer"
                      title={v.desc}
                    >
                      <span className="font-bold text-amber-700">{v.tag}</span>
                      <span className="text-[10px] text-stone-500">({v.desc})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Simulation Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  WA
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Live Simulasi Pesan
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Tampilan persis yang diterima fotografer
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Preview Real-time
              </span>
            </div>

            {/* Mock Phone Frame */}
            <div className="rounded-2xl overflow-hidden border border-stone-300 shadow-md">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                    BS
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Budi Santoso (Klien)</p>
                    <p className="text-[10px] text-emerald-200 leading-tight">Online</p>
                  </div>
                </div>
                <div className="text-[10px] bg-emerald-800/60 px-2 py-0.5 rounded text-emerald-100 font-mono">
                  {cleanedWaNumber ? `+${cleanedWaNumber}` : '+62...'}
                </div>
              </div>

              {/* Chat Canvas (WhatsApp Background pattern style) */}
              <div className="bg-[#EFEAE2] p-4 min-h-[260px] flex flex-col justify-end">
                <div className="text-center my-2">
                  <span className="text-[10px] bg-white/80 backdrop-blur-xs text-stone-600 px-2.5 py-0.5 rounded-md shadow-2xs font-medium">
                    HARI INI
                  </span>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="self-end max-w-[90%] bg-white rounded-2xl rounded-tr-xs p-3 shadow-sm border border-stone-200/50 space-y-1">
                  <p className="text-xs text-stone-900 whitespace-pre-wrap leading-relaxed font-sans select-text">
                    {generatePreviewMessage()}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-stone-400 pt-0.5">
                    <span>14:32</span>
                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-stone-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Tips Efisiensi Windows File Explorer</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Dengan separator <code> OR </code>, Anda cukup men-copy daftar kode foto lalu paste langsung ke kolom Search folder Windows Explorer untuk memfilter semua foto terpilih sekaligus!
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Seluruh Pengaturan</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
