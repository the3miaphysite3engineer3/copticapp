-- Fix infinite recursion in church_admins RLS policies.
-- All policies that check church_admins membership do so via direct subqueries,
-- which triggers the church_admins SELECT policy, which also queries church_admins = recursion.
-- A security definer function bypasses RLS and breaks the cycle.

create or replace function public.is_church_admin(church_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.church_admins
    where church_admins.church_id = is_church_admin.church_id
      and church_admins.user_id = auth.uid()
  );
$$;

grant execute on function public.is_church_admin(uuid) to authenticated;

-- Fix church_admins SELECT policy: use security definer function instead of self-referencing subquery
drop policy if exists "Church admins can read admins" on public.church_admins;
create policy "Church admins can read admins"
  on public.church_admins for select
  to authenticated
  using (public.is_church_admin(church_admins.church_id));

-- Rewrite all other policies that queried church_admins to use the function instead
-- Churches policies
drop policy if exists "Users can read churches they admin" on public.churches;
drop policy if exists "Church admins can update their church" on public.churches;

create policy "Users can read churches they admin"
  on public.churches for select
  to authenticated
  using (
    public.is_church_admin(churches.id)
    or created_by = auth.uid()
  );

create policy "Church admins can update their church"
  on public.churches for update
  to authenticated
  using (
    public.is_church_admin(churches.id)
    and exists (
      select 1 from public.church_admins
      where church_admins.church_id = churches.id
        and church_admins.user_id = auth.uid()
        and church_admins.role in ('admin', 'editor')
    )
    or created_by = auth.uid()
  );

-- NOTE: The UPDATE policy still uses a direct subquery inside the security definer
-- function's safe check. This is fine because the subquery only runs when
-- is_church_admin() already returned true (short-circuit via AND).

-- Church admins manage admins policy (insert)
drop policy if exists "Church admins can manage admins" on public.church_admins;
create policy "Church admins can manage admins"
  on public.church_admins for insert
  to authenticated
  with check (
    public.is_church_admin(church_admins.church_id)
    or exists (
      select 1 from public.churches
      where churches.id = church_admins.church_id
        and churches.created_by = auth.uid()
    )
  );

-- Church organizations policies
drop policy if exists "Church admins can read organizations" on public.church_organizations;
drop policy if exists "Church admins can create organizations" on public.church_organizations;
drop policy if exists "Church admins can update organizations" on public.church_organizations;
drop policy if exists "Church admins can delete organizations" on public.church_organizations;

create policy "Church admins can read organizations"
  on public.church_organizations for select
  to authenticated
  using (public.is_church_admin(church_organizations.church_id));

create policy "Church admins can create organizations"
  on public.church_organizations for insert
  to authenticated
  with check (public.is_church_admin(church_organizations.church_id));

create policy "Church admins can update organizations"
  on public.church_organizations for update
  to authenticated
  using (public.is_church_admin(church_organizations.church_id));

create policy "Church admins can delete organizations"
  on public.church_organizations for delete
  to authenticated
  using (public.is_church_admin(church_organizations.church_id));

-- Organization members policies
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
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

create policy "Church admins can create members"
  on public.organization_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

create policy "Church admins can update members"
  on public.organization_members for update
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

create policy "Church admins can delete members"
  on public.organization_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

-- Audio recordings policies
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
        and public.is_church_admin(church_organizations.church_id)
    )
  );

create policy "Church admins can create recordings"
  on public.audio_recordings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = audio_recordings.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

create policy "Church admins can update recordings"
  on public.audio_recordings for update
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = audio_recordings.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

create policy "Church admins can delete recordings"
  on public.audio_recordings for delete
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = audio_recordings.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

-- Whisper datasets policies
drop policy if exists "Church admins can read datasets" on public.whisper_datasets;
drop policy if exists "Church admins can create datasets" on public.whisper_datasets;
drop policy if exists "Church admins can update datasets" on public.whisper_datasets;
drop policy if exists "Church admins can delete datasets" on public.whisper_datasets;

create policy "Church admins can read datasets"
  on public.whisper_datasets for select
  to authenticated
  using (public.is_church_admin(whisper_datasets.church_id));

create policy "Church admins can create datasets"
  on public.whisper_datasets for insert
  to authenticated
  with check (public.is_church_admin(whisper_datasets.church_id));

create policy "Church admins can update datasets"
  on public.whisper_datasets for update
  to authenticated
  using (public.is_church_admin(whisper_datasets.church_id));

create policy "Church admins can delete datasets"
  on public.whisper_datasets for delete
  to authenticated
  using (public.is_church_admin(whisper_datasets.church_id));

-- Whisper dataset recordings policies
drop policy if exists "Church admins can manage dataset recordings" on public.whisper_dataset_recordings;
create policy "Church admins can manage dataset recordings"
  on public.whisper_dataset_recordings for all
  to authenticated
  using (
    exists (
      select 1 from public.whisper_datasets
      where whisper_datasets.id = whisper_dataset_recordings.dataset_id
        and public.is_church_admin(whisper_datasets.church_id)
    )
  );

-- Whisper fine-tuning jobs policies
drop policy if exists "Church admins can read jobs" on public.whisper_fine_tuning_jobs;
drop policy if exists "Church admins can create jobs" on public.whisper_fine_tuning_jobs;
drop policy if exists "Church admins can update jobs" on public.whisper_fine_tuning_jobs;

create policy "Church admins can read jobs"
  on public.whisper_fine_tuning_jobs for select
  to authenticated
  using (
    exists (
      select 1 from public.whisper_datasets
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and public.is_church_admin(whisper_datasets.church_id)
    )
  );

create policy "Church admins can create jobs"
  on public.whisper_fine_tuning_jobs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.whisper_datasets
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and public.is_church_admin(whisper_datasets.church_id)
    )
  );

create policy "Church admins can update jobs"
  on public.whisper_fine_tuning_jobs for update
  to authenticated
  using (
    exists (
      select 1 from public.whisper_datasets
      where whisper_datasets.id = whisper_fine_tuning_jobs.dataset_id
        and public.is_church_admin(whisper_datasets.church_id)
    )
  );
