-- Organization invitations: invite registered users to join an organization

-- Add user_id to organization_members to link members to auth users
alter table public.organization_members
  add column user_id uuid references public.profiles (id) on delete set null;

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

-- Organization invitations table
create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.church_organizations (id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  expires_at timestamptz not null default timezone('utc', now() + interval '7 days')
);

create index if not exists organization_invitations_token_idx
  on public.organization_invitations (token);
create index if not exists organization_invitations_org_idx
  on public.organization_invitations (organization_id);
create index if not exists organization_invitations_email_idx
  on public.organization_invitations (email);

alter table public.organization_invitations enable row level security;

-- Security definer function to look up an invitation by token (publicly accessible)
create or replace function public.get_invitation_by_token(p_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  inv public.organization_invitations;
  org_name text;
  church_name text;
begin
  select * into inv
  from public.organization_invitations
  where token = p_token
  limit 1;

  if inv.id is null then
    return null;
  end if;

  select co.name into org_name
  from public.church_organizations co
  where co.id = inv.organization_id;

  select c.name into church_name
  from public.church_organizations co
  join public.churches c on c.id = co.church_id
  where co.id = inv.organization_id;

  return jsonb_build_object(
    'id', inv.id,
    'organization_id', inv.organization_id,
    'email', inv.email,
    'status', inv.status,
    'organization_name', org_name,
    'church_name', church_name,
    'created_at', inv.created_at,
    'expires_at', inv.expires_at
  );
end;
$$;

grant execute on function public.get_invitation_by_token(text) to anon, authenticated;

-- Security definer function to accept an invitation
create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  inv public.organization_invitations;
  v_user_id uuid;
  v_user_email text;
  v_full_name text;
  new_member_id uuid;
begin
  -- Look up the invitation
  select * into inv
  from public.organization_invitations
  where token = p_token
  limit 1;

  if inv.id is null then
    return jsonb_build_object('error', 'Invitation not found.');
  end if;

  if inv.status != 'pending' then
    return jsonb_build_object('error', 'Invitation is no longer valid.');
  end if;

  if inv.expires_at < timezone('utc', now()) then
    update public.organization_invitations set status = 'expired' where id = inv.id;
    return jsonb_build_object('error', 'Invitation has expired.');
  end if;

  -- Get current user info
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('error', 'You must be signed in to accept an invitation.');
  end if;

  select email, full_name into v_user_email, v_full_name
  from public.profiles
  where id = v_user_id;

  if lower(v_user_email) != lower(inv.email) then
    return jsonb_build_object(
      'error', 'This invitation was sent to ' || inv.email || ', but you are signed in as ' || v_user_email || '.'
    );
  end if;

  -- Check if already a member of this organization
  if exists (
    select 1 from public.organization_members
    where organization_id = inv.organization_id
      and user_id = v_user_id
  ) then
    -- Still mark invitation as accepted since they're already in
    update public.organization_invitations
    set status = 'accepted', accepted_at = timezone('utc', now())
    where id = inv.id;
    return jsonb_build_object('success', true, 'already_member', true);
  end if;

  -- Create the member record
  insert into public.organization_members (
    organization_id,
    full_name,
    email,
    role,
    user_id,
    added_by
  ) values (
    inv.organization_id,
    coalesce(v_full_name, split_part(v_user_email, '@', 1)),
    v_user_email,
    'member',
    v_user_id,
    inv.invited_by
  )
  returning id into new_member_id;

  -- Mark invitation as accepted
  update public.organization_invitations
  set status = 'accepted', accepted_at = timezone('utc', now())
  where id = inv.id;

  return jsonb_build_object('success', true, 'member_id', new_member_id);
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;

-- RLS policies for organization_invitations

-- Church admins and global admins can read invitations
drop policy if exists "Admins can read invitations" on public.organization_invitations;
create policy "Admins can read invitations"
  on public.organization_invitations for select
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_invitations.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
    or public.is_admin()
  );

-- Church admins and global admins can create invitations
drop policy if exists "Admins can create invitations" on public.organization_invitations;
create policy "Admins can create invitations"
  on public.organization_invitations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_invitations.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
    or public.is_admin()
  );

-- Church admins and global admins can update invitations (e.g. revoke)
drop policy if exists "Admins can update invitations" on public.organization_invitations;
create policy "Admins can update invitations"
  on public.organization_invitations for update
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_invitations.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
    or public.is_admin()
  );

-- Church admins and global admins can delete invitations
drop policy if exists "Admins can delete invitations" on public.organization_invitations;
create policy "Admins can delete invitations"
  on public.organization_invitations for delete
  to authenticated
  using (
    exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_invitations.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
    or public.is_admin()
  );

-- Update organization_members SELECT policy to allow members to see themselves
drop policy if exists "Church admins can read members" on public.organization_members;
create policy "Church admins can read members"
  on public.organization_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.church_organizations
      where church_organizations.id = organization_members.organization_id
        and public.is_church_admin(church_organizations.church_id)
    )
  );

-- Update organization_members INSERT to also allow users to be added via accept_invitation
-- (which is security definer, so no change needed for that path)
-- Keep existing admin insert policy but also add is_admin()

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

-- Keep existing update/delete policies for admins
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
