-- Security definer function to add a church admin, bypassing RLS
-- This avoids recursion/RLS issues when inserting the first admin of a church

create or replace function public.add_church_admin(
  p_church_id uuid,
  p_user_id uuid,
  p_role text default 'admin'
)
returns void
language sql
security definer
as $$
  insert into public.church_admins (church_id, user_id, role)
  values (p_church_id, p_user_id, p_role)
  on conflict (church_id, user_id) do nothing;
$$;

grant execute on function public.add_church_admin(uuid, uuid, text) to authenticated;
