-- ==============================================================================
-- Sievphov Banchy (សៀវភៅបញ្ជី) - Supabase Cloud Database Architecture & RLS
-- PostgreSQL Schema with Row Level Security, Triggers & Realtime Replication
-- ==============================================================================

-- Enable required cryptographic extensions for UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (Mirrors Supabase Auth Users)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 2. CUSTOMERS TABLE (Customer & Debt records)
-- ==============================================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_name text not null,
  product_category text default 'general',
  amount numeric default 0,
  price_of_goods numeric default 0,
  outstanding_debt numeric default 0,
  notes text default '',
  phone text default '',
  address text default '',
  province text default '',
  date text default to_char(now(), 'YYYY-MM-DD'),
  status text default 'active' check (status in ('active', 'pending', 'debt', 'completed', 'inactive')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  email text default '',
  telegram text default '',
  currency text default 'USD',
  history jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 3. NOTES TABLE (General Business & Customer Notes)
-- ==============================================================================
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text default '',
  category text,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  color text default 'yellow',
  is_pinned boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_customers_created_at on public.customers(created_at desc);
create index if not exists idx_customers_updated_at on public.customers(updated_at desc);
create index if not exists idx_customers_customer_name on public.customers(customer_name);
create index if not exists idx_customers_status on public.customers(status);

create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_notes_created_at on public.notes(created_at desc);
create index if not exists idx_notes_updated_at on public.notes(updated_at desc);
create index if not exists idx_notes_customer_id on public.notes(customer_id);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.notes enable row level security;

-- Force RLS for table owners to avoid accidental security bypass
alter table public.customers force row level security;
alter table public.notes force row level security;

-- ------------------------------------------------------------------------------
-- CUSTOMERS POLICIES (Strict User Isolation)
-- User A can NEVER view, insert, update, or delete User B's records!
-- ------------------------------------------------------------------------------
drop policy if exists "Users can select own customers" on public.customers;
create policy "Users can select own customers"
  on public.customers for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own customers" on public.customers;
create policy "Users can insert own customers"
  on public.customers for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own customers" on public.customers;
create policy "Users can update own customers"
  on public.customers for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own customers" on public.customers;
create policy "Users can delete own customers"
  on public.customers for delete
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- NOTES POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Users can select own notes" on public.notes;
create policy "Users can select own notes"
  on public.notes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes"
  on public.notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes"
  on public.notes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ==============================================================================
-- 6. AUTOMATIC updated_at TRIGGER FUNCTION
-- ==============================================================================
create or replace function public.set_updated_at_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on Customers
drop trigger if exists trigger_set_customers_updated_at on public.customers;
create trigger trigger_set_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at_timestamp();

-- Trigger on Notes
drop trigger if exists trigger_set_notes_updated_at on public.notes;
create trigger trigger_set_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at_timestamp();

-- Trigger on Profiles
drop trigger if exists trigger_set_profiles_updated_at on public.profiles;
create trigger trigger_set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at_timestamp();

-- ==============================================================================
-- 7. SUPABASE REALTIME REPLICATION CONFIGURATION
-- ==============================================================================
-- Set replica identity to full so DELETE and UPDATE events contain old and new rows
alter table public.customers replica identity full;
alter table public.notes replica identity full;

-- Add tables to the supabase_realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'customers'
  ) then
    alter publication supabase_realtime add table public.customers;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end $$;

-- ==============================================================================
-- 8. AUTO-CREATE PROFILE ON AUTH USER SIGNUP TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
