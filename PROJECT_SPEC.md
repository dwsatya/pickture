# PROJECT SPEC — Website Pilih Foto Wisuda

> Dokumen ini adalah acuan utama project. AI agent wajib membaca file ini sebelum mengerjakan setiap tahap dan mengikuti keputusan yang sudah ditetapkan di sini. Jika ada hal yang tidak tercantum, tanyakan dulu sebelum mengubah arsitektur.

---

## 1. Ringkasan Bisnis

Fotografer wisuda memotret ±300 foto JPG per klien, lalu mengunggahnya ke satu folder Google Drive per klien. Sistem menampilkan foto-foto dari folder tersebut di halaman web dengan link unik per klien. Klien memilih foto hingga batas maksimal yang ditentukan fotografer, lalu menekan tombol **Kirim** yang membuka WhatsApp fotografer dengan daftar kode foto terpilih, misalnya:

```
NYK_8273 OR NYK_2938 OR NYK_8722
```

Daftar ini bisa langsung di-copy-paste ke kolom pencarian Windows File Explorer untuk memunculkan semua foto terpilih sekaligus.

Sistem harus mendukung **10–15 sesi klien aktif bersamaan**, masing-masing dengan link berbeda.

---

## 2. Tech Stack (sudah ditetapkan)

| Kebutuhan | Teknologi |
|---|---|
| Framework | Next.js (versi stabil terbaru, App Router) + TypeScript |
| Styling / UI | Tailwind CSS + shadcn/ui, ikon `lucide-react` |
| Database | Supabase (PostgreSQL) |
| Auth admin | Supabase Auth (email + password, hanya 1 akun admin) |
| Google Drive | Google Drive API v3 via paket `googleapis`, autentikasi **Service Account** |
| ID link unik | `nanoid` (panjang 10, alfabet alfanumerik) |
| Validasi | `zod` |
| Hosting | Vercel (alternatif: Cloudflare / Netlify) |
| Package manager | `pnpm` (atau `npm` jika lebih nyaman) |

Prinsip:
- **Semua akses database dilakukan di server** (Server Components, Server Actions, Route Handlers) memakai Supabase service role key. Browser klien tidak pernah memegang service role key.
- Halaman klien **mobile-first** (mayoritas klien membuka dari HP).
- Bahasa antarmuka: **Bahasa Indonesia**.

---

## 3. Persiapan Eksternal (dilakukan manual oleh fotografer)

1. **Google Cloud Console**
   - Buat project baru.
   - Aktifkan **Google Drive API**.
   - Buat **Service Account**, lalu buat key tipe JSON dan download.
2. **Google Drive**
   - Buat folder induk, mis. `Wisuda`.
   - Share folder induk ke email service account (`xxx@xxx.iam.gserviceaccount.com`) dengan akses **Viewer**. Subfolder klien otomatis ikut ter-share.
   - Struktur: `Wisuda/2026-10-Budi-Santoso/NYK_8273.JPG`, dst.
3. **Supabase**
   - Buat project, jalankan SQL di bagian 5.
   - Buat 1 user admin di menu Authentication.
   - Matikan pendaftaran user baru (Auth → Providers → Email → disable signups).
4. **GitHub** repo + akun **Vercel**.

### Environment variables (`.env.local`, JANGAN di-commit)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Catatan: saat membaca `GOOGLE_PRIVATE_KEY`, ganti `\\n` menjadi newline asli: `process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')`.

Pastikan `.env*.local` ada di `.gitignore`.

---

## 4. Alur Sistem

### 4.1 Alur Admin (fotografer)

1. Login di `/admin/login`.
2. Dashboard `/admin` menampilkan daftar sesi: nama klien, status, jumlah foto, jumlah terpilih/maks, tanggal kedaluwarsa, tombol copy link.
3. **Sesi baru** (`/admin/sessions/new`):
   - Input: nama klien, no. WA klien (opsional), kampus (opsional), tanggal wisuda (opsional), **link folder Google Drive**, maksimal foto (default dari settings), tanggal kedaluwarsa (opsional), catatan.
   - Sistem mem-parse folder ID dari link Drive (format `https://drive.google.com/drive/folders/<ID>` atau `...folders/<ID>?usp=sharing`).
   - Simpan sesi dengan `slug` = nanoid, lalu otomatis jalankan **Sync**.
4. **Sync foto**: ambil semua file gambar di folder, upsert ke tabel `photos`. Bisa dijalankan ulang (tombol "Sync Ulang") jika ada foto tambahan; foto yang sudah dihapus dari Drive ikut dihapus dari DB (beserta seleksinya).
5. Admin menyalin link `https://<domain>/p/<slug>` dan mengirimnya ke klien.
6. **Detail sesi** (`/admin/sessions/[id]`):
   - Info sesi + edit (maks foto, kedaluwarsa, status).
   - Grid foto terpilih.
   - Teks kode terpilih + tombol **Copy kode**.
   - Riwayat submission (jika klien revisi).
   - Tombol **Buka kunci** (status `submitted` → `open`, seleksi tetap ada).
   - Tombol **Tutup sesi** (status `closed`) dan **Hapus sesi** (dengan konfirmasi).
7. **Pengaturan** (`/admin/settings`): no. WhatsApp fotografer, separator kode, template pesan, default maks foto.

### 4.2 Alur Klien

1. Klien membuka `/p/<slug>`.
2. Validasi: slug ada, status `open`, belum kedaluwarsa. Jika tidak valid tampilkan halaman ramah:
   - `submitted` → "Pilihan kamu sudah terkirim. Hubungi fotografer jika ingin mengubah."
   - `closed` / kedaluwarsa → "Sesi pemilihan sudah ditutup."
   - slug tidak ada → 404.
3. Header: nama klien, petunjuk singkat ("Pilih maksimal 30 foto").
4. Grid foto (2 kolom di HP, 3–4 di tablet, 5–6 di desktop), lazy loading, urut berdasarkan nama file.
5. Tap foto → toggle pilih (centang + border tebal). Ikon kaca pembesar di pojok foto → buka **lightbox** (foto lebih besar, swipe kiri/kanan, tombol pilih/batal, nomor kode foto).
6. Bar melayang di bawah layar: **"12 / 30 dipilih"** + tombol **Kirim**. Saat mencapai batas maksimal, foto lain tidak bisa dipilih dan muncul toast "Batas maksimal tercapai".
7. Toggle filter: **Semua** / **Dipilih saja**.
8. Setiap pilih/batal langsung disimpan ke server (optimistic UI, rollback jika gagal). Jika klien menutup browser dan kembali, pilihan tetap ada.
9. Tekan **Kirim** → modal konfirmasi berisi jumlah foto + thumbnail kecil → tekan **Ya, kirim**:
   - Server: validasi jumlah (1..max), simpan ke `submissions`, ubah status sesi menjadi `submitted`, isi `submitted_at`.
   - Server mengembalikan URL WhatsApp.
   - Browser membuka URL WhatsApp, lalu halaman berganti ke tampilan "Terima kasih, pilihan sudah terkirim" + tombol **Buka WhatsApp lagi** (jika WA gagal terbuka).

---

## 5. Skema Database (Supabase / PostgreSQL)

```sql
-- =========================================
-- SETTINGS (single row)
-- =========================================
create table settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null default '628000000000',   -- format 62xxx, tanpa + dan spasi
  code_separator text not null default ' OR ',
  default_max_selection int not null default 30,
  message_template text not null default
    E'Halo kak, saya {nama} sudah memilih {jumlah} foto:\n\n{kode}',
  updated_at timestamptz default now()
);
insert into settings (id) values (1);

-- =========================================
-- SESSIONS (1 sesi = 1 klien)
-- =========================================
create table sessions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  client_name text not null,
  client_phone text,
  university text,
  graduation_date date,
  drive_folder_id text not null,
  max_selection int not null default 30 check (max_selection > 0),
  status text not null default 'open'
    check (status in ('draft','open','submitted','closed')),
  expires_at timestamptz,
  submitted_at timestamptz,
  last_synced_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index sessions_status_idx on sessions(status);

-- =========================================
-- PHOTOS (hasil sync dari Google Drive)
-- =========================================
create table photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  drive_file_id text not null,
  file_name text not null,        -- contoh: NYK_8273.JPG
  code text not null,             -- contoh: NYK_8273 (nama file tanpa ekstensi)
  width int,
  height int,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  unique (session_id, drive_file_id)
);
create index photos_session_idx on photos(session_id, sort_order);

-- =========================================
-- SELECTIONS (pilihan klien saat ini)
-- =========================================
create table selections (
  session_id uuid not null references sessions(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (session_id, photo_id)
);

-- =========================================
-- SUBMISSIONS (riwayat kirim, termasuk revisi)
-- =========================================
create table submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  photo_codes text[] not null,
  photo_count int not null,
  submitted_at timestamptz default now()
);
create index submissions_session_idx on submissions(session_id, submitted_at desc);

-- =========================================
-- RLS: aktifkan di semua tabel, TANPA policy publik.
-- Semua akses lewat server dengan service role key.
-- =========================================
alter table settings enable row level security;
alter table sessions enable row level security;
alter table photos enable row level security;
alter table selections enable row level security;
alter table submissions enable row level security;

-- =========================================
-- FUNCTION: toggle pilihan dengan validasi batas maksimal (atomik)
-- =========================================
create or replace function toggle_selection(p_slug text, p_photo_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_session sessions%rowtype;
  v_exists boolean;
  v_count int;
begin
  select * into v_session from sessions where slug = p_slug for update;
  if not found then
    return json_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if v_session.status <> 'open'
     or (v_session.expires_at is not null and v_session.expires_at < now()) then
    return json_build_object('ok', false, 'error', 'SESSION_CLOSED');
  end if;
  if not exists (select 1 from photos where id = p_photo_id and session_id = v_session.id) then
    return json_build_object('ok', false, 'error', 'PHOTO_NOT_IN_SESSION');
  end if;

  select exists(
    select 1 from selections where session_id = v_session.id and photo_id = p_photo_id
  ) into v_exists;

  if v_exists then
    delete from selections where session_id = v_session.id and photo_id = p_photo_id;
  else
    select count(*) into v_count from selections where session_id = v_session.id;
    if v_count >= v_session.max_selection then
      return json_build_object('ok', false, 'error', 'MAX_REACHED');
    end if;
    insert into selections (session_id, photo_id) values (v_session.id, p_photo_id);
  end if;

  select count(*) into v_count from selections where session_id = v_session.id;
  return json_build_object('ok', true, 'selected', not v_exists, 'count', v_count);
end;
$$;
```

Aturan penting:
- Batas maksimal **wajib divalidasi di server** (function di atas), bukan hanya di UI.
- Jika admin menurunkan `max_selection` di bawah jumlah yang sudah dipilih, klien harus membatalkan beberapa pilihan sebelum bisa Kirim (tombol Kirim nonaktif + pesan).

---

## 6. Integrasi Google Drive

### 6.1 Client Drive (`lib/google-drive.ts`)

```ts
import { google } from 'googleapis';

export function getDrive() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}
```

### 6.2 Sync foto

- Query: `'<FOLDER_ID>' in parents and mimeType contains 'image/' and trashed = false`
- Fields: `nextPageToken, files(id, name, mimeType, imageMediaMetadata(width,height))`
- `pageSize: 1000`, ulangi selama ada `nextPageToken`.
- `supportsAllDrives: true, includeItemsFromAllDrives: true` (aman jika nanti pakai Shared Drive).
- `code` = nama file tanpa ekstensi (`NYK_8273.JPG` → `NYK_8273`). Jangan ubah huruf besar/kecil atau underscore.
- `sort_order` = urutan natural sort berdasarkan `file_name` (gunakan `localeCompare` dengan `{ numeric: true }`).
- Upsert berdasarkan `(session_id, drive_file_id)`; hapus baris `photos` yang tidak ada lagi di Drive.
- Update `sessions.last_synced_at`.
- Jika folder tidak bisa diakses → tampilkan error jelas: "Folder belum di-share ke service account" + email service account-nya.

### 6.3 Menampilkan gambar (proxy + cache)

JANGAN menampilkan file JPG asli (5–15 MB per file). Gunakan API route proxy:

`GET /api/img/[fileId]?size=600`

- `size` hanya boleh salah satu dari: `400`, `600`, `1600` (whitelist, cegah penyalahgunaan).
- Validasi bahwa `fileId` ada di tabel `photos` dan sesinya tidak berstatus `closed`.
- Ambil `thumbnailLink` dari Drive (`files.get` dengan `fields: 'thumbnailLink'`). Link ini berumur pendek, jadi selalu ambil di server.
- Ganti akhiran `=s220` (atau `=s<angka>`) menjadi `=s<size>`.
- Fetch gambar tersebut di server, stream ke browser dengan header:
  - `Content-Type: image/jpeg`
  - `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`
- Grid memakai `size=600`, lightbox memakai `size=1600`.
- Gunakan tag `<img loading="lazy" decoding="async">` biasa (bukan `next/image` optimizer, supaya tidak kena kuota image optimization).
- Fallback: jika `thumbnailLink` kosong (thumbnail belum dibuat Drive), tampilkan placeholder "Memproses foto…".

**Upgrade opsional (Tahap lanjut):** saat sync, download file asli, resize ke WebP 600px & 1600px dengan `sharp`, simpan ke Cloudflare R2 / Supabase Storage. Kerjakan hanya jika proxy terasa lambat.

---

## 7. Format Kode & Pesan WhatsApp

### 7.1 Format kode
- Kode diurutkan natural sort.
- Digabung dengan `settings.code_separator` (default `" OR "`).
- Contoh hasil: `NYK_8273 OR NYK_8301 OR NYK_8422`
- Alasan: pencarian Windows File Explorer mengenali kata kunci `OR` (huruf besar) untuk mencari beberapa file sekaligus; koma tidak dikenali sebagai "atau".

### 7.2 Template pesan
Placeholder yang didukung: `{nama}`, `{jumlah}`, `{kode}`, `{kampus}`, `{link}` (link admin detail sesi tidak disertakan; `{link}` = link halaman klien).

Contoh hasil:
```
Halo kak, saya Budi Santoso sudah memilih 30 foto:

NYK_8273 OR NYK_8301 OR NYK_8422 OR ...
```

### 7.3 URL WhatsApp
```ts
const url = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
```
Simpan submission ke database **sebelum** membuka WhatsApp.

---

## 8. Struktur Folder Project

```
/app
  /(client)
    /p/[slug]/page.tsx              -> halaman pilih foto klien
    /p/[slug]/done/page.tsx         -> halaman terima kasih (opsional, bisa state di page utama)
  /admin
    /login/page.tsx
    /page.tsx                        -> dashboard daftar sesi
    /sessions/new/page.tsx
    /sessions/[id]/page.tsx
    /settings/page.tsx
    layout.tsx                       -> cek login, redirect ke /admin/login
  /api
    /img/[fileId]/route.ts           -> proxy gambar
  layout.tsx
  page.tsx                           -> landing sederhana / redirect
/components
  /client  (PhotoGrid, PhotoCard, Lightbox, SelectionBar, SubmitDialog)
  /admin   (SessionTable, SessionForm, CopyButton, StatusBadge)
  /ui      (shadcn)
/lib
  supabase/server.ts                 -> client service role (server only)
  supabase/auth.ts                   -> helper cek sesi admin
  google-drive.ts
  sync-photos.ts
  format-codes.ts                    -> join kode + render template pesan
  drive-url.ts                       -> parse folder ID dari link
  validations.ts                     -> skema zod
/actions
  admin-sessions.ts                  -> create/update/delete/sync/unlock (server actions)
  client-selection.ts                -> toggleSelection, submitSelection (server actions)
/supabase
  schema.sql                         -> SQL dari bagian 5
PROJECT_SPEC.md
```

Tandai file yang memakai service role key dengan `import 'server-only'`.

---

## 9. Server Actions / Endpoint

| Nama | Akses | Fungsi |
|---|---|---|
| `createSession(data)` | admin | Validasi zod, parse folder ID, buat slug, insert, panggil sync |
| `updateSession(id, data)` | admin | Edit nama, maks, kedaluwarsa, status, catatan |
| `syncSession(id)` | admin | Jalankan sync Drive |
| `unlockSession(id)` | admin | `submitted` → `open` |
| `deleteSession(id)` | admin | Hapus sesi (cascade) |
| `updateSettings(data)` | admin | Simpan pengaturan |
| `getClientSession(slug)` | publik | Data sesi (tanpa `drive_folder_id`, `notes`, `client_phone`), daftar foto, id foto terpilih |
| `toggleSelection(slug, photoId)` | publik | Panggil RPC `toggle_selection` |
| `submitSelection(slug)` | publik | Validasi 1 ≤ jumlah ≤ max & status open, insert submissions, set status `submitted`, return URL WhatsApp |
| `GET /api/img/[fileId]` | publik | Proxy gambar dengan cache |

Semua action admin wajib mengecek user login (Supabase Auth) di awal.

---

## 10. Desain UI

- Tema bersih, netral (putih/abu), aksen satu warna (mis. biru tua atau emas) — cocok untuk nuansa wisuda.
- Font: Inter atau Plus Jakarta Sans.
- Halaman klien:
  - Header ringkas, tidak memakan banyak ruang di HP.
  - Foto rasio asli (tidak di-crop berlebihan), `object-cover` dengan aspect ratio 2:3 untuk grid.
  - Foto terpilih: overlay tipis + ikon centang + border warna aksen.
  - Kode foto (mis. `NYK_8273`) tampil kecil di bawah/pojok foto.
  - Bar bawah sticky: counter + tombol Kirim (nonaktif jika 0 dipilih).
  - Nonaktifkan klik kanan & drag pada gambar (`onContextMenu`, `draggable={false}`).
- Halaman admin: tabel sederhana, badge status berwarna (open = hijau, submitted = biru, closed = abu, draft = kuning).
- Toast notifikasi pakai `sonner` (shadcn).

---

## 11. Keamanan & Edge Case

- Slug acak (nanoid 10 karakter), bukan nama klien.
- `drive_folder_id` tidak pernah dikirim ke browser klien.
- Rate limit sederhana pada `toggleSelection` dan `/api/img` (opsional, mis. via middleware atau Upstash jika dibutuhkan).
- Sesi kedaluwarsa otomatis dianggap tertutup (cek `expires_at` di setiap request).
- Dua tab terbuka bersamaan: function `toggle_selection` memakai `for update` sehingga batas maksimal tetap aman.
- Folder kosong: tampilkan "Foto belum tersedia, silakan hubungi fotografer."
- File non-JPG (mis. `.CR3`, `.NEF`, video) tidak ikut karena filter `mimeType contains 'image/'`; jika RAW ikut terbaca, filter tambahan hanya `image/jpeg` dan `image/png`.

---

## 12. Tahapan Pengerjaan (kerjakan berurutan, tes tiap tahap)

**Tahap 1 — Setup**
Inisialisasi Next.js + TypeScript + Tailwind + shadcn/ui. Pasang `@supabase/supabase-js`, `@supabase/ssr`, `googleapis`, `nanoid`, `zod`, `sonner`, `lucide-react`. Buat `/supabase/schema.sql` dari bagian 5 dan helper Supabase server.
*Selesai jika:* project jalan di localhost, koneksi Supabase berhasil.

**Tahap 2 — Auth admin**
Halaman `/admin/login`, proteksi semua route `/admin/*`, tombol logout.
*Selesai jika:* `/admin` tidak bisa dibuka tanpa login.

**Tahap 3 — CRUD sesi + Sync Drive**
Dashboard, form sesi baru, parse link Drive, sync foto, detail sesi, tombol copy link klien.
*Selesai jika:* membuat sesi dari folder Drive asli menghasilkan ±300 baris di tabel `photos` dengan `code` yang benar.

**Tahap 4 — Proxy gambar**
Route `/api/img/[fileId]` dengan whitelist ukuran dan cache header.
*Selesai jika:* thumbnail tampil di detail sesi admin.

**Tahap 5 — Halaman klien**
Grid, toggle pilih (server action + RPC), counter, lightbox swipe, filter "Dipilih saja", state tersimpan setelah reload.
*Selesai jika:* bisa memilih tepat sampai batas maksimal di HP, dan pilihan tetap ada setelah refresh.

**Tahap 6 — Kirim ke WhatsApp**
Modal konfirmasi, simpan submission, kunci sesi, buka wa.me, halaman terima kasih.
*Selesai jika:* pesan WA berisi kode dengan format yang benar, dan paste kode di Windows Explorer memunculkan foto-foto terpilih.

**Tahap 7 — Fitur admin lanjutan**
Halaman settings, lihat foto terpilih, copy kode, riwayat submission, buka kunci, tutup & hapus sesi.

**Tahap 8 — Deploy**
Push ke GitHub, deploy ke Vercel, isi environment variables di dashboard Vercel, set `NEXT_PUBLIC_APP_URL` ke domain produksi, tes end-to-end dari HP.

---

## 13. Checklist Uji Akhir

- [ ] 15 sesi aktif bersamaan dengan link berbeda, masing-masing menampilkan foto yang benar.
- [ ] Klien tidak bisa memilih lebih dari batas maksimal (termasuk dari 2 tab).
- [ ] Pilihan tersimpan setelah browser ditutup dan dibuka lagi.
- [ ] Setelah Kirim, link klien menampilkan status "sudah terkirim".
- [ ] Admin bisa membuka kunci dan klien bisa revisi lalu kirim ulang (tercatat di riwayat).
- [ ] Kode dari pesan WhatsApp, jika di-paste ke pencarian File Explorer, memunculkan semua foto terpilih.
- [ ] Galeri 300 foto tetap lancar di HP dengan koneksi 4G.
- [ ] Sesi kedaluwarsa tidak bisa diakses klien.
- [ ] Service role key & private key Google tidak muncul di bundle browser.
