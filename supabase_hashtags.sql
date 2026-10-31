-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- Adds the 'hashtags' array column to public.profiles for the new Hashtags notepad tab

-- 1. Ensure hashtags column exists on public.profiles
alter table public.profiles add column if not exists hashtags text[] default array[]::text[];

-- 2. Notify PostgREST to reload its schema cache immediately
notify pgrst, 'reload schema';
