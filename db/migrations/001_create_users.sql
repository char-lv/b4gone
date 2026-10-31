-- Accounts for private records (issue #2). Emails are stored trimmed and lowercased by the
-- application; the check keeps the unique index case-insensitive in practice.
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint users_email_lowercase check (email = lower(email)),
  constraint users_email_length check (char_length(email) between 3 and 254)
);

create unique index users_email_key on users (email);
