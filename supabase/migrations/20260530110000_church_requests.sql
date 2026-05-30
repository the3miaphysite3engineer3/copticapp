-- Church requests: public form for churches to request joining the platform

create table if not exists public.church_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  city text,
  country text,
  requester_name text not null,
  requester_email text not null,
  facebook_page_url text not null,
  confirmation_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  confirmed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references public.profiles (id) on delete set null
);

create index if not exists church_requests_status_idx on public.church_requests (status);
create index if not exists church_requests_confirmation_token_idx on public.church_requests (confirmation_token);

alter table public.church_requests enable row level security;

-- Anyone can submit a request (public form)
drop policy if exists "Anyone can create church requests" on public.church_requests;
create policy "Anyone can create church requests"
  on public.church_requests for insert
  to anon, authenticated
  with check (true);

-- Only admins can view requests
drop policy if exists "Admins can read church requests" on public.church_requests;
create policy "Admins can read church requests"
  on public.church_requests for select
  to authenticated
  using (public.is_admin());

-- Only admins can update requests (approve/reject)
drop policy if exists "Admins can update church requests" on public.church_requests;
create policy "Admins can update church requests"
  on public.church_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
