-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query

-- 1. Ensure all expected profile columns exist on public.profiles
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists website text;

-- 2. Notify PostgREST to reload its schema cache immediately
notify pgrst, 'reload schema';
