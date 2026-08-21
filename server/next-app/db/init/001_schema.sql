create extension if not exists pgcrypto;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drawing_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '제목 없는 작업',
  canvas_width integer not null,
  canvas_height integer not null,
  project_data jsonb not null default '{}'::jsonb,
  image_path text,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploaded_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.drawing_projects(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  byte_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.drawing_projects(id) on delete cascade,
  permission text not null default 'read',
  token text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.drawing_projects enable row level security;
alter table public.uploaded_images enable row level security;
alter table public.share_links enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "drawing_projects_select_own"
  on public.drawing_projects for select
  using (auth.uid() = user_id);

create policy "drawing_projects_insert_own"
  on public.drawing_projects for insert
  with check (auth.uid() = user_id);

create policy "drawing_projects_update_own"
  on public.drawing_projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "drawing_projects_delete_own"
  on public.drawing_projects for delete
  using (auth.uid() = user_id);

create policy "uploaded_images_select_own"
  on public.uploaded_images for select
  using (auth.uid() = user_id);

create policy "uploaded_images_insert_own"
  on public.uploaded_images for insert
  with check (auth.uid() = user_id);

create policy "uploaded_images_delete_own"
  on public.uploaded_images for delete
  using (auth.uid() = user_id);

create policy "share_links_select_project_owner"
  on public.share_links for select
  using (
    exists (
      select 1
      from public.drawing_projects
      where drawing_projects.id = share_links.project_id
        and drawing_projects.user_id = auth.uid()
    )
  );

create policy "share_links_insert_project_owner"
  on public.share_links for insert
  with check (
    exists (
      select 1
      from public.drawing_projects
      where drawing_projects.id = share_links.project_id
        and drawing_projects.user_id = auth.uid()
    )
  );

create policy "share_links_update_project_owner"
  on public.share_links for update
  using (
    exists (
      select 1
      from public.drawing_projects
      where drawing_projects.id = share_links.project_id
        and drawing_projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.drawing_projects
      where drawing_projects.id = share_links.project_id
        and drawing_projects.user_id = auth.uid()
    )
  );

create policy "share_links_delete_project_owner"
  on public.share_links for delete
  using (
    exists (
      select 1
      from public.drawing_projects
      where drawing_projects.id = share_links.project_id
        and drawing_projects.user_id = auth.uid()
    )
  );

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.profiles to authenticated, service_role;
grant select, insert, update, delete on public.drawing_projects to authenticated, service_role;
grant select, insert, update, delete on public.uploaded_images to authenticated, service_role;
grant select, insert, update, delete on public.share_links to authenticated, service_role;
