-- ==============================================================================
-- Migration: Add target_user_id to blocks table for Cross-Profile Comments
-- ==============================================================================
-- This allows comments left on ANY profile to be stored with:
--   - user_id = Comment author (enforced by RLS auth.uid() = user_id)
--   - target_user_id = Profile recipient (the profile where the comment is displayed)
-- ==============================================================================

-- 1. Add target_user_id column to public.blocks
alter table public.blocks 
add column if not exists target_user_id uuid references public.profiles(id) on delete cascade;

-- 2. Backfill existing comments with target_user_id from content.targetUsername if available
update public.blocks b
set target_user_id = p.id
from public.profiles p
where b.type = 'comment' 
  and b.target_user_id is null
  and lower(b.content->>'targetUsername') = lower(p.username);

-- 3. For any comments left without targetUsername, or on own profile, default target_user_id = user_id
update public.blocks
set target_user_id = user_id
where type = 'comment' and target_user_id is null;

-- 4. Create composite index for instant retrieval of comments by target profile
create index if not exists idx_blocks_target_user_id_type on public.blocks (target_user_id, type);

-- 5. Update delete policy on blocks so both the comment author AND the profile owner can delete comments
drop policy if exists "Users can delete their own blocks." on public.blocks;
drop policy if exists "Users can delete their own blocks or comments on their profile." on public.blocks;

create policy "Users can delete their own blocks or comments on their profile."
  on public.blocks for delete
  using (
    auth.uid() = user_id 
    or (type = 'comment' and auth.uid() = target_user_id)
  );

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
