-- ==============================================================================
-- Supabase Migration: Follows RPC & Mutual OOMFs Calculator
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Ensure self-following is disallowed at the database level
alter table public.follows
  drop constraint if exists follows_no_self_follow;

alter table public.follows
  add constraint follows_no_self_follow check (follower_id <> following_id);

-- 2. Single-roundtrip Profile Follow Stats & Mutuals RPC
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
  -- Total Followers Count
  select count(*)::int into f_count
  from public.follows
  where following_id = target_user_id;

  -- Total Following Count
  select count(*)::int into fg_count
  from public.follows
  where follower_id = target_user_id;

  -- Mutuals (OOMFS) Count:
  -- User X is an OOMF if target follows X AND X follows target
  select count(*)::int into o_count
  from public.follows a
  join public.follows b
    on a.follower_id = b.following_id
   and a.following_id = b.follower_id
  where a.follower_id = target_user_id;

  -- Viewer relationship to target
  if viewer_user_id is not null and viewer_user_id <> target_user_id then
    -- Check if viewer follows target
    select exists (
      select 1 from public.follows
      where follower_id = viewer_user_id
        and following_id = target_user_id
    ) into is_fg;

    -- Check if target follows viewer back (Mutual)
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

-- Grant execution permission to authenticated & anon roles
grant execute on function public.get_profile_follow_stats(uuid, uuid) to anon, authenticated;

-- 3. Function to retrieve mutual OOMFs profiles
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
