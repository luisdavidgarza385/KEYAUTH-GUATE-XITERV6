create extension if not exists "pgcrypto";

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  "role" text not null default 'admin' check ("role" in ('admin','seller','developer')),
  credits numeric default 0,
  status text not null default 'active' check (status in ('active','banned')),
  api_key text,
  subscription_end timestamptz,
  subscription_app_id uuid,
  seller_label text default 'keyauthpro',
  created_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references admin_users(id) on delete cascade,
  name text not null,
  app_id text unique not null,
  owner_secret text not null,
  app_secret text not null,
  version text not null default '1.0',
  download_link text,
  webhook_url text,
  status text not null default 'active' check (status in ('active','paused','banned')),
  seller_id uuid references admin_users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_applications_owner on applications(owner_id);
create index if not exists idx_applications_seller on applications(seller_id);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references applications(id) on delete cascade,
  username text not null,
  email text,
  password_hash text not null,
  hwid text,
  ip text,
  last_login timestamptz,
  banned boolean default false,
  ban_reason text,
  created_at timestamptz default now(),
  unique(app_id, username)
);

create index if not exists idx_app_users_app on app_users(app_id);
create index if not exists idx_app_users_ip on app_users(app_id, ip);

create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references applications(id) on delete cascade,
  key text unique not null,
  duration_days int not null default 30,
  level int not null default 1,
  uses int not null default 0,
  max_uses int not null default 1,
  hwid_lock boolean default false,
  ip_lock boolean default false,
  status text not null default 'unused' check (status in ('unused','used','banned','paused')),
  used_by uuid references app_users(id) on delete set null,
  activated_at timestamptz,
  expires_at timestamptz,
  created_by uuid references admin_users(id) on delete set null,
  package_name text,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_licenses_app on licenses(app_id);
create index if not exists idx_licenses_status on licenses(app_id, status);
create index if not exists idx_licenses_key on licenses(key);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  app_id uuid not null references applications(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  ip text,
  hwid text,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  valid boolean default true
);

create index if not exists idx_sessions_id on sessions(session_id);
create index if not exists idx_sessions_user on sessions(user_id);

create table if not exists variables (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references applications(id) on delete cascade,
  name text not null,
  value text not null,
  authed boolean default true,
  is_user_specific boolean default false,
  created_at timestamptz default now(),
  unique(app_id, name)
);

create index if not exists idx_variables_app on variables(app_id);

create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references applications(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  message text not null,
  level text default 'info' check (level in ('info','warn','error','debug')),
  created_at timestamptz default now()
);

create index if not exists idx_logs_app on logs(app_id, created_at desc);

create table if not exists global_vars (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references applications(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  name text not null,
  value text not null,
  unique(app_id, user_id, name)
);

create table if not exists oauth_links (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admin_users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz default now(),
  unique(provider, provider_user_id)
);

create index if not exists idx_oauth_links_admin on oauth_links(admin_id);
create index if not exists idx_oauth_links_provider on oauth_links(provider, provider_user_id);
