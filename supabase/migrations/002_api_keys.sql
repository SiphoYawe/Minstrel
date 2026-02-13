-- 002_api_keys.sql: Encrypted API key storage for BYOK model

create table public.user_api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  provider text not null,
  encrypted_key text not null,
  key_last_four text not null,
  status text default 'active' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint uq_user_api_keys_user_provider unique (user_id, provider)
);

create trigger user_api_keys_updated_at
  before update on public.user_api_keys
  for each row execute function public.update_updated_at();

create index idx_user_api_keys_user_id on public.user_api_keys (user_id);
