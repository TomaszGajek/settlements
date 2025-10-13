-- migration: 20251008120000_create_initial_schema.sql
-- description: creates the initial database schema including tables for profiles, categories, and transactions. it also sets up custom types, indexes, and row-level security policies.
-- affected_tables: public.profiles, public.categories, public.transactions
-- special_notes: this migration lays the foundational structure of the database. business logic (triggers, functions) will be handled in a subsequent migration.

-- step 1: create custom types
-- purpose: defines a custom type for transaction types to ensure data integrity.
create type public.transaction_type as enum ('income', 'expense');

-- step 2: create tables
-- purpose: defines the core tables for the application.

-- table: profiles
-- description: stores user-specific public data, extending supabase's auth.users table.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  updated_at timestamptz
);
comment on table public.profiles is 'stores user-specific public data, extending supabase''s auth.users table.';

-- table: categories
-- description: stores user-defined and default transaction categories.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  is_deletable boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
comment on table public.categories is 'stores user-defined and default transaction categories.';

-- table: transactions
-- description: the main table for storing all user financial transactions.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(10, 2) not null check (amount > 0),
  type public.transaction_type not null,
  date date not null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
comment on table public.transactions is 'the main table for storing all user financial transactions.';

-- step 3: enable row-level security
-- purpose: rls is enabled on all tables to ensure data is protected by default.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- step 4: create row-level security policies
-- purpose: define access control rules for different user roles (anon, authenticated).

-- policies for: public.profiles
-- description: only authenticated users can manage their own profile. anonymous users have no access.
create policy "allow_anon_read_access_on_profiles" on public.profiles for select to anon using (false);
create policy "allow_authenticated_read_own_data_on_profiles" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "allow_authenticated_insert_own_data_on_profiles" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "allow_authenticated_update_own_data_on_profiles" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
-- note: delete policy is omitted as profile deletion is handled via 'on delete cascade' from auth.users.

-- policies for: public.categories
-- description: only authenticated users can manage their own categories. anonymous users have no access.
create policy "allow_anon_read_access_on_categories" on public.categories for select to anon using (false);
create policy "allow_authenticated_read_own_data_on_categories" on public.categories for select to authenticated using (auth.uid() = user_id);
create policy "allow_authenticated_insert_own_data_on_categories" on public.categories for insert to authenticated with check (auth.uid() = user_id);
create policy "allow_authenticated_update_own_data_on_categories" on public.categories for update to authenticated using (auth.uid() = user_id);
create policy "allow_authenticated_delete_own_data_on_categories" on public.categories for delete to authenticated using (auth.uid() = user_id and is_deletable = true);

-- policies for: public.transactions
-- description: only authenticated users can manage their own transactions. anonymous users have no access.
create policy "allow_anon_read_access_on_transactions" on public.transactions for select to anon using (false);
create policy "allow_authenticated_read_own_data_on_transactions" on public.transactions for select to authenticated using (auth.uid() = user_id);
create policy "allow_authenticated_insert_own_data_on_transactions" on public.transactions for insert to authenticated with check (auth.uid() = user_id);
create policy "allow_authenticated_update_own_data_on_transactions" on public.transactions for update to authenticated using (auth.uid() = user_id);
create policy "allow_authenticated_delete_own_data_on_transactions" on public.transactions for delete to authenticated using (auth.uid() = user_id);

-- step 5: create indexes
-- purpose: adds indexes to foreign keys and commonly queried columns to improve query performance.
create index ix_transactions_user_id_date on public.transactions (user_id, date desc);
comment on index public.ix_transactions_user_id_date is 'improves performance for querying transactions for a specific user, sorted by date.';

create index ix_categories_user_id on public.categories (user_id);
comment on index public.ix_categories_user_id is 'improves performance for fetching categories belonging to a user.';

create index ix_transactions_user_id on public.transactions (user_id);
comment on index public.ix_transactions_user_id is 'improves performance for filtering transactions by user.';

create index ix_transactions_category_id on public.transactions (category_id);
comment on index public.ix_transactions_category_id is 'improves performance for filtering transactions by category.';
