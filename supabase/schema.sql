-- Ejecuta esto en Supabase: Dashboard -> SQL Editor -> New query -> pega y Run

create type case_status as enum ('Ready to Review', 'Graded', 'Skipped', 'Closed');

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  pd text not null,
  report_number text not null unique,
  summary text,
  incident_date date,
  suspect text not null,
  suspect_dob text,
  incident_location text,
  charges text,
  police_officers text,
  incident_type text,
  report_link text,
  report_link_2 text,
  notes text,
  status case_status not null default 'Ready to Review',
  rating smallint check (rating between 0 and 5) default 0,
  pdf_path text,
  created_at timestamptz not null default now(),
  charges_number text
);

create index if not exists cases_status_idx on cases (status);
create index if not exists cases_incident_date_idx on cases (incident_date desc);

-- Row Level Security: por ahora abierto a lectura para el anon key.
-- Cuando agreguemos login, esto se reemplaza por políticas basadas en auth.uid().
alter table cases enable row level security;

create policy "Lectura pública temporal"
  on cases for select
  using (true);

-- Bucket de Storage para los PDFs (créalo también desde el Dashboard -> Storage -> New bucket
-- llamado "incident-reports"). Si lo marcas como público, report_link se resuelve directo;
-- si es privado, el frontend pedirá una signed URL.
