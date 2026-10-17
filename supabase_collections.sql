-- Supabase Schema for Collections and Presets on oomfs.org

-- 1. Collections master table
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tab_type text not null check (tab_type in ('posts', 'links')),
  title text not null,
  description text,
  icon text default '📁',
  is_pinned boolean default false,
  is_exclusive boolean default false, -- When true: visible ONLY inside this collection, hidden from main "All" feed
  sort_order integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Ordered join table referencing blocks or links
create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  item_id text not null, -- references blocks.id or user profile link id
  position integer not null default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (collection_id, item_id)
);

-- Indexes for fast lookup
create index if not exists idx_collections_user_id on public.collections(user_id);
create index if not exists idx_collections_tab_type on public.collections(tab_type);
create index if not exists idx_collection_items_collection_id on public.collection_items(collection_id);
create index if not exists idx_collection_items_item_id on public.collection_items(item_id);

-- Enable Row Level Security
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

-- Policies for public.collections
create policy "Collections are viewable by everyone."
  on public.collections for select
  using (true);

create policy "Authenticated users can create collections."
  on public.collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collections."
  on public.collections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collections."
  on public.collections for delete
  using (auth.uid() = user_id);

-- Policies for public.collection_items
create policy "Collection items are viewable by everyone."
  on public.collection_items for select
  using (true);

create policy "Users can add items to their collections."
  on public.collection_items for insert
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "Users can update items in their collections."
  on public.collection_items for update
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "Users can delete items from their collections."
  on public.collection_items for delete
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );
