-- Setup that schema.sql (a pg_dump of the public schema) does not contain.
-- Run it in the SQL Editor of a new project, right after schema.sql. It can be re-run: every statement replaces what it creates.
-- Why things are built this way: docs/database-design.md.
--
-- Not in this file, done by hand:
--   * Vault secret github_dispatch_token (GitHub fine-grained PAT, only this repo, Actions: read and write), used by
--     public.dispatch_github_workflow(). Without it the dispatch-* jobs below fail every run, and only GitHub's own schedule is left.
--     Create it in the SQL Editor, never in a file: select vault.create_secret('<token>', 'github_dispatch_token');
--   * Auth settings (SMTP, e-mail templates, redirect URLs): docs/email-setup.md
--   * Reference data: node scripts/seed/places/seedPlaces.ts


-- ---------------------------------------------------------------------
-- Auth: create the profile row when a user signs up (the trigger is on auth.users, outside public)
-- ---------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- Event trigger: turn on RLS for every new table in public
-- ---------------------------------------------------------------------
-- A safety net for tables created later. It does not touch tables that already exist, so schema.sql enables RLS itself.

drop event trigger if exists ensure_rls;
create event trigger ensure_rls on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();


-- ---------------------------------------------------------------------
-- Role settings
-- ---------------------------------------------------------------------
-- check_request() runs before every Data API request and rate limits writes of signed-in users.
-- If requests start failing because of it: alter role authenticator reset pgrst.db_pre_request; notify pgrst, 'reload config';

alter role authenticator set pgrst.db_pre_request = 'public.check_request';
alter role anon          set statement_timeout = '3s';
alter role authenticated set statement_timeout = '8s';
alter role authenticator set statement_timeout = '8s';
notify pgrst, 'reload config';


-- ---------------------------------------------------------------------
-- Storage: profile images (bucket 'avatars'; the app and scripts take the name from shared/storage.ts)
-- ---------------------------------------------------------------------
-- Public bucket, max 2 MB, only jpeg/png/webp. Path '<user id>/<new name per upload>.<ext>'.
-- If the SQL Editor refuses the policies, create them under Storage > Policies in the Dashboard.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Upload: own folder only, active users only, at most 5 files in the folder (the purge script trims it to 1).
-- The count goes through public.my_avatar_count(): a subquery on storage.objects here fails with infinite recursion (42P17).
drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[^/]+/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$'
    and public.is_active_user()
    and public.my_avatar_count() < 5
  );

-- Listing through the API. Opening an image by its public URL does not go through this.
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
  );


-- ---------------------------------------------------------------------
-- pg_cron jobs (times are UTC)
-- ---------------------------------------------------------------------
-- cron.schedule() with an existing job name updates that job.
-- Check runs:            select * from cron.job_run_details order by start_time desc limit 20;
-- Check GitHub answers:  select id, status_code, content from net._http_response order by created desc limit 10;  (204 = started)

select cron.schedule('clean-stale-listings',      '10 3 * * *',   $$select public.clean_stale_listings()$$);
select cron.schedule('purge-removed-listings',    '15 3 * * *',   $$select public.purge_removed_listings()$$);
select cron.schedule('purge-rate-limit-counters', '5 * * * *',    $$select public.purge_rate_limit_counters()$$);
select cron.schedule('purge-old-invites',         '30 3 * * *',   $$select public.purge_old_invites()$$);
select cron.schedule('purge-search-params-log',   '45 3 * * *',   $$select public.purge_search_params_log()$$);
select cron.schedule('purge-old-showings',        '50 3 * * *',   $$select public.purge_old_showings()$$);
select cron.schedule('purge-old-showing-events',  '55 3 * * *',   $$select public.purge_old_showing_events()$$);
select cron.schedule('purge-cron-history',        '0 4 * * *',    $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$);

-- Backups for GitHub's own schedule, which does not always fire. Scrape and avatar purge skip themselves if they already succeeded in the last 12 hours.
-- The email workflow has no such guard: due_emails() only returns users who have not been emailed today.
-- Need the Vault secret above.
select cron.schedule('dispatch-scrape',           '20 4,6 * * *', $$select public.dispatch_github_workflow('scrape.yml')$$);
select cron.schedule('dispatch-purge-avatars',    '50 4,6 * * *', $$select public.dispatch_github_workflow('purge-avatars.yml')$$);
select cron.schedule('dispatch-notify',           '20 5,6 * * *', $$select public.dispatch_github_workflow('notify.yml')$$);
