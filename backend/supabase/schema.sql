create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null
    check (char_length(display_name) between 1 and 80),
  bio text
    check (bio is null or char_length(bio) <= 300),
  location text
    check (location is null or char_length(location) <= 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  location text check (location is null or char_length(location) <= 120),
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  content text check (content is null or char_length(content) <= 1000),
  media_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  check (content is not null or media_url is not null),
  check (expires_at > created_at)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists posts_created_at_idx
  on public.posts (created_at desc);
create index if not exists comments_post_created_at_idx
  on public.comments (post_id, created_at);
create index if not exists stories_expires_at_idx
  on public.stories (expires_at desc);
create index if not exists room_messages_room_created_at_idx
  on public.room_messages (room_id, created_at);
create index if not exists follows_following_idx
  on public.follows (following_id);

create or replace function public.add_room_creator_as_member()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.room_members (room_id, user_id)
  values (new.id, new.creator_id);
  return new;
end;
$$;

drop trigger if exists add_room_creator_as_member on public.rooms;
create trigger add_room_creator_as_member
  after insert on public.rooms
  for each row execute function public.add_room_creator_as_member();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.stories enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_messages enable row level security;
alter table public.follows enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated using (true);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read posts" on public.posts;
create policy "Authenticated users can read posts"
  on public.posts for select to authenticated using (true);
drop policy if exists "Users can create their own posts" on public.posts;
create policy "Users can create their own posts"
  on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()));

drop policy if exists "Authenticated users can read comments" on public.comments;
create policy "Authenticated users can read comments"
  on public.comments for select to authenticated using (true);
drop policy if exists "Users can comment as themselves" on public.comments;
create policy "Users can comment as themselves"
  on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()));

drop policy if exists "Authenticated users can read post likes" on public.post_likes;
create policy "Authenticated users can read post likes"
  on public.post_likes for select to authenticated using (true);
drop policy if exists "Users can like posts as themselves" on public.post_likes;
create policy "Users can like posts as themselves"
  on public.post_likes for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users can remove their own post likes" on public.post_likes;
create policy "Users can remove their own post likes"
  on public.post_likes for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read active stories" on public.stories;
create policy "Authenticated users can read active stories"
  on public.stories for select to authenticated
  using (expires_at > now());
drop policy if exists "Users can create their own stories" on public.stories;
create policy "Users can create their own stories"
  on public.stories for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and expires_at > now()
    and expires_at <= now() + interval '24 hours'
  );
drop policy if exists "Users can delete their own stories" on public.stories;
create policy "Users can delete their own stories"
  on public.stories for delete to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists "Authenticated users can read rooms" on public.rooms;
create policy "Authenticated users can read rooms"
  on public.rooms for select to authenticated using (true);
drop policy if exists "Users can create rooms as themselves" on public.rooms;
create policy "Users can create rooms as themselves"
  on public.rooms for insert to authenticated
  with check (creator_id = (select auth.uid()));

drop policy if exists "Users can read their room memberships" on public.room_members;
create policy "Users can read their room memberships"
  on public.room_members for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Users can join rooms as themselves" on public.room_members;
create policy "Users can join rooms as themselves"
  on public.room_members for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users can leave rooms" on public.room_members;
create policy "Users can leave rooms"
  on public.room_members for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Room members can read messages" on public.room_messages;
create policy "Room members can read messages"
  on public.room_messages for select to authenticated
  using (
    exists (
      select 1 from public.room_members
      where room_members.room_id = room_messages.room_id
        and room_members.user_id = (select auth.uid())
    )
  );
drop policy if exists "Room members can send messages as themselves" on public.room_messages;
create policy "Room members can send messages as themselves"
  on public.room_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.room_members
      where room_members.room_id = room_messages.room_id
        and room_members.user_id = (select auth.uid())
    )
  );

drop policy if exists "Authenticated users can read follows" on public.follows;
create policy "Authenticated users can read follows"
  on public.follows for select to authenticated using (true);
drop policy if exists "Users can follow as themselves" on public.follows;
create policy "Users can follow as themselves"
  on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));
drop policy if exists "Users can unfollow as themselves" on public.follows;
create policy "Users can unfollow as themselves"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));
