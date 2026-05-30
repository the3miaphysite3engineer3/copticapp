-- Security definer function to get pending invitations for the current user's email
create or replace function public.get_my_pending_invitations()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_email text;
  result jsonb;
begin
  v_user_email := auth.email();
  if v_user_email is null then
    return '[]'::jsonb;
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', inv.id,
      'token', inv.token,
      'email', inv.email,
      'status', inv.status,
      'organization_name', org.name,
      'church_name', c.name,
      'created_at', inv.created_at
    )
    order by inv.created_at desc
  )
  into result
  from public.organization_invitations inv
  join public.church_organizations org on org.id = inv.organization_id
  join public.churches c on c.id = org.church_id
  where lower(inv.email) = lower(v_user_email)
    and inv.status = 'pending';

  return coalesce(result, '[]'::jsonb);
end;
$$;

grant execute on function public.get_my_pending_invitations() to authenticated;
