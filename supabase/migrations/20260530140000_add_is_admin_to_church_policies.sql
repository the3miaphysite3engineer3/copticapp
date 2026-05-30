-- Allow global website admins to manage church admins and see church data

-- church_admins SELECT: admins can read all
drop policy if exists "Church admins can read admins" on public.church_admins;
create policy "Church admins can read admins"
  on public.church_admins for select
  to authenticated
  using (
    public.is_church_admin(church_admins.church_id)
    or public.is_admin()
  );

-- church_admins INSERT: admins can add any church admin
drop policy if exists "Church admins can manage admins" on public.church_admins;
create policy "Church admins can manage admins"
  on public.church_admins for insert
  to authenticated
  with check (
    public.is_church_admin(church_admins.church_id)
    or public.is_admin()
    or exists (
      select 1 from public.churches
      where churches.id = church_admins.church_id
        and churches.created_by = auth.uid()
    )
  );

-- church_admins UPDATE: admins can update any church admin
drop policy if exists "Church admins can update admins" on public.church_admins;
create policy "Church admins can update admins"
  on public.church_admins for update
  to authenticated
  using (
    public.is_church_admin(church_admins.church_id)
    or public.is_admin()
  );

-- church_admins DELETE: admins can delete any church admin
drop policy if exists "Church admins can delete admins" on public.church_admins;
create policy "Church admins can delete admins"
  on public.church_admins for delete
  to authenticated
  using (
    public.is_church_admin(church_admins.church_id)
    or public.is_admin()
  );

-- churches SELECT: admins can read all
drop policy if exists "Users can read churches they admin" on public.churches;
create policy "Users can read churches they admin"
  on public.churches for select
  to authenticated
  using (
    public.is_church_admin(churches.id)
    or created_by = auth.uid()
    or public.is_admin()
  );

-- churches UPDATE: admins can update any
drop policy if exists "Church admins can update their church" on public.churches;
create policy "Church admins can update their church"
  on public.churches for update
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_church_admin(churches.id)
      and exists (
        select 1 from public.church_admins
        where church_admins.church_id = churches.id
          and church_admins.user_id = auth.uid()
          and church_admins.role in ('admin', 'editor')
      )
      or created_by = auth.uid()
    )
  );

-- All other church-related tables: admins can read/manage
-- church_organizations
drop policy if exists "Church admins can read organizations" on public.church_organizations;
create policy "Church admins can read organizations"
  on public.church_organizations for select
  to authenticated
  using (
    public.is_church_admin(church_organizations.church_id)
    or public.is_admin()
  );

drop policy if exists "Church admins can create organizations" on public.church_organizations;
create policy "Church admins can create organizations"
  on public.church_organizations for insert
  to authenticated
  with check (
    public.is_church_admin(church_organizations.church_id)
    or public.is_admin()
  );

drop policy if exists "Church admins can update organizations" on public.church_organizations;
create policy "Church admins can update organizations"
  on public.church_organizations for update
  to authenticated
  using (
    public.is_church_admin(church_organizations.church_id)
    or public.is_admin()
  );

drop policy if exists "Church admins can delete organizations" on public.church_organizations;
create policy "Church admins can delete organizations"
  on public.church_organizations for delete
  to authenticated
  using (
    public.is_church_admin(church_organizations.church_id)
    or public.is_admin()
  );

-- organization_members
drop policy if exists "Church admins can read members" on public.organization_members;
create policy "Church admins can read members"
  on public.organization_members for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

drop policy if exists "Church admins can create members" on public.organization_members;
create policy "Church admins can create members"
  on public.organization_members for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

drop policy if exists "Church admins can update members" on public.organization_members;
create policy "Church admins can update members"
  on public.organization_members for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

drop policy if exists "Church admins can delete members" on public.organization_members;
create policy "Church admins can delete members"
  on public.organization_members for delete
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

-- audio_recordings
drop policy if exists "Church admins can read recordings" on public.audio_recordings;
create policy "Church admins can read recordings"
  on public.audio_recordings for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = audio_recordings.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

drop policy if exists "Church admins can create recordings" on public.audio_recordings;
create policy "Church admins can create recordings"
  on public.audio_recordings for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = audio_recordings.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

drop policy if exists "Church admins can update recordings" on public.audio_recordings;
create policy "Church admins can update recordings"
  on public.audio_recordings for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = audio_recordings.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

drop policy if exists "Church admins can delete recordings" on public.audio_recordings;
create policy "Church admins can delete recordings"
  on public.audio_recordings for delete
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = audio_recordings.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

-- whisper_datasets
drop policy if exists "Church admins can read datasets" on public.whisper_datasets;
create policy "Church admins can read datasets"
  on public.whisper_datasets for select
  to authenticated
  using (
    public.is_church_admin(whisper_datasets.church_id)
    or public.is_admin()
  );

drop policy if exists "Church admins can create datasets" on public.whisper_datasets;
create policy "Church admins can create datasets"
  on public.whisper_datasets for insert
  to authenticated
  with check (
    public.is_church_admin(whisper_datasets.church_id)
    or public.is_admin()
  );

drop policy if exists "Church admins can update datasets" on public.whisper_datasets;
create policy "Church admins can update datasets"
  on public.whisper_datasets for update
  to authenticated
  using (
    public.is_church_admin(whisper_datasets.church_id)
    or public.is_admin()
  );

drop policy if exists "Church admins can delete datasets" on public.whisper_datasets;
create policy "Church admins can delete datasets"
  on public.whisper_datasets for delete
  to authenticated
  using (
    public.is_church_admin(whisper_datasets.church_id)
    or public.is_admin()
  );

-- whisper_dataset_recordings
drop policy if exists "Church admins can manage dataset recordings" on public.whisper_dataset_recordings;
create policy "Church admins can manage dataset recordings"
  on public.whisper_dataset_recordings for all
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.whisper_datasets
      where whisper_datasets.id = whisper_dataset_recordings.dataset_id
        and public.is_church_admin(whisper_datasets.church_id)
    )
  );

-- whisper_fine_tuning_jobs
drop policy if exists "Church admins can read jobs" on public.whisper_fine_tuning_jobs;
create policy "Church admins can read jobs"
  on public.whisper_fine_tuning_jobs for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.whisper_datasets
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and public.is_church_admin(whisper_datasets.church_id)
    )
  );

drop policy if exists "Church admins can create jobs" on public.whisper_fine_tuning_jobs;
create policy "Church admins can create jobs"
  on public.whisper_fine_tuning_jobs for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.whisper_datasets
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and public.is_church_admin(whisper_datasets.church_id)
    )
  );

drop policy if exists "Church admins can update jobs" on public.whisper_fine_tuning_jobs;
create policy "Church admins can update jobs"
  on public.whisper_fine_tuning_jobs for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.whisper_datasets
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and public.is_church_admin(whisper_datasets.church_id)
    )
  );
