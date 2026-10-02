-- ==============================================================================
-- Sievphov Banchy (សៀវភៅបញ្ជី) - Supabase Cloud Database Architecture & RLS
-- ==============================================================================

-- 1. PROFILES TABLE (Mirrors Supabase Auth Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. CUSTOMERS TABLE
create table if not exists public.customers (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  phone text not null,
  address text default '',
  province text default '',
  date text not null,
  note text default '',
  status text not null check (status in ('active', 'pending', 'debt', 'completed', 'inactive')),
  category text default 'general',
  priority text default 'medium',
  email text,
  telegram text,
  balance numeric default 0,
  currency text default 'USD',
  history jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. NOTES TABLE
create table if not exists public.notes (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text default '',
  category text,
  customer_id text,
  customer_name text,
  color text default 'yellow',
  is_pinned boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. INDEXES FOR PERFORMANCE
create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_customers_date on public.customers(date);
create index if not exists idx_customers_status on public.customers(status);
create index if not exists idx_notes_user_id on public.notes(user_id);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.notes enable row level security;

-- 6. STRICT ISOLATION POLICIES (Users can only read/write their own records)

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Customers
create policy "Users can view own customers"
  on public.customers for select
  using (auth.uid() = user_id);

create policy "Users can insert own customers"
  on public.customers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own customers"
  on public.customers for update
  using (auth.uid() = user_id);

create policy "Users can delete own customers"
  on public.customers for delete
  using (auth.uid() = user_id);

-- Notes
create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- 7. AUTO-CREATE PROFILE ON USER SIGNUP TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
