-- =========================================
-- SETTINGS (single row)
-- =========================================
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null default '628000000000',   -- format 62xxx, tanpa + dan spasi
  code_separator text not null default ' OR ',
  default_max_selection int not null default 30,
  message_template text not null default
    E'Halo kak, saya {nama} sudah memilih {jumlah} foto:\n\n{kode}',
  updated_at timestamptz default now()
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- =========================================
-- SESSIONS (1 sesi = 1 klien)
-- =========================================
create table if not exists sessions (
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
create index if not exists sessions_status_idx on sessions(status);

-- =========================================
-- PHOTOS (hasil sync dari Google Drive)
-- =========================================
create table if not exists photos (
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
create index if not exists photos_session_idx on photos(session_id, sort_order);

-- =========================================
-- SELECTIONS (pilihan klien saat ini)
-- =========================================
create table if not exists selections (
  session_id uuid not null references sessions(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (session_id, photo_id)
);

-- =========================================
-- SUBMISSIONS (riwayat kirim, termasuk revisi)
-- =========================================
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  photo_codes text[] not null,
  photo_count int not null,
  submitted_at timestamptz default now()
);
create index if not exists submissions_session_idx on submissions(session_id, submitted_at desc);

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
