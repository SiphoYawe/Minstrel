-- 001_users.sql: Users profile table with auto-creation trigger
-- References auth.users for Supabase Auth integration

create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  date_of_birth date,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create user profile on auth.users insert
-- COPPA: reject profiles for users under 13 at the database level
alter table public.users add constraint chk_users_coppa_age
  check (date_of_birth is null or date_of_birth <= current_date - interval '13 years');

-- Auto-create user profile on auth.users insert
-- Uses security definer to bypass RLS (trigger runs as function owner, not caller).
-- Note: public.users uses auth.uid() = id (not user_id) because id IS the auth user's ID.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

-- Index for email lookups
create index idx_users_email on public.users (email);
