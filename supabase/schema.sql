-- IRL — In Real Life
-- Run this once in Supabase Dashboard -> SQL Editor.
-- This creates the database + storage rules used by the React app.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text not null default 'sharing what''s happening right now.',
  avatar_url text,
  joined_at timestamptz not null default now()
);

create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  image_url text not null,
  activity text not null,
  mood_id text,
  mood_label text,
  mood_emoji text,
  location text,
  voice_url text,
  voice_duration integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists moments_expires_at_idx
  on public.moments (expires_at);

create index if not exists moments_user_id_idx
  on public.moments (user_id);

alter table public.profiles enable row level security;
alter table public.moments enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.moments from anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.moments to authenticated;

drop policy if exists "Profiles are publicly readable to signed-in users" on public.profiles;
create policy "Profiles are publicly readable to signed-in users"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Active moments are readable" on public.moments;
create policy "Active moments are readable"
on public.moments
for select
to authenticated
using (
  expires_at > now()
  or user_id = (select auth.uid())
);

drop policy if exists "Users can create their own moments" on public.moments;
create policy "Users can create their own moments"
on public.moments
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own moments" on public.moments;
create policy "Users can update their own moments"
on public.moments
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own moments" on public.moments;
create policy "Users can delete their own moments"
on public.moments
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Storage buckets. These are public because IRL's active feed is public to
-- authenticated app users and the frontend uses getPublicUrl().
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('moments', 'moments', true),
  ('voice-notes', 'voice-notes', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Authenticated users can upload IRL media" on storage.objects;
create policy "Authenticated users can upload IRL media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('avatars', 'moments', 'voice-notes')
  and split_part(name, '/', 1) = (select auth.uid())::text
);

drop policy if exists "Authenticated users can update their IRL media" on storage.objects;
create policy "Authenticated users can update their IRL media"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('avatars', 'moments', 'voice-notes')
  and split_part(name, '/', 1) = (select auth.uid())::text
)
with check (
  bucket_id in ('avatars', 'moments', 'voice-notes')
  and split_part(name, '/', 1) = (select auth.uid())::text
);

drop policy if exists "Authenticated users can delete their IRL media" on storage.objects;
create policy "Authenticated users can delete their IRL media"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('avatars', 'moments', 'voice-notes')
  and split_part(name, '/', 1) = (select auth.uid())::text
);
