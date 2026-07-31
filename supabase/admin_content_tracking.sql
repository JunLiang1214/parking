-- Track which admin created, last edited, or deleted announcement/safety content.
alter table public.app_announcements
  add column if not exists created_by_name text null,
  add column if not exists updated_by text null references public.users(id) on delete set null,
  add column if not exists updated_by_name text null,
  add column if not exists deleted_by text null references public.users(id) on delete set null,
  add column if not exists deleted_by_name text null,
  add column if not exists deleted_at timestamp with time zone null;

alter table public.safety_messages
  add column if not exists created_by_name text null,
  add column if not exists updated_by text null references public.users(id) on delete set null,
  add column if not exists updated_by_name text null,
  add column if not exists deleted_by text null references public.users(id) on delete set null,
  add column if not exists deleted_by_name text null,
  add column if not exists deleted_at timestamp with time zone null;

create index if not exists app_announcements_deleted_at_idx
on public.app_announcements (deleted_at);

create index if not exists safety_messages_deleted_at_idx
on public.safety_messages (deleted_at);

update public.app_announcements announcement
set created_by_name = users.name
from public.users users
where announcement.created_by_name is null
  and announcement.created_by = users.id;

update public.safety_messages message
set created_by_name = users.name
from public.users users
where message.created_by_name is null
  and message.created_by = users.id;
