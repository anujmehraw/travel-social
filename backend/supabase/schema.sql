create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'travel-social',
  'travel-social',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public travel social images are readable" on storage.objects;
create policy "Public travel social images are readable"
  on storage.objects for select to public
  using (bucket_id = 'travel-social');
drop policy if exists "Users can upload their own travel social images" on storage.objects;
create policy "Users can upload their own travel social images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'travel-social'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Users can update their own travel social images" on storage.objects;
create policy "Users can update their own travel social images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'travel-social'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'travel-social'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Users can delete their own travel social images" on storage.objects;
create policy "Users can delete their own travel social images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'travel-social'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

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
  cover_url text,
  interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists interests text[] not null default '{}';

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique
    check (char_length(slug) between 1 and 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  city text not null check (char_length(city) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists communities_created_at_idx
  on public.communities (created_at desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  location text check (location is null or char_length(location) <= 120),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comments add column if not exists updated_at timestamptz not null default now();

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.saved_posts (
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
  destination text,
  start_location text,
  departure_date date,
  return_date date,
  budget numeric(10, 2) check (budget is null or budget >= 0),
  max_members integer not null default 8 check (max_members between 2 and 100),
  category text,
  cover_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.rooms add column if not exists destination text;
alter table public.rooms add column if not exists start_location text;
alter table public.rooms add column if not exists departure_date date;
alter table public.rooms add column if not exists return_date date;
alter table public.rooms add column if not exists budget numeric(10, 2);
alter table public.rooms add column if not exists max_members integer not null default 8;
alter table public.rooms add column if not exists category text;
alter table public.rooms add column if not exists cover_url text;
alter table public.rooms add column if not exists is_public boolean not null default true;

create table if not exists public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.room_invitations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, invitee_id),
  check (inviter_id <> invitee_id)
);

create table if not exists public.room_join_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('like', 'comment', 'follow', 'room_invitation', 'room_join_request', 'room_join_approved')),
  entity_id uuid,
  message text not null check (char_length(message) between 1 and 240),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_one uuid not null references auth.users (id) on delete cascade,
  user_two uuid not null references auth.users (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_one, user_two),
  check (user_one < user_two),
  check (created_by = user_one or created_by = user_two)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
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
create index if not exists saved_posts_user_created_idx
  on public.saved_posts (user_id, created_at desc);
create index if not exists room_members_user_idx
  on public.room_members (user_id, room_id);
create index if not exists room_invitations_invitee_status_idx
  on public.room_invitations (invitee_id, status);
create index if not exists direct_messages_conversation_created_idx
  on public.direct_messages (conversation_id, created_at desc);
create index if not exists rooms_destination_idx on public.rooms (destination);
create index if not exists room_join_requests_pending_idx
  on public.room_join_requests (room_id, status);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
  profile_username text;
  profile_name text;
  metadata_interests text[];
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1)),
    '[^a-z0-9_]',
    '',
    'g'
  ));
  if char_length(base_username) < 3 then
    base_username := 'traveler' || left(replace(new.id::text, '-', ''), 8);
  end if;
  profile_username := left(base_username, 30);
  if exists (select 1 from public.profiles p where p.username = profile_username) then
    profile_username := left(base_username, 21) || '_' || left(replace(new.id::text, '-', ''), 8);
  end if;

  profile_name := left(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Traveler'
  ), 80);

  if jsonb_typeof(new.raw_user_meta_data -> 'interests') = 'array' then
    select coalesce(array_agg(left(value, 40)), '{}')
    into metadata_interests
    from (
      select jsonb_array_elements_text(new.raw_user_meta_data -> 'interests') as value
      limit 30
    ) interests;
  else
    metadata_interests := '{}';
  end if;

  insert into public.profiles (
    user_id, username, display_name, bio, location, interests
  )
  values (
    new.id,
    profile_username,
    profile_name,
    left(nullif(btrim(new.raw_user_meta_data ->> 'bio'), ''), 300),
    left(nullif(btrim(new.raw_user_meta_data ->> 'location'), ''), 120),
    metadata_interests
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create or replace view public.post_feed
with (security_invoker = true)
as
select
  p.id,
  p.author_id,
  p.content,
  p.location,
  p.image_url,
  p.created_at,
  p.updated_at,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  (select count(*)::integer from public.post_likes l where l.post_id = p.id) as like_count,
  (select count(*)::integer from public.comments c where c.post_id = p.id) as comment_count,
  exists (
    select 1 from public.post_likes l
    where l.post_id = p.id and l.user_id = (select auth.uid())
  ) as liked_by_me,
  exists (
    select 1 from public.saved_posts s
    where s.post_id = p.id and s.user_id = (select auth.uid())
  ) as saved_by_me
from public.posts p
left join public.profiles pr on pr.user_id = p.author_id;

create or replace view public.comment_feed
with (security_invoker = true)
as
select
  c.id,
  c.post_id,
  c.author_id,
  c.content,
  c.created_at,
  c.updated_at,
  pr.username,
  pr.display_name,
  pr.avatar_url
from public.comments c
left join public.profiles pr on pr.user_id = c.author_id;

grant select on public.post_feed, public.comment_feed to authenticated;

create or replace view public.conversation_feed
with (security_invoker = true)
as
select
  c.id,
  c.user_one,
  c.user_two,
  c.created_at,
  c.updated_at,
  p.username as peer_username,
  p.display_name as peer_display_name,
  p.avatar_url as peer_avatar_url,
  latest.content as last_message,
  latest.created_at as last_message_at
from public.conversations c
left join public.profiles p
  on p.user_id = case when c.user_one = (select auth.uid()) then c.user_two else c.user_one end
left join lateral (
  select m.content, m.created_at
  from public.direct_messages m
  where m.conversation_id = c.id
  order by m.created_at desc
  limit 1
) latest on true;

grant select on public.conversation_feed to authenticated;

drop function if exists public.can_view_room(uuid, uuid);
create or replace function public.can_view_room(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = target_room_id
      and (
        r.is_public
        or r.creator_id = (select auth.uid())
        or exists (
          select 1 from public.room_members m
          where m.room_id = r.id and m.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.room_invitations i
          where i.room_id = r.id and i.invitee_id = (select auth.uid()) and i.status = 'pending'
        )
      )
  );
$$;

create or replace function public.join_room(target_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_room public.rooms%rowtype;
  member_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select * into target_room
  from public.rooms
  where id = target_room_id
  for update;

  if not found then
    raise exception 'Room not found.';
  end if;
  if not target_room.is_public and not exists (
    select 1 from public.room_invitations
    where room_id = target_room_id
      and invitee_id = auth.uid()
      and status = 'accepted'
  ) then
    raise exception 'An accepted invitation is required to join this private room.';
  end if;

  select count(*) into member_count
  from public.room_members where room_id = target_room_id;
  if member_count >= target_room.max_members
    and not exists (
      select 1 from public.room_members
      where room_id = target_room_id and user_id = auth.uid()
    ) then
    raise exception 'This room is full.';
  end if;

  insert into public.room_members (room_id, user_id)
  values (target_room_id, auth.uid())
  on conflict (room_id, user_id) do nothing;
end;
$$;

create or replace function public.request_or_join_room(target_room_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_room public.rooms%rowtype;
  member_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select * into target_room from public.rooms
  where id = target_room_id for update;
  if not found then
    raise exception 'Room not found.';
  end if;

  if exists (
    select 1 from public.room_members
    where room_id = target_room_id and user_id = auth.uid()
  ) then
    return 'joined';
  end if;

  if not target_room.is_public and not exists (
    select 1 from public.room_invitations
    where room_id = target_room_id
      and invitee_id = auth.uid()
      and status = 'accepted'
  ) then
    insert into public.room_join_requests (room_id, user_id, status, updated_at)
    values (target_room_id, auth.uid(), 'pending', now())
    on conflict (room_id, user_id) do update
      set status = 'pending', updated_at = now()
      where public.room_join_requests.status <> 'pending';
    return 'requested';
  end if;

  select count(*) into member_count
  from public.room_members where room_id = target_room_id;
  if member_count >= target_room.max_members then
    raise exception 'This room is full.';
  end if;
  insert into public.room_members (room_id, user_id)
  values (target_room_id, auth.uid())
  on conflict (room_id, user_id) do nothing;
  return 'joined';
end;
$$;

create or replace function public.respond_room_invitation(
  target_invitation_id uuid,
  accept_invitation boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_room_id uuid;
begin
  update public.room_invitations
  set status = case when accept_invitation then 'accepted' else 'rejected' end,
      updated_at = now()
  where id = target_invitation_id
    and invitee_id = auth.uid()
    and status = 'pending'
  returning room_id into target_room_id;

  if target_room_id is null then
    raise exception 'Pending invitation not found.';
  end if;
  if accept_invitation then
    perform public.join_room(target_room_id);
  end if;
end;
$$;

create or replace function public.resolve_room_join_request(
  target_request_id uuid,
  target_room_id uuid,
  approve_request boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requesting_user_id uuid;
  target_room public.rooms%rowtype;
  member_count integer;
begin
  select * into target_room
  from public.rooms
  where id = target_room_id and creator_id = auth.uid()
  for update;
  if not found then
    raise exception 'Only the room creator can resolve requests.';
  end if;

  update public.room_join_requests
  set status = case when approve_request then 'approved' else 'rejected' end,
      updated_at = now()
  where id = target_request_id
    and room_id = target_room_id
    and status = 'pending'
  returning user_id into requesting_user_id;
  if requesting_user_id is null then
    raise exception 'Pending join request not found.';
  end if;

  if approve_request then
    select count(*) into member_count
    from public.room_members where room_id = target_room_id;
    if member_count >= target_room.max_members then
      raise exception 'This room is full.';
    end if;
    insert into public.room_members (room_id, user_id)
    values (target_room_id, requesting_user_id)
    on conflict (room_id, user_id) do nothing;
    insert into public.notifications (user_id, actor_id, kind, entity_id, message)
    values (
      requesting_user_id,
      auth.uid(),
      'room_join_approved',
      target_room_id,
      'Your request to join a travel room was approved.'
    );
  end if;
end;
$$;

create or replace function public.discover_rooms(
  destination_query text default null,
  category_filter text default null,
  min_budget numeric default null,
  max_budget numeric default null,
  earliest_departure date default null,
  latest_departure date default null
)
returns table (
  id uuid,
  creator_id uuid,
  name text,
  description text,
  destination text,
  start_location text,
  departure_date date,
  return_date date,
  budget numeric,
  max_members integer,
  category text,
  cover_url text,
  is_public boolean,
  created_at timestamptz,
  member_count integer,
  can_view boolean,
  is_member boolean,
  has_pending_invitation boolean,
  is_creator boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.creator_id,
    r.name,
    r.description,
    r.destination,
    r.start_location,
    r.departure_date,
    r.return_date,
    r.budget,
    r.max_members,
    r.category,
    r.cover_url,
    r.is_public,
    r.created_at,
    (select count(*)::integer from public.room_members m where m.room_id = r.id),
    public.can_view_room(r.id),
    exists (
      select 1 from public.room_members m
      where m.room_id = r.id and m.user_id = (select auth.uid())
    ),
    exists (
      select 1 from public.room_invitations i
      where i.room_id = r.id and i.invitee_id = (select auth.uid()) and i.status = 'pending'
    ),
    r.creator_id = (select auth.uid())
  from public.rooms r
  where (destination_query is null or r.destination ilike '%' || destination_query || '%')
    and (category_filter is null or r.category = category_filter)
    and (min_budget is null or r.budget >= min_budget)
    and (max_budget is null or r.budget <= max_budget)
    and (earliest_departure is null or r.departure_date >= earliest_departure)
    and (latest_departure is null or r.departure_date <= latest_departure)
  order by r.created_at desc
  limit 100;
$$;

create or replace function public.notify_social_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  notification_kind text;
  notification_message text;
  target_entity_id uuid;
begin
  if tg_table_name = 'post_likes' then
    select author_id into target_user_id from public.posts where id = new.post_id;
    notification_kind := 'like';
    notification_message := 'Someone liked your travel story.';
    target_entity_id := new.post_id;
    if target_user_id = new.user_id then return new; end if;
    insert into public.notifications (user_id, actor_id, kind, entity_id, message)
    values (target_user_id, new.user_id, notification_kind, target_entity_id, notification_message);
  elsif tg_table_name = 'comments' then
    select author_id into target_user_id from public.posts where id = new.post_id;
    notification_kind := 'comment';
    notification_message := 'Someone commented on your travel story.';
    if target_user_id = new.author_id then return new; end if;
    insert into public.notifications (user_id, actor_id, kind, entity_id, message)
    values (target_user_id, new.author_id, notification_kind, new.post_id, notification_message);
  elsif tg_table_name = 'follows' then
    if new.follower_id = new.following_id then return new; end if;
    insert into public.notifications (user_id, actor_id, kind, entity_id, message)
    values (new.following_id, new.follower_id, 'follow', new.follower_id, 'Someone followed your profile.');
  elsif tg_table_name = 'room_invitations' then
    insert into public.notifications (user_id, actor_id, kind, entity_id, message)
    values (new.invitee_id, new.inviter_id, 'room_invitation', new.id, 'You have been invited to a travel room.');
  elsif tg_table_name = 'room_join_requests' then
    select creator_id into target_user_id from public.rooms where id = new.room_id;
    insert into public.notifications (user_id, actor_id, kind, entity_id, message)
    values (target_user_id, new.user_id, 'room_join_request', new.room_id, 'A traveler requested to join your room.');
  elsif tg_table_name = 'direct_messages' then
    update public.conversations
    set updated_at = now()
    where id = new.conversation_id;
    select case when c.user_one = new.sender_id then c.user_two else c.user_one end
    into target_user_id
    from public.conversations c
    where c.id = new.conversation_id;
    insert into public.notifications (user_id, actor_id, kind, entity_id, message)
    values (target_user_id, new.sender_id, 'direct_message', new.conversation_id, 'You received a new travel message.');
  end if;
  return new;
end;
$$;

drop trigger if exists notify_post_like on public.post_likes;
create trigger notify_post_like after insert on public.post_likes
for each row execute function public.notify_social_activity();
drop trigger if exists notify_post_comment on public.comments;
create trigger notify_post_comment after insert on public.comments
for each row execute function public.notify_social_activity();
drop trigger if exists notify_new_follow on public.follows;
create trigger notify_new_follow after insert on public.follows
for each row execute function public.notify_social_activity();
drop trigger if exists notify_room_invitation on public.room_invitations;
create trigger notify_room_invitation after insert on public.room_invitations
for each row execute function public.notify_social_activity();
drop trigger if exists notify_room_join_request on public.room_join_requests;
create trigger notify_room_join_request after insert on public.room_join_requests
for each row execute function public.notify_social_activity();
drop trigger if exists notify_room_join_request_again on public.room_join_requests;
create trigger notify_room_join_request_again after update of status on public.room_join_requests
for each row when (new.status = 'pending')
execute function public.notify_social_activity();
drop trigger if exists notify_direct_message on public.direct_messages;
create trigger notify_direct_message after insert on public.direct_messages
for each row execute function public.notify_social_activity();

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
alter table public.communities enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.stories enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_messages enable row level security;
alter table public.follows enable row level security;
alter table public.room_invitations enable row level security;
alter table public.room_join_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.direct_messages enable row level security;

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('like', 'comment', 'follow', 'room_invitation', 'room_join_request', 'room_join_approved', 'direct_message'));

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

drop policy if exists "Authenticated users can read communities" on public.communities;
create policy "Authenticated users can read communities"
  on public.communities for select to authenticated using (true);
drop policy if exists "Users can create communities as themselves" on public.communities;
create policy "Users can create communities as themselves"
  on public.communities for insert to authenticated
  with check (creator_id = (select auth.uid()));

drop policy if exists "Authenticated users can read posts" on public.posts;
create policy "Authenticated users can read posts"
  on public.posts for select to authenticated using (true);
drop policy if exists "Users can create their own posts" on public.posts;
create policy "Users can create their own posts"
  on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()));
drop policy if exists "Users can update their own posts" on public.posts;
create policy "Users can update their own posts"
  on public.posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
  on public.posts for delete to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists "Authenticated users can read comments" on public.comments;
create policy "Authenticated users can read comments"
  on public.comments for select to authenticated using (true);
drop policy if exists "Users can comment as themselves" on public.comments;
create policy "Users can comment as themselves"
  on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()));
drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
  on public.comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete to authenticated
  using (author_id = (select auth.uid()));

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

drop policy if exists "Users can read their saved posts" on public.saved_posts;
create policy "Users can read their saved posts"
  on public.saved_posts for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Users can save posts as themselves" on public.saved_posts;
create policy "Users can save posts as themselves"
  on public.saved_posts for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users can unsave their posts" on public.saved_posts;
create policy "Users can unsave their posts"
  on public.saved_posts for delete to authenticated
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
  on public.rooms for select to authenticated
  using (public.can_view_room(id));
drop policy if exists "Users can create rooms as themselves" on public.rooms;
create policy "Users can create rooms as themselves"
  on public.rooms for insert to authenticated
  with check (creator_id = (select auth.uid()));

drop policy if exists "Users can read their room memberships" on public.room_members;
create policy "Users can read their room memberships"
  on public.room_members for select to authenticated
  using (public.can_view_room(room_id));
drop policy if exists "Users can join rooms as themselves" on public.room_members;
create policy "Room creators can add members"
  on public.room_members for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and
    exists (
      select 1 from public.rooms
      where rooms.id = room_members.room_id
        and rooms.creator_id = (select auth.uid())
    )
  );
drop policy if exists "Users can leave rooms" on public.room_members;
create policy "Users can leave rooms"
  on public.room_members for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.rooms
      where rooms.id = room_members.room_id
        and rooms.creator_id <> (select auth.uid())
    )
  );

drop policy if exists "Room participants can read invitations" on public.room_invitations;
create policy "Room participants can read invitations"
  on public.room_invitations for select to authenticated
  using (
    inviter_id = (select auth.uid())
    or invitee_id = (select auth.uid())
    or exists (
      select 1 from public.rooms
      where rooms.id = room_invitations.room_id
        and rooms.creator_id = (select auth.uid())
    )
  );
drop policy if exists "Members can invite users" on public.room_invitations;
create policy "Members can invite users"
  on public.room_invitations for insert to authenticated
  with check (
    inviter_id = (select auth.uid())
    and exists (
      select 1 from public.room_members
      where room_members.room_id = room_invitations.room_id
        and room_members.user_id = (select auth.uid())
    )
  );
drop policy if exists "Invitees can respond" on public.room_invitations;

drop policy if exists "Users can read own join requests or manage room requests" on public.room_join_requests;
create policy "Users can read own join requests or manage room requests"
  on public.room_join_requests for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.rooms
      where rooms.id = room_join_requests.room_id
        and rooms.creator_id = (select auth.uid())
    )
  );
drop policy if exists "Users can request to join private rooms" on public.room_join_requests;
create policy "Users can request to join private rooms"
  on public.room_join_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.rooms
      where rooms.id = room_join_requests.room_id
        and not rooms.is_public
    )
  );
drop policy if exists "Room creators can resolve join requests" on public.room_join_requests;

drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Users can mark their notifications read" on public.notifications;
create policy "Users can mark their notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke all on function public.discover_rooms(text, text, numeric, numeric, date, date) from public;
grant execute on function public.discover_rooms(text, text, numeric, numeric, date, date) to authenticated;
revoke all on function public.can_view_room(uuid) from public;
grant execute on function public.can_view_room(uuid) to authenticated;
revoke all on function public.request_or_join_room(uuid) from public;
grant execute on function public.request_or_join_room(uuid) to authenticated;
revoke all on function public.respond_room_invitation(uuid, boolean) from public;
grant execute on function public.respond_room_invitation(uuid, boolean) to authenticated;
revoke all on function public.resolve_room_join_request(uuid, uuid, boolean) from public;
grant execute on function public.resolve_room_join_request(uuid, uuid, boolean) to authenticated;

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

drop policy if exists "Conversation participants can read conversations" on public.conversations;
create policy "Conversation participants can read conversations"
  on public.conversations for select to authenticated
  using (user_one = (select auth.uid()) or user_two = (select auth.uid()));
drop policy if exists "Users can create conversations they participate in" on public.conversations;
create policy "Users can create conversations they participate in"
  on public.conversations for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (user_one = (select auth.uid()) or user_two = (select auth.uid()))
  );
drop policy if exists "Conversation participants can read direct messages" on public.direct_messages;
create policy "Conversation participants can read direct messages"
  on public.direct_messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = direct_messages.conversation_id
        and (c.user_one = (select auth.uid()) or c.user_two = (select auth.uid()))
    )
  );
drop policy if exists "Participants can send messages as themselves" on public.direct_messages;
create policy "Participants can send messages as themselves"
  on public.direct_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = direct_messages.conversation_id
        and (c.user_one = (select auth.uid()) or c.user_two = (select auth.uid()))
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
