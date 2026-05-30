-- Churches, organizations, Coptic audio recordings, and Whisper fine-tuning dataset management
-- Churches
create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  address text,
  city text,
  country text,
  logo_url text,
  website text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Church administrators (users who manage the church)
create table if not exists public.church_admins (
  church_id uuid not null references public.churches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (church_id, user_id)
);

-- Organizations within a church (Sunday Kids, Deacons, etc.)
create table if not exists public.church_organizations (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  type text not null default 'other' check (type in ('sunday_kids', 'deacons', 'other')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (church_id, slug)
);

-- Members of church organizations (kids, deacons, teachers)
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.church_organizations (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text not null default 'member' check (role in ('member', 'leader', 'teacher', 'assistant')),
  date_of_birth date,
  notes text,
  added_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Audio recordings of spoken Coptic by organization members (deacons)
create table if not exists public.audio_recordings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.church_organizations (id) on delete cascade,
  recorded_by uuid not null references public.organization_members (id) on delete cascade,
  title text not null,
  transcription text,
  transcription_english text,
  dialect text not null default 'B' check (dialect in ('B', 'S', 'A', 'L', 'F', 'M', 'ALL')),
  audio_url text not null,
  audio_duration_seconds numeric,
  file_size_bytes bigint,
  file_format text,
  status text not null default 'pending' check (status in ('pending', 'transcribed', 'approved', 'rejected')),
  recording_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Whisper fine-tuning datasets (collections of recordings for model training)
create table if not exists public.whisper_datasets (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'preparing', 'ready', 'exported', 'training', 'completed', 'failed')),
  total_recordings integer not null default 0,
  total_duration_seconds numeric not null default 0,
  huggingface_dataset_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Many-to-many: which recordings belong to which dataset
create table if not exists public.whisper_dataset_recordings (
  dataset_id uuid not null references public.whisper_datasets (id) on delete cascade,
  recording_id uuid not null references public.audio_recordings (id) on delete cascade,
  primary key (dataset_id, recording_id)
);

-- Whisper fine-tuning job tracking
create table if not exists public.whisper_fine_tuning_jobs (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.whisper_datasets (id) on delete cascade,
  model_name text not null default 'openai/whisper-small',
  language text not null default 'cop' check (language in ('cop', 'cop-eg')),
  status text not null default 'pending' check (status in ('pending', 'preparing', 'training', 'completed', 'failed')),
  learning_rate numeric,
  num_train_epochs integer default 3,
  batch_size integer default 8,
  trained_model_id text,
  final_loss numeric,
  word_error_rate numeric,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes for performance
create index if not exists audio_recordings_organization_id_idx
  on public.audio_recordings (organization_id);
create index if not exists audio_recordings_recorded_by_idx
  on public.audio_recordings (recorded_by);
create index if not exists audio_recordings_status_idx
  on public.audio_recordings (status);
create index if not exists organization_members_organization_id_idx
  on public.organization_members (organization_id);
create index if not exists whisper_datasets_church_id_idx
  on public.whisper_datasets (church_id);
create index if not exists whisper_fine_tuning_jobs_dataset_id_idx
  on public.whisper_fine_tuning_jobs (dataset_id);
create index if not exists churches_created_by_idx
  on public.churches (created_by);

-- Enable Row Level Security
alter table public.churches enable row level security;
alter table public.church_admins enable row level security;
alter table public.church_organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.audio_recordings enable row level security;
alter table public.whisper_datasets enable row level security;
alter table public.whisper_dataset_recordings enable row level security;
alter table public.whisper_fine_tuning_jobs enable row level security;

-- RLS policies for churches
drop policy if exists "Users can read churches they admin" on public.churches;
drop policy if exists "Users can create churches" on public.churches;
drop policy if exists "Church admins can update their church" on public.churches;
drop policy if exists "Admins can read all churches" on public.churches;

create policy "Users can read churches they admin"
  on public.churches for select
  to authenticated
  using (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = churches.id
        and church_admins.user_id = auth.uid()
    )
    or created_by = auth.uid()
  );

create policy "Users can create churches"
  on public.churches for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Church admins can update their church"
  on public.churches for update
  to authenticated
  using (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = churches.id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
    or created_by = auth.uid()
  );

create policy "Admins can read all churches"
  on public.churches for select
  to authenticated
  using (public.is_admin());

-- RLS policies for church_admins
drop policy if exists "Church admins can read admins" on public.church_admins;
drop policy if exists "Church admins can manage admins" on public.church_admins;

create policy "Church admins can read admins"
  on public.church_admins for select
  to authenticated
  using (
    exists (
      select 1 from public.church_admins as self
      where self.church_id = church_admins.church_id
        and self.user_id = auth.uid()
    )
  );

create policy "Church admins can manage admins"
  on public.church_admins for insert
  to authenticated
  with check (
    exists (
      select 1 from public.church_admins as self
      where self.church_id = church_admins.church_id
        and self.user_id = auth.uid()
        and self.role = 'admin'
    )
    or exists (
      select 1 from public.churches
      where churches.id = church_admins.church_id
        and churches.created_by = auth.uid()
    )
  );

-- RLS policies for church_organizations
drop policy if exists "Church admins can read organizations" on public.church_organizations;
drop policy if exists "Church admins can create organizations" on public.church_organizations;
drop policy if exists "Church admins can update organizations" on public.church_organizations;
drop policy if exists "Church admins can delete organizations" on public.church_organizations;

create policy "Church admins can read organizations"
  on public.church_organizations for select
  to authenticated
  using (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = church_organizations.church_id
        and church_admins.user_id = auth.uid()
    )
  );

create policy "Church admins can create organizations"
  on public.church_organizations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = church_organizations.church_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can update organizations"
  on public.church_organizations for update
  to authenticated
  using (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = church_organizations.church_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can delete organizations"
  on public.church_organizations for delete
  to authenticated
  using (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = church_organizations.church_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

-- RLS policies for organization_members
drop policy if exists "Church admins can read members" on public.organization_members;
drop policy if exists "Church admins can create members" on public.organization_members;
drop policy if exists "Church admins can update members" on public.organization_members;
drop policy if exists "Church admins can delete members" on public.organization_members;

create policy "Church admins can read members"
  on public.organization_members for select
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      join public.church_admins
        on church_admins.church_id = church_organizations.church_id
      where church_organizations.id = organization_members.organization_id
        and church_admins.user_id = auth.uid()
    )
  );

create policy "Church admins can create members"
  on public.organization_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.church_organizations
      join public.church_admins
        on church_admins.church_id = church_organizations.church_id
      where church_organizations.id = organization_members.organization_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can update members"
  on public.organization_members for update
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      join public.church_admins
        on church_admins.church_id = church_organizations.church_id
      where church_organizations.id = organization_members.organization_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can delete members"
  on public.organization_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      join public.church_admins
        on church_admins.church_id = church_organizations.church_id
      where church_organizations.id = organization_members.organization_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

-- RLS policies for audio_recordings
drop policy if exists "Church admins can read recordings" on public.audio_recordings;
drop policy if exists "Church admins can create recordings" on public.audio_recordings;
drop policy if exists "Church admins can update recordings" on public.audio_recordings;
drop policy if exists "Church admins can delete recordings" on public.audio_recordings;

create policy "Church admins can read recordings"
  on public.audio_recordings for select
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      join public.church_admins
        on church_admins.church_id = church_organizations.church_id
      where church_organizations.id = audio_recordings.organization_id
        and church_admins.user_id = auth.uid()
    )
  );

create policy "Church admins can create recordings"
  on public.audio_recordings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.church_organizations
      join public.church_admins
        on church_admins.church_id = church_organizations.church_id
      where church_organizations.id = audio_recordings.organization_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can update recordings"
  on public.audio_recordings for update
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      join public.church_admins
        on church_admins.church_id = church_organizations.church_id
      where church_organizations.id = audio_recordings.organization_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can delete recordings"
  on public.audio_recordings for delete
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      join public.church_admins
        on church_admins.church_id = church_organizations.church_id
      where church_organizations.id = audio_recordings.organization_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

-- RLS policies for whisper_datasets
drop policy if exists "Church admins can read datasets" on public.whisper_datasets;
drop policy if exists "Church admins can create datasets" on public.whisper_datasets;
drop policy if exists "Church admins can update datasets" on public.whisper_datasets;
drop policy if exists "Church admins can delete datasets" on public.whisper_datasets;

create policy "Church admins can read datasets"
  on public.whisper_datasets for select
  to authenticated
  using (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = whisper_datasets.church_id
        and church_admins.user_id = auth.uid()
    )
  );

create policy "Church admins can create datasets"
  on public.whisper_datasets for insert
  to authenticated
  with check (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = whisper_datasets.church_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can update datasets"
  on public.whisper_datasets for update
  to authenticated
  using (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = whisper_datasets.church_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can delete datasets"
  on public.whisper_datasets for delete
  to authenticated
  using (
    exists (
      select 1 from public.church_admins
      where church_admins.church_id = whisper_datasets.church_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

-- RLS policies for whisper_dataset_recordings
drop policy if exists "Church admins can manage dataset recordings" on public.whisper_dataset_recordings;

create policy "Church admins can manage dataset recordings"
  on public.whisper_dataset_recordings for all
  to authenticated
  using (
    exists (
      select 1 from public.whisper_datasets
      join public.church_admins
        on church_admins.church_id = whisper_datasets.church_id
      where whisper_datasets.id = whisper_dataset_recordings.dataset_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

-- RLS policies for whisper_fine_tuning_jobs
drop policy if exists "Church admins can read jobs" on public.whisper_fine_tuning_jobs;
drop policy if exists "Church admins can create jobs" on public.whisper_fine_tuning_jobs;
drop policy if exists "Church admins can update jobs" on public.whisper_fine_tuning_jobs;

create policy "Church admins can read jobs"
  on public.whisper_fine_tuning_jobs for select
  to authenticated
  using (
    exists (
      select 1 from public.whisper_datasets
      join public.church_admins
        on church_admins.church_id = whisper_datasets.church_id
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and church_admins.user_id = auth.uid()
    )
  );

create policy "Church admins can create jobs"
  on public.whisper_fine_tuning_jobs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.whisper_datasets
      join public.church_admins
        on church_admins.church_id = whisper_datasets.church_id
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

create policy "Church admins can update jobs"
  on public.whisper_fine_tuning_jobs for update
  to authenticated
  using (
    exists (
      select 1 from public.whisper_datasets
      join public.church_admins
        on church_admins.church_id = whisper_datasets.church_id
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
  );

