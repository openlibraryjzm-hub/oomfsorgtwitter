-- Supabase Storage Configuration for Profile Banners (1500x500 HD)
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query

-- 1. Create public 'banners' storage bucket if it doesn't already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banners',
  'banners',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Storage Policies for 'banners' bucket

-- Public read access: anyone can view profile banners
drop policy if exists "Public Banner Access" on storage.objects;
create policy "Public Banner Access"
  on storage.objects for select
  using (bucket_id = 'banners');

-- Authenticated upload access: users can upload banners to their own folder (auth.uid())
drop policy if exists "Users can upload their own banner" on storage.objects;
create policy "Users can upload their own banner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated update access: users can update banners in their own folder
drop policy if exists "Users can update their own banner" on storage.objects;
create policy "Users can update their own banner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated delete access: users can delete banners from their own folder
drop policy if exists "Users can delete their own banner" on storage.objects;
create policy "Users can delete their own banner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
