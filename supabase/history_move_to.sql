-- Optional destination or notes entered when a vehicle is moved out.
alter table public.history
  add column if not exists move_to text null;
