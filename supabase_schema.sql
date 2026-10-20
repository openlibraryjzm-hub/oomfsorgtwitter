-- Supabase Database Schema for oomfs.org

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  name text,
  avatar_url text,
  banner_url text,
  bio text,
  location text,
  website text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." 
  on public.profiles for select 
  using (true);

create policy "Users can insert their own profile." 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update their own profile." 
  on public.profiles for update 
  using (auth.uid() = id);

-- 2. BLOCKS TABLE (Posts, Carousels, Boards, Links, Comments)
create table if not exists public.blocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('standard', 'carousel', 'board', 'link_card', 'comment')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS on blocks
alter table public.blocks enable row level security;

-- Blocks Policies
create policy "Blocks are viewable by everyone." 
  on public.blocks for select 
  using (true);

create policy "Authenticated users can insert blocks." 
  on public.blocks for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own blocks." 
  on public.blocks for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own blocks or comments on their profile." 
  on public.blocks for delete 
  using (
    auth.uid() = user_id 
    or (type = 'comment' and auth.uid() = target_user_id)
  );

create index if not exists idx_blocks_target_user_id_type on public.blocks (target_user_id, type);

-- 3. FOLLOWS TABLE (Mutuals / OOMFs)
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

-- Enable RLS on follows
alter table public.follows enable row level security;

-- Follows Policies
create policy "Follows are viewable by everyone." 
  on public.follows for select 
  using (true);

create policy "Authenticated users can follow." 
  on public.follows for insert 
  with check (auth.uid() = follower_id);

create policy "Users can unfollow." 
  on public.follows for delete 
  using (auth.uid() = follower_id);

-- 4. AUTO-CREATE PROFILE ON AUTH SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_user_name text;
begin
  raw_user_name := coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  insert into public.profiles (id, username, name, avatar_url)
  values (
    new.id,
    lower(raw_user_name),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', raw_user_name),
    replace(coalesce(new.raw_user_meta_data->>'avatar_url', ''), '_normal.', '_400x400.')
  )
  on conflict (id) do update set
    avatar_url = excluded.avatar_url;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. FOLLOWS CONSTRAINTS & RPC FUNCTIONS
alter table public.follows
  drop constraint if exists follows_no_self_follow;

alter table public.follows
  add constraint follows_no_self_follow check (follower_id <> following_id);

-- Profile Follow Stats & Mutuals RPC
create or replace function public.get_profile_follow_stats(
  target_user_id uuid,
  viewer_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  f_count integer := 0;
  fg_count integer := 0;
  o_count integer := 0;
  is_fg boolean := false;
  is_m boolean := false;
begin
  select count(*)::int into f_count
  from public.follows
  where following_id = target_user_id;

  select count(*)::int into fg_count
  from public.follows
  where follower_id = target_user_id;

  select count(*)::int into o_count
  from public.follows a
  join public.follows b
    on a.follower_id = b.following_id
   and a.following_id = b.follower_id
  where a.follower_id = target_user_id;

  if viewer_user_id is not null and viewer_user_id <> target_user_id then
    select exists (
      select 1 from public.follows
      where follower_id = viewer_user_id
        and following_id = target_user_id
    ) into is_fg;

    if is_fg then
      select exists (
        select 1 from public.follows
        where follower_id = target_user_id
          and following_id = viewer_user_id
      ) into is_m;
    end if;
  end if;

  return jsonb_build_object(
    'followers_count', f_count,
    'following_count', fg_count,
    'oomfs_count', o_count,
    'is_following', is_fg,
    'is_mutual', is_m
  );
end;
$$;

grant execute on function public.get_profile_follow_stats(uuid, uuid) to anon, authenticated;

-- Mutual OOMFs Directory Query Function
create or replace function public.get_mutual_oomfs(target_user_id uuid)
returns setof public.profiles
language sql
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.id in (
    select a.following_id
    from public.follows a
    join public.follows b
      on a.follower_id = b.following_id
     and a.following_id = b.follower_id
    where a.follower_id = target_user_id
  );
$$;

grant execute on function public.get_mutual_oomfs(uuid) to anon, authenticated;

-- 6. COLLECTIONS & PRESETS
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tab_type text not null check (tab_type in ('posts', 'links')),
  title text not null,
  description text,
  icon text default '📁',
  is_pinned boolean default false,
  is_exclusive boolean default false,
  slug text,
  is_default boolean default false,
  sort_order integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  item_id text not null,
  position integer not null default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (collection_id, item_id)
);

create index if not exists idx_collections_user_id on public.collections(user_id);
create index if not exists idx_collections_tab_type on public.collections(tab_type);
create unique index if not exists idx_collections_user_slug on public.collections(user_id, slug) where tab_type = 'links' and slug is not null;
create index if not exists idx_collection_items_collection_id on public.collection_items(collection_id);
create index if not exists idx_collection_items_item_id on public.collection_items(item_id);

alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

create policy "Collections are viewable by everyone."
  on public.collections for select using (true);

create policy "Authenticated users can create collections."
  on public.collections for insert with check (auth.uid() = user_id);

create policy "Users can update their own collections."
  on public.collections for update using (auth.uid() = user_id);

create policy "Users can delete their own collections."
  on public.collections for delete using (auth.uid() = user_id);

create policy "Collection items are viewable by everyone."
  on public.collection_items for select using (true);

create policy "Users can add items to their collections."
  on public.collection_items for insert with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "Users can update items in their collections."
  on public.collection_items for update using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "Users can delete items from their collections."
  on public.collection_items for delete using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

