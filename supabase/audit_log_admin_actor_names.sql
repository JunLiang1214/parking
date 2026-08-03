-- Ensures admin activity rows can snapshot readable actor and target labels.
-- Safe to run more than once in the Supabase SQL editor.
alter table public.audit_log
  add column if not exists actor_name text null,
  add column if not exists target_label text null,
  add column if not exists details jsonb null;

update public.audit_log audit
set actor_name = users.name
from public.users users
where audit.actor_name is null
  and audit.actor_id = users.id;
