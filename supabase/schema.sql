


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."email_frequency" AS ENUM (
    'day',
    'week',
    'none'
);


ALTER TYPE "public"."email_frequency" OWNER TO "postgres";


COMMENT ON TYPE "public"."email_frequency" IS 'How often a user gets emails (profiles.email_frequency). week = Fridays.';



CREATE TYPE "public"."invite_status" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'cancelled'
);


ALTER TYPE "public"."invite_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."invite_status" IS 'Status of an invite. cancelled = withdrawn by the sender, or closed by accept_invite().';



CREATE TYPE "public"."property_type" AS ENUM (
    'villa',
    'radhus',
    'lagenhet',
    'fritidshus',
    'tomt',
    'other'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."property_type" IS 'Our own property types, mapped from each agency''s categories by the scraper. Used by listings.property_type and search_params.property_types.';



CREATE TYPE "public"."scrape_issue_kind" AS ENUM (
    'failed',
    'suspicious'
);


ALTER TYPE "public"."scrape_issue_kind" OWNER TO "postgres";


COMMENT ON TYPE "public"."scrape_issue_kind" IS 'Kind of scrape issue: failed (F1-F4) or suspicious (mass removal).';



CREATE TYPE "public"."scrape_issue_status" AS ENUM (
    'open',
    'resolved'
);


ALTER TYPE "public"."scrape_issue_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."scrape_issue_status" IS 'Status of a scrape issue. At most one open issue per agency and kind.';



CREATE TYPE "public"."scrape_run_outcome" AS ENUM (
    'ok',
    'failed',
    'suspicious',
    'skipped',
    'error'
);


ALTER TYPE "public"."scrape_run_outcome" OWNER TO "postgres";


CREATE TYPE "public"."showing_event_action" AS ENUM (
    'created',
    'updated',
    'deleted'
);


ALTER TYPE "public"."showing_event_action" OWNER TO "postgres";


COMMENT ON TYPE "public"."showing_event_action" IS 'What happened to a group showing (showing_events.action).';



CREATE OR REPLACE FUNCTION "public"."accept_invite"("invite_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  me uuid := auth.uid();
  my_email text := lower(auth.jwt() ->> 'email');
  inv public.invites;
  v_from uuid;
  v_from_email text;
  my_g bigint;
  g bigint;
  skipped jsonb;
begin
  if not public.is_active_user() then
    raise exception 'Ditt konto är inte aktivt';
  end if;

  select from_user_id into v_from from public.invites
  where id = invite_id and status = 'pending' and lower(to_email) = my_email;
  if not found then
    raise exception 'Inbjudan finns inte eller är inte din';
  end if;

  -- Lock both profile rows in a fixed order (id), so crossing accepts cannot lock each other up.
  perform 1 from public.profiles where id in (me, v_from) order by id for update;

  -- After the lock: read again and check again. A double tap or a crossing accept no longer finds the invite.
  select * into inv from public.invites
  where id = invite_id and status = 'pending' and lower(to_email) = my_email
  for update;
  if not found then
    raise exception 'Inbjudan finns inte eller är inte din';
  end if;

  select group_id into my_g from public.profiles where id = me;
  if my_g is not null then
    raise exception 'Du är redan med i en grupp. Lämna den först.';
  end if;

  select group_id into g from public.profiles where id = v_from;
  if g is null then
    insert into public.groups default values returning id into g;
    update public.profiles set group_id = g where id = v_from;
  else
    perform 1 from public.groups where id = g for update;
    if (select count(*) from public.profiles where group_id = g) >= 10 then
      raise exception 'Gruppen är full (max 10 medlemmar)';
    end if;
  end if;

  update public.profiles set group_id = g where id = me;

  -- Own showings of the sender (new group) and of me move into the group.
  perform public.move_personal_showings(v_from, g);
  skipped := public.move_personal_showings(me, g);

  update public.invites set status = 'accepted', responded_at = now() where id = invite_id;

  -- A pending invite from me to the sender is now pointless: close it.
  select email into v_from_email from auth.users where id = v_from;
  update public.invites
  set status = 'cancelled', responded_at = now()
  where from_user_id = me
    and lower(to_email) = lower(v_from_email)
    and status = 'pending';

  return skipped;
end;
$$;


ALTER FUNCTION "public"."accept_invite"("invite_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_see_listing"("p_listing_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select public.is_active_user() and (
    exists (
      select 1 from public.user_listings ul
      where ul.listing_id = p_listing_id and public.shares_group_with(ul.user_id)
    )
    or exists (
      select 1 from public.showings s
      where s.listing_id = p_listing_id
        and (s.group_id = public.my_group_id() or s.user_id = auth.uid())
    )
  );
$$;


ALTER FUNCTION "public"."can_see_listing"("p_listing_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_invite"("invite_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not public.is_active_user() then
    raise exception 'Ditt konto är inte aktivt';
  end if;
  update public.invites set status = 'cancelled', responded_at = now()
  where id = invite_id and status = 'pending' and from_user_id = auth.uid();
  if not found then
    raise exception 'Inbjudan finns inte eller är inte din';
  end if;
end;
$$;


ALTER FUNCTION "public"."cancel_invite"("invite_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_invite_recipient"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
begin
  if new.to_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Ange en giltig e-postadress.';
  end if;

  -- Recipient already in the sender's group: the invite could never be accepted
  if exists (
    select 1
    from public.profiles me
    join public.profiles p on p.group_id = me.group_id
    join auth.users u on u.id = p.id
    where me.id = new.from_user_id
      and me.group_id is not null
      and p.id <> me.id
      and lower(u.email) = lower(new.to_email)
  ) then
    raise exception 'Personen är redan kopplad till dig.';
  end if;

  -- no key update: does not block the foreign key check of other inserts
  perform 1 from public.profiles where id = new.from_user_id for no key update;
  if not exists (
    select 1 from public.invites
    where from_user_id = new.from_user_id
      and lower(to_email) = lower(new.to_email)
      and created_at > now() - interval '30 days'
  ) and (
    select count(distinct lower(to_email)) from public.invites
    where from_user_id = new.from_user_id
      and created_at > now() - interval '30 days'
  ) >= 20 then
    raise exception 'Du har bjudit in för många olika personer. Försök igen senare';
  end if;
  return new;
end;
$_$;


ALTER FUNCTION "public"."check_invite_recipient"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_request"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  method text := current_setting('request.method', true);
  claims json := nullif(current_setting('request.jwt.claims', true), '')::json;
  uid uuid;
  total integer;
begin
  -- Reads cannot write the counter, and are not limited
  if method is null or method in ('GET', 'HEAD', 'OPTIONS') then
    return;
  end if;

  -- Only signed-in users are limited. service_role (the scraper) and anon pass
  if claims is null or claims ->> 'role' is distinct from 'authenticated' then
    return;
  end if;

  uid := (claims ->> 'sub')::uuid;
  if uid is null then
    return;
  end if;

  insert into public.api_rate_limit (user_id, minute, writes)
  values (uid, date_trunc('minute', now()), 1)
  on conflict (user_id, minute)
  do update set writes = public.api_rate_limit.writes + 1;

  select coalesce(sum(writes), 0) into total
  from public.api_rate_limit
  where user_id = uid
    and minute > now() - interval '5 minutes';

  if total > 100 then
    raise sqlstate 'PGRST' using
      message = '{"code": "rate_limited", "message": "Too many requests, try again in a moment"}',
      detail  = '{"status": 429, "headers": {"Retry-After": "60"}}';
  end if;
end;
$$;


ALTER FUNCTION "public"."check_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_stale_listings"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  -- Listings outside every user's search are never visited by the scraper, so they never get removed_at.
  -- "Stale" = not seen for 7 days, counted from the agency's latest seen listing (not now()):
  -- if the scraper stops or fails, nothing happens.
  -- Agencies with an open scrape issue are skipped: F3 and suspicious runs still save what they found,
  -- so without this the stale rule would remove what those guards keep.
  -- Stale and not in anyone's list or showing: deleted directly (nobody would notice, nothing to keep).
  -- Stale and in use: gets removed_at ("Hittas inte"), purge_removed_listings() deletes it later.
  with latest as (
    select l.agency, max(l.last_seen_at) as seen_at
    from public.listings l
    where l.removed_at is null
      and not exists (
        select 1 from public.scrape_issues i
        where i.agency = l.agency and i.status = 'open'
      )
    group by l.agency
  ),
  stale as (
    select l.id,
           exists (select 1 from public.user_listings ul where ul.listing_id = l.id)
        or exists (select 1 from public.showings s where s.listing_id = l.id) as in_use
    from public.listings l
    join latest on latest.agency = l.agency
    where l.removed_at is null
      and l.last_seen_at < latest.seen_at - interval '7 days'
  ),
  deleted as (
    delete from public.listings l
    using stale
    where l.id = stale.id and not stale.in_use
    returning 1
  ),
  marked as (
    update public.listings l
    set removed_at = now()
    from stale
    where l.id = stale.id and stale.in_use
    returning 1
  )
  select ((select count(*) from deleted) + (select count(*) from marked))::int;
$$;


ALTER FUNCTION "public"."clean_stale_listings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decline_invite"("invite_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not public.is_active_user() then
    raise exception 'Ditt konto är inte aktivt';
  end if;
  update public.invites set status = 'declined', responded_at = now()
  where id = invite_id and status = 'pending'
    and lower(to_email) = lower(auth.jwt() ->> 'email');
  if not found then
    raise exception 'Inbjudan finns inte eller är inte din';
  end if;
end;
$$;


ALTER FUNCTION "public"."decline_invite"("invite_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_my_account"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  -- Invites sent TO this user's e-mail. Invites sent BY the user go via ON DELETE CASCADE on from_user_id
  delete from public.invites
  where lower(to_email) = (select lower(email) from auth.users where id = auth.uid());
  delete from auth.users where id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."delete_my_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dispatch_github_workflow"("workflow" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  token text;
  repo text;
  branch text;
begin
  select decrypted_secret into token from vault.decrypted_secrets where name = 'github_dispatch_token';
  select decrypted_secret into repo from vault.decrypted_secrets where name = 'github_repo';
  select decrypted_secret into branch from vault.decrypted_secrets where name = 'github_branch';

  if token is null then
    raise exception 'Vault secret github_dispatch_token is missing';
  end if;
  if repo is null then
    raise exception 'Vault secret github_repo is missing (owner/repo, e.g. octocat/samboo)';
  end if;
  if branch is null then
    raise exception 'Vault secret github_branch is missing (the branch the workflows run on)';
  end if;

  return net.http_post(
    url := 'https://api.github.com/repos/' || repo || '/actions/workflows/' || workflow || '/dispatches',
    body := jsonb_build_object('ref', branch, 'inputs', jsonb_build_object('skip_if_recent', 'true')),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'samboo-pg-cron',
      'Content-Type', 'application/json'
    )
  );
end;
$$;


ALTER FUNCTION "public"."dispatch_github_workflow"("workflow" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dissolve_group_if_alone"("g" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  kvar int;
  kvar_id uuid;
begin
  select count(*) into kvar from public.profiles where group_id = g;
  if kvar <= 1 then
    if kvar = 1 then
      -- Locks the remaining member's profile so a personal showing inserted at the same moment cannot collide with the transfer (showings_user_listing_unique)
      select id into kvar_id from public.profiles where group_id = g for update;
      update public.showings set user_id = kvar_id, group_id = null where group_id = g;
    end if;
    update public.profiles set group_id = null where group_id = g;
    delete from public.groups where id = g;
  end if;
end;
$$;


ALTER FUNCTION "public"."dissolve_group_if_alone"("g" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."due_emails"("p_include_weekly" boolean DEFAULT NULL::boolean) RETURNS TABLE("user_id" "uuid", "name" "text", "email" "text", "frequency" "public"."email_frequency", "window_end" timestamp with time zone, "new_count" integer, "new_listings" "jsonb", "partner_likes" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with clock as (
    select
      now() as now_at,
      (now() at time zone 'Europe/Stockholm')::date as today,
      coalesce(p_include_weekly, extract(isodow from now() at time zone 'Europe/Stockholm') = 5) as weekly_today
  ),
  due as (
    select
      p.id, p.name, u.email::text as email, p.email_frequency, p.group_id, c.now_at,
      greatest(coalesce(p.last_emailed_at, p.created_at), c.now_at - interval '8 days') as since
    from public.profiles p
    join auth.users u on u.id = p.id
    cross join clock c
    where p.is_active
      and u.email_confirmed_at is not null
      and u.email is not null
      and (p.email_frequency = 'day' or (p.email_frequency = 'week' and c.weekly_today))
      and (p.last_emailed_at is null or (p.last_emailed_at at time zone 'Europe/Stockholm')::date < c.today)
  )
  select d.id, d.name, d.email, d.email_frequency, d.now_at, n.new_count, n.new_listings, pl.partner_likes
  from due d
  cross join lateral (
    select
      count(*)::int as new_count,
      coalesce(jsonb_agg(x.listing order by x.rn) filter (where x.rn <= 5), '[]'::jsonb) as new_listings
    from (
      select
        row_number() over (order by l.created_at desc, l.id desc) as rn,
        jsonb_build_object(
          'id', l.id, 'address', l.address, 'area', l.area, 'municipality', l.municipality,
          'property_type', l.property_type, 'price', l.price, 'rooms', l.rooms, 'living_area', l.living_area,
          'monthly_fee', l.monthly_fee, 'is_new_construction', l.is_new_construction, 'agency', l.agency, 'url', l.url
        ) as listing
      from public.user_listings ul
      join public.listings l on l.id = ul.listing_id
      where ul.user_id = d.id
        and not ul.liked
        and l.removed_at is null
        and l.created_at > d.since
    ) x
  ) n
  cross join lateral (
    select coalesce(jsonb_agg(jsonb_build_object('name', m.name, 'count', m.cnt, 'listings', m.listings) order by m.name), '[]'::jsonb) as partner_likes
    from (
      select
        mp.name,
        count(*)::int as cnt,
        to_jsonb((array_agg(jsonb_build_object('id', l.id, 'address', l.address) order by ul.liked_at desc))[1:2]) as listings
      from public.profiles mp
      join public.user_listings ul on ul.user_id = mp.id
      join public.listings l on l.id = ul.listing_id
      where d.group_id is not null
        and mp.group_id = d.group_id
        and mp.id <> d.id
        and mp.is_active
        and ul.liked
        and ul.liked_at > d.since
        and l.removed_at is null
        and not exists (
          select 1 from public.user_listings mine
          where mine.user_id = d.id and mine.listing_id = ul.listing_id and mine.liked
        )
      group by mp.id, mp.name
    ) m
  ) pl
  where n.new_count > 0 or jsonb_array_length(pl.partner_likes) > 0
  order by d.id
$$;


ALTER FUNCTION "public"."due_emails"("p_include_weekly" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_deleted_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if old.group_id is null then
    return old;
  end if;

  perform 1 from public.groups where id = old.group_id for update;
  perform public.dissolve_group_if_alone(old.group_id);
  return old;
end;
$$;


ALTER FUNCTION "public"."handle_deleted_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, name, is_active)
  values (
    new.id,
    left(
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
      100
    ),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_new_notifications"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with me as (
    select p.id, p.group_id, coalesce(p.notifications_seen_at, '-infinity'::timestamptz) as since
    from public.profiles p
    where p.id = (select auth.uid())
      and public.is_active_user()
  )
  select coalesce((
    select
      -- a) An invite to me
      exists (
        select 1 from public.my_pending_invites() i
        where i.created_at > me.since
      )
      -- b) An answer to an invite I sent
      or exists (
        select 1 from public.invites i
        where i.from_user_id = me.id
          and i.status in ('accepted', 'declined')
          and i.responded_at > me.since
      )
      -- c) A new match I have not opened
      or exists (
        select 1
        from public.user_listings ul
        join public.listings l on l.id = ul.listing_id
        where ul.user_id = me.id
          and ul.is_new
          and l.removed_at is null
          and ul.created_at > me.since
      )
      -- d) A group member liked something that is new to me
      or exists (
        select 1
        from public.user_listings ul
        join public.profiles p on p.id = ul.user_id
        where p.group_id = me.group_id
          and ul.user_id <> me.id
          and ul.liked
          and ul.liked_at > me.since
          and ul.listing_id in (select n.listing_id from public.my_new_listing_ids() n)
      )
      -- e) Another member changed one of the group's showings
      or exists (
        select 1 from public.showing_events e
        where e.group_id = me.group_id
          and e.actor_id <> me.id
          and e.created_at > me.since
      )
    from me
  ), false);
$$;


ALTER FUNCTION "public"."has_new_notifications"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_new_notifications"() IS 'true if something has happened since I last opened the notifications page (notifications_seen_at): an invite to me, an answer to my invite, a new match I have not opened, a group like that is new to me, or another member''s change to a showing. For the dot on the notifications icon. Read-only, call with GET.';



CREATE OR REPLACE FUNCTION "public"."in_my_group"("target" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select target = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.id = target
          and p.group_id is not null
          and p.group_id = public.my_group_id()
      )
$$;


ALTER FUNCTION "public"."in_my_group"("target" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_active_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(
    (
      select p.is_active and u.email_confirmed_at is not null
      from public.profiles p
      join auth.users u on u.id = p.id
      where p.id = (select auth.uid())
    ),
    false
  );
$$;


ALTER FUNCTION "public"."is_active_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select public.is_active_user()
     and exists (
       select 1 from public.admins a
       where a.user_id = (select auth.uid())
     );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_group"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  g bigint := public.my_group_id();
  cur bigint;
begin
  if g is null then
    raise exception 'Du är inte med i någon grupp';
  end if;

  perform 1 from public.groups where id = g for update;

  select group_id into cur from public.profiles where id = auth.uid();
  if cur is distinct from g then
    raise exception 'Du är inte med i någon grupp';
  end if;

  update public.profiles set group_id = null where id = auth.uid();
  perform public.dissolve_group_if_alone(g);
end;
$$;


ALTER FUNCTION "public"."leave_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."like_listing"("p_listing_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not public.is_active_user() then
    raise exception 'Ditt konto är inte aktivt';
  end if;

  -- Only listings that are already visible to me: matched to me or to someone in my group
  if not exists (
    select 1 from public.user_listings ul
    where ul.listing_id = p_listing_id
      and public.shares_group_with(ul.user_id)
  ) then
    raise exception 'Annonsen finns inte eller är inte tillgänglig för dig';
  end if;

  -- A like counts as seen, so is_new is cleared also when the row already exists
  insert into public.user_listings (user_id, listing_id, liked, is_new)
  values (auth.uid(), p_listing_id, true, false)
  on conflict (user_id, listing_id) do update set liked = true, is_new = false;

  insert into public.seen_listings (user_id, listing_id)
  values (auth.uid(), p_listing_id)
  on conflict (user_id, listing_id) do nothing;
end;
$$;


ALTER FUNCTION "public"."like_listing"("p_listing_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."limit_invites_per_pair"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if (
    select count(*) from public.invites
    where from_user_id = new.from_user_id
      and lower(to_email) = lower(new.to_email)
  ) >= 20 then
    raise exception 'Du har skickat för många inbjudningar till den här personen';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."limit_invites_per_pair"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."limit_search_params_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new is not distinct from old then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.user_id::text));

  if (select count(*) from public.search_params_log
      where user_id = new.user_id and changed_at > now() - interval '24 hours') >= 5 then
    raise exception 'Du har ändrat din sökning för många gånger. Försök igen senare';
  end if;

  insert into public.search_params_log (user_id, operation, old_values, new_values)
  values (new.user_id, tg_op, case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
  return new;
end;
$$;


ALTER FUNCTION "public"."limit_search_params_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."limit_showings_per_group"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.group_id is not null then
    perform 1 from public.groups where id = new.group_id for update;
    if (select count(*) from public.showings where group_id = new.group_id) >= 50 then
      raise exception 'Gruppen har redan max antal visningar (50)';
    end if;
  else
    perform 1 from public.profiles where id = new.user_id for no key update;
    if (select count(*) from public.showings where user_id = new.user_id) >= 50 then
      raise exception 'Du har redan max antal visningar (50)';
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."limit_showings_per_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."limit_tags_per_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  -- no key update: does not block the foreign key check of other inserts
  perform 1 from public.profiles where id = new.user_id for no key update;
  if (select count(*) from public.user_tags where user_id = new.user_id) >= 30 then
    raise exception 'Du har redan max antal kategorier (30)';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."limit_tags_per_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_showing_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_actor uuid := auth.uid();
begin
  -- Only changes made by a signed-in user with a profile. Skips pg_cron (purge_old_showings()), scripts, the SQL Editor
  -- and account deletion (the profile is already gone when handle_deleted_profile() runs)
  if v_actor is null or not exists (select 1 from public.profiles where id = v_actor) then
    return null;
  end if;

  if tg_op = 'INSERT' then
    if new.group_id is null then
      return null;  -- personal showing: nobody else to tell
    end if;
    insert into public.showing_events (group_id, actor_id, listing_id, action, showing_date, start_time)
    values (new.group_id, v_actor, new.listing_id, 'created', new.showing_date, new.start_time);

  elsif tg_op = 'UPDATE' then
    -- A move between owners (move_personal_showings() in accept_invite(), dissolve_group_if_alone()) is not a change of the showing
    if new.group_id is null or old.group_id is distinct from new.group_id then
      return null;
    end if;
    -- Saving without changing anything is not a change
    if (old.showing_date, old.start_time, old.note) is not distinct from (new.showing_date, new.start_time, new.note) then
      return null;
    end if;
    insert into public.showing_events (group_id, actor_id, listing_id, action, showing_date, start_time)
    values (new.group_id, v_actor, new.listing_id, 'updated', new.showing_date, new.start_time);

  elsif tg_op = 'DELETE' then
    if old.group_id is null then
      return null;
    end if;
    -- Deleted together with its group (cascade): the group row is already gone and nobody is left to tell
    if not exists (select 1 from public.groups where id = old.group_id) then
      return null;
    end if;
    insert into public.showing_events (group_id, actor_id, listing_id, action, showing_date, start_time)
    values (old.group_id, v_actor, old.listing_id, 'deleted', old.showing_date, old.start_time);
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."log_showing_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_listing_seen"("p_listing_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not public.is_active_user() then
    raise exception 'Ditt konto är inte aktivt';
  end if;

  -- My own match: same as before
  update public.user_listings
  set is_new = false
  where user_id = auth.uid()
    and listing_id = p_listing_id
    and is_new;

  -- Remember it, also without a user_listings row (a group member's listing outside my search).
  -- Only listings visible to me (same rule as like_listing()); anything else is silently ignored, as before
  insert into public.seen_listings (user_id, listing_id)
  select auth.uid(), p_listing_id
  where exists (
    select 1 from public.user_listings ul
    where ul.listing_id = p_listing_id
      and public.shares_group_with(ul.user_id)
  )
  on conflict (user_id, listing_id) do nothing;
end;
$$;


ALTER FUNCTION "public"."mark_listing_seen"("p_listing_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_listing_seen"("p_listing_id" bigint) IS 'Called by the app when the listing page opens. Sets is_new = false on my own user_listings row (if any) and records the listing in seen_listings, also when I have no row (a group member''s listing outside my search).';



CREATE OR REPLACE FUNCTION "public"."mark_notifications_seen"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not public.is_active_user() then
    raise exception 'Ditt konto är inte aktivt';
  end if;

  update public.profiles
  set notifications_seen_at = now()
  where id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."mark_notifications_seen"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_notifications_seen"() IS 'Sets my notifications_seen_at to now. Call it when the user leaves the notifications page (or after its data has loaded), so the page can still highlight what was new.';



CREATE OR REPLACE FUNCTION "public"."match_user_listings"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  inserted integer;
begin
  with matches as (
    -- Every (user, listing) pair that currently matches a search
    select sp.user_id, l.id as listing_id
    from public.search_params sp
    join public.listings l on (
          (cardinality(sp.property_types) = 0 or l.property_type = any (sp.property_types))
      and l.municipality = any (sp.municipalities)
      and (
            lower(l.area) in (select lower(x) from unnest(sp.areas) as x)
            or not exists (
              select 1
              from public.areas a
              join public.municipalities m on m.id = a.municipality_id
              where m.name = l.municipality and lower(a.name) in (select lower(x) from unnest(sp.areas) as x)
            )
          )
      and (sp.min_price is null or l.price is null or l.price >= sp.min_price)
      and (sp.max_price is null or l.price is null or l.price <= sp.max_price)
      and (sp.min_rooms is null or l.rooms is null or l.rooms >= sp.min_rooms)
      and (sp.max_rooms is null or l.rooms is null or l.rooms <= sp.max_rooms)
      and (sp.max_monthly_fee is null or l.monthly_fee is null or l.monthly_fee <= sp.max_monthly_fee)
      and (sp.min_living_area is null or l.living_area is null or l.living_area >= sp.min_living_area)
      and (sp.include_new_construction is not false or not l.is_new_construction)
    )
    where (p_user_id is null or sp.user_id = p_user_id)
      and l.removed_at is null
  ),
  stale as (
    -- Rows that no longer match and the user has not acted on. Liked and tagged listings are kept, and so are removed listings ("Hittas inte" until purged).
    -- What the user has seen is kept in seen_listings, so it is not lost here
    delete from public.user_listings ul
    where (p_user_id is null or ul.user_id = p_user_id)
      and exists (select 1 from public.search_params sp where sp.user_id = ul.user_id)
      and not ul.liked
      and not exists (select 1 from public.listing_tags lt where lt.user_listing_id = ul.id)
      and not exists (
        select 1 from public.listings l
        where l.id = ul.listing_id and l.removed_at is not null
      )
      and not exists (
        select 1 from matches m
        where m.user_id = ul.user_id and m.listing_id = ul.listing_id
      )
    returning ul.id
  ),
  out_of_search as (
    -- The kept rows (liked, tagged or removed) that no longer match: still readable, but not on Sök bostad
    update public.user_listings ul
    set in_search = false
    where (p_user_id is null or ul.user_id = p_user_id)
      and ul.in_search
      and not exists (
        select 1 from matches m
        where m.user_id = ul.user_id and m.listing_id = ul.listing_id
      )
    returning ul.id
  ),
  upserted as (
    -- A listing the user has already opened (seen_listings) does not become "new" again when it matches again.
    -- An existing row (e.g. liked from a group member, or from an earlier search) is moved into the search
    insert into public.user_listings (user_id, listing_id, is_new, liked, in_search)
    select m.user_id, m.listing_id,
           not exists (select 1 from public.seen_listings s where s.user_id = m.user_id and s.listing_id = m.listing_id),
           false,
           true
    from matches m
    on conflict (user_id, listing_id) do update set in_search = true
      where not public.user_listings.in_search
    -- xmax = 0 only for a newly inserted row, so the return value still counts new matches only
    returning (xmax = 0) as is_insert
  )
  select count(*) filter (where is_insert) into inserted from upserted;

  return inserted;
end;
$$;


ALTER FUNCTION "public"."match_user_listings"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_personal_showings"("p_user" "uuid", "p_group" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  skipped jsonb;
begin
  -- Collected before anything is changed
  select coalesce(jsonb_agg(jsonb_build_object(
           'address',      coalesce(l.address, l.area, l.municipality),
           'url',          l.url,
           'showing_date', s.showing_date,
           'start_time',   s.start_time
         ) order by s.showing_date, s.start_time), '[]'::jsonb)
  into skipped
  from public.showings s
  join public.listings l on l.id = s.listing_id
  where s.user_id = p_user
    and exists (
      select 1 from public.showings g
      where g.group_id = p_group and g.listing_id = s.listing_id
    );

  update public.showings s
  set group_id = p_group, user_id = null
  where s.user_id = p_user
    and not exists (
      select 1 from public.showings g
      where g.group_id = p_group and g.listing_id = s.listing_id
    );

  delete from public.showings where user_id = p_user;

  return skipped;
end;
$$;


ALTER FUNCTION "public"."move_personal_showings"("p_user" "uuid", "p_group" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_avatar_count"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select count(*)
  from storage.objects o
  where o.bucket_id = 'avatars'
    and (storage.foldername(o.name))[1] = (select auth.uid())::text;
$$;


ALTER FUNCTION "public"."my_avatar_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_group_id"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select group_id from public.profiles where id = auth.uid()
$$;


ALTER FUNCTION "public"."my_group_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_group_members"() RETURNS TABLE("id" "uuid", "name" "text", "avatar_path" "text", "email" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select p.id, p.name, p.avatar_path, u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_active_user()
    and p.group_id = public.my_group_id()
    and p.id <> auth.uid()
  order by p.name;
$$;


ALTER FUNCTION "public"."my_group_members"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_new_listing_ids"() RETURNS TABLE("listing_id" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  -- 1) My own matches I have not opened: exactly what getNewListingIds() returned before
  select ul.listing_id
  from public.user_listings ul
  join public.listings l on l.id = ul.listing_id
  where public.is_active_user()
    and ul.user_id = (select auth.uid())
    and ul.is_new
    and l.removed_at is null

  union

  -- 2) Listings a member of my group has liked, that I have no row for and have never opened
  select ul.listing_id
  from public.user_listings ul
  join public.profiles p on p.id = ul.user_id
  join public.listings l on l.id = ul.listing_id
  where public.is_active_user()
    and p.group_id = public.my_group_id()
    and ul.user_id <> (select auth.uid())
    and ul.liked
    and l.removed_at is null
    and not exists (
      select 1 from public.user_listings mine
      where mine.user_id = (select auth.uid()) and mine.listing_id = ul.listing_id
    )
    and not exists (
      select 1 from public.seen_listings s
      where s.user_id = (select auth.uid()) and s.listing_id = ul.listing_id
    )
$$;


ALTER FUNCTION "public"."my_new_listing_ids"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."my_new_listing_ids"() IS 'The listing ids that are new to me: my own matches with is_new = true, plus listings a group member has liked that I have no user_listings row for and have never opened (seen_listings). Removed listings are left out. Read-only, call with GET. Same shape as the old user_listings query ({ listing_id }), so the app''s Set of ids works unchanged.';



CREATE OR REPLACE FUNCTION "public"."my_pending_invites"() RETURNS TABLE("id" bigint, "created_at" timestamp with time zone, "from_user_id" "uuid", "from_name" "text", "from_email" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select i.id, i.created_at, i.from_user_id, p.name, u.email::text
  from public.invites i
  join public.profiles p on p.id = i.from_user_id
  join auth.users u on u.id = i.from_user_id
  where public.is_active_user()
    and p.is_active
    and i.status = 'pending'
    and lower(i.to_email) = lower(auth.jwt() ->> 'email')
  order by i.created_at desc;
$$;


ALTER FUNCTION "public"."my_pending_invites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_showing_events"() RETURNS TABLE("id" bigint, "created_at" timestamp with time zone, "action" "public"."showing_event_action", "actor_id" "uuid", "actor_name" "text", "listing_id" bigint, "address" "text", "showing_date" "date", "start_time" time without time zone, "is_unseen" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    e.id, e.created_at, e.action, e.actor_id, p.name, e.listing_id, l.address, e.showing_date, e.start_time,
    e.created_at > coalesce(
      (select me.notifications_seen_at from public.profiles me where me.id = (select auth.uid())),
      '-infinity'::timestamptz
    )
  from public.showing_events e
  join public.profiles p on p.id = e.actor_id
  join public.listings l on l.id = e.listing_id
  where public.is_active_user()
    and e.group_id = public.my_group_id()
    and e.actor_id <> (select auth.uid())   -- never my own changes
  order by e.created_at desc, e.id desc
  limit 100;
$$;


ALTER FUNCTION "public"."my_showing_events"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."my_showing_events"() IS 'Changes to my group''s showings made by the other members in the last 30 days, newest first (max 100), with the member''s name and the listing''s address. is_unseen = newer than my notifications_seen_at. Empty without a group. Read-only, call with GET.';



CREATE OR REPLACE FUNCTION "public"."orphan_avatar_objects"("min_age" interval DEFAULT '01:00:00'::interval) RETURNS TABLE("object_name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'avatars'
    and o.created_at < now() - min_age
    and not exists (select 1 from public.profiles p where p.avatar_path = o.name)
$$;


ALTER FUNCTION "public"."orphan_avatar_objects"("min_age" interval) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_old_invites"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with deleted as (
    delete from public.invites
    where (status = 'pending' and created_at < now() - interval '90 days')
       or (status <> 'pending' and coalesce(responded_at, created_at) < now() - interval '1 year')
    returning 1
  )
  select count(*)::int from deleted;
$$;


ALTER FUNCTION "public"."purge_old_invites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_old_scrape_runs"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with deleted as (
    delete from public.scrape_runs
    where started_at < now() - interval '90 days'
    returning 1
  )
  select count(*)::int from deleted;
$$;


ALTER FUNCTION "public"."purge_old_scrape_runs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_old_showing_events"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with deleted as (
    delete from public.showing_events
    where created_at < now() - interval '30 days'
    returning 1
  )
  select count(*)::int from deleted;
$$;


ALTER FUNCTION "public"."purge_old_showing_events"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."purge_old_showing_events"() IS 'Deletes showing_events older than 30 days. Run daily by pg_cron (purge-old-showing-events).';



CREATE OR REPLACE FUNCTION "public"."purge_old_showings"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with deleted as (
    delete from public.showings
    where showing_date < current_date - 30
    returning 1
  )
  select count(*)::int from deleted;
$$;


ALTER FUNCTION "public"."purge_old_showings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_rate_limit_counters"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with deleted as (
    delete from public.api_rate_limit
    where minute < now() - interval '1 hour'
    returning 1
  )
  select count(*)::int from deleted;
$$;


ALTER FUNCTION "public"."purge_rate_limit_counters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_removed_listings"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with deleted as (
    delete from public.listings
    where removed_at < now() - interval '10 days'
    returning 1
  )
  select count(*)::int from deleted;
$$;


ALTER FUNCTION "public"."purge_removed_listings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_search_params_log"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with deleted as (
    delete from public.search_params_log where changed_at < now() - interval '90 days' returning 1
  )
  select count(*)::int from deleted;
$$;


ALTER FUNCTION "public"."purge_search_params_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_group_member"("target" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  g bigint;
  cur bigint;
  target_group bigint;
begin
  if not public.is_active_user() then
    raise exception 'Ditt konto är inte aktivt';
  end if;

  if target is null or target = auth.uid() then
    raise exception 'Använd "Lämna grupp" för att lämna din egen grupp';
  end if;

  g := public.my_group_id();
  if g is null then
    raise exception 'Du är inte med i någon grupp';
  end if;

  perform 1 from public.groups where id = g for update;

  -- After the lock: check again, someone may have changed the group in the meantime.
  select group_id into cur from public.profiles where id = auth.uid();
  if cur is distinct from g then
    raise exception 'Du är inte med i någon grupp';
  end if;

  select group_id into target_group from public.profiles where id = target;
  if target_group is distinct from g then
    raise exception 'Personen är inte längre med i din grupp';
  end if;

  update public.profiles set group_id = null where id = target;
  perform public.dissolve_group_if_alone(g);
end;
$$;


ALTER FUNCTION "public"."remove_group_member"("target" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_params_match_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  perform public.match_user_listings(new.user_id);
  return new;
end;
$$;


ALTER FUNCTION "public"."search_params_match_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_liked_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if not new.liked then
    new.liked_at := null;
  elsif tg_op = 'INSERT' or not old.liked then
    new.liked_at := now();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_liked_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "agency" "text" NOT NULL,
    "external_id" bigint NOT NULL,
    "url" "text" NOT NULL,
    "ld_json" "jsonb" NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "removed_at" timestamp with time zone,
    "property_type" "public"."property_type" NOT NULL,
    "municipality" "text",
    "area" "text",
    "price" bigint,
    "rooms" numeric(3,1),
    "latitude" double precision,
    "longitude" double precision,
    "monthly_fee" bigint,
    "living_area" numeric,
    "is_new_construction" boolean DEFAULT false NOT NULL,
    "address" "text",
    "image_url" "text",
    "description" "text",
    "floor_level" smallint,
    "plot_area" bigint,
    "build_year" smallint,
    CONSTRAINT "listings_address_length" CHECK ((("address" IS NULL) OR (("char_length"("address") >= 1) AND ("char_length"("address") <= 300)))),
    CONSTRAINT "listings_area_length" CHECK ((("area" IS NULL) OR ("char_length"("area") <= 100))),
    CONSTRAINT "listings_build_year_check" CHECK ((("build_year" IS NULL) OR (("build_year" >= 1000) AND ("build_year" <= 2100)))),
    CONSTRAINT "listings_description_length" CHECK ((("description" IS NULL) OR ("char_length"("description") <= 5000))),
    CONSTRAINT "listings_floor_level_check" CHECK ((("floor_level" IS NULL) OR (("floor_level" >= '-5'::integer) AND ("floor_level" <= 100)))),
    CONSTRAINT "listings_image_url_check" CHECK ((("image_url" IS NULL) OR (("char_length"("image_url") <= 500) AND ("image_url" ~~ 'https://%'::"text")))),
    CONSTRAINT "listings_latitude_check" CHECK ((("latitude" IS NULL) OR (("latitude" >= (55)::double precision) AND ("latitude" <= (70)::double precision)))),
    CONSTRAINT "listings_ld_json_size" CHECK (("octet_length"(("ld_json")::"text") <= 300000)),
    CONSTRAINT "listings_living_area_check" CHECK ((("living_area" IS NULL) OR (("living_area" > (0)::numeric) AND ("living_area" <= (10000)::numeric)))),
    CONSTRAINT "listings_longitude_check" CHECK ((("longitude" IS NULL) OR (("longitude" >= (10)::double precision) AND ("longitude" <= (25)::double precision)))),
    CONSTRAINT "listings_monthly_fee_check" CHECK ((("monthly_fee" IS NULL) OR (("monthly_fee" >= 1) AND ("monthly_fee" <= 100000)))),
    CONSTRAINT "listings_plot_area_check" CHECK ((("plot_area" IS NULL) OR (("plot_area" >= 0) AND ("plot_area" <= 10000000)))),
    CONSTRAINT "listings_price_check" CHECK ((("price" IS NULL) OR (("price" >= 1) AND ("price" <= 1000000000)))),
    CONSTRAINT "listings_rooms_check" CHECK ((("rooms" IS NULL) OR (("rooms" > (0)::numeric) AND ("rooms" <= (100)::numeric)))),
    CONSTRAINT "listings_url_check" CHECK ((("char_length"("url") <= 500) AND ("url" ~~ 'https://%'::"text")))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


COMMENT ON TABLE "public"."listings" IS 'Scraped listings, shared by all users. Matched to users through user_listings.';



CREATE OR REPLACE FUNCTION "public"."shared_likes"() RETURNS SETOF "public"."listings"
    LANGUAGE "sql" STABLE
    AS $$
  select l.* from public.listings l
  where l.id in (
    select ul.listing_id
    from public.user_listings ul
    join public.profiles p on p.id = ul.user_id
    where p.group_id = public.my_group_id() and ul.liked
    group by ul.listing_id
    having count(*) = (select count(*) from public.profiles
                       where group_id = public.my_group_id())
  )
$$;


ALTER FUNCTION "public"."shared_likes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."shares_group_with"("target" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    target = (select auth.uid())
    or exists (
      select 1
      from public.profiles me
      join public.profiles other on other.group_id = me.group_id
      where me.id = (select auth.uid())
        and other.id = target
        and me.group_id is not null
    );
$$;


ALTER FUNCTION "public"."shares_group_with"("target" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_search_places"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  bad text;
begin
  select m into bad
  from unnest(new.municipalities) as m
  where not exists (select 1 from public.municipalities x where x.name = m)
  limit 1;
  if bad is not null then
    raise exception 'Okänd kommun: %', bad;
  end if;

  select a into bad
  from unnest(new.areas) as a
  where not exists (
    select 1
    from public.areas x
    join public.municipalities m on m.id = x.municipality_id
    where x.name = a and m.name = any (new.municipalities)
  )
  limit 1;
  if bad is not null then
    raise exception 'Området "%" finns inte i någon av dina valda kommuner', bad;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validate_search_places"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_params" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_types" "public"."property_type"[] DEFAULT '{}'::"public"."property_type"[] NOT NULL,
    "municipalities" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "max_price" bigint,
    "areas" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "min_rooms" numeric(3,1),
    "max_rooms" numeric(3,1),
    "min_price" bigint,
    "max_monthly_fee" bigint,
    "min_living_area" numeric,
    "include_new_construction" boolean DEFAULT true,
    CONSTRAINT "search_params_flat_arrays" CHECK (((COALESCE("array_ndims"("municipalities"), 1) = 1) AND (COALESCE("array_ndims"("areas"), 1) = 1) AND (COALESCE("array_ndims"("property_types"), 1) = 1))),
    CONSTRAINT "search_params_living_area_check" CHECK ((("min_living_area" IS NULL) OR (("min_living_area" >= (0)::numeric) AND ("min_living_area" <= (10000)::numeric)))),
    CONSTRAINT "search_params_monthly_fee_check" CHECK ((("max_monthly_fee" IS NULL) OR (("max_monthly_fee" >= 0) AND ("max_monthly_fee" <= 100000)))),
    CONSTRAINT "search_params_place_limit" CHECK ((("cardinality"("municipalities") <= 10) AND ("cardinality"("areas") <= 200))),
    CONSTRAINT "search_params_price_check" CHECK ((("min_price" IS NULL) OR ("max_price" IS NULL) OR ("min_price" <= "max_price"))),
    CONSTRAINT "search_params_price_range" CHECK (((("min_price" IS NULL) OR (("min_price" >= 0) AND ("min_price" <= 1000000000))) AND (("max_price" IS NULL) OR (("max_price" >= 0) AND ("max_price" <= 1000000000))))),
    CONSTRAINT "search_params_rooms_check" CHECK ((("min_rooms" IS NULL) OR ("max_rooms" IS NULL) OR ("min_rooms" <= "max_rooms"))),
    CONSTRAINT "search_params_rooms_range" CHECK (((("min_rooms" IS NULL) OR (("min_rooms" > (0)::numeric) AND ("min_rooms" <= (100)::numeric))) AND (("max_rooms" IS NULL) OR (("max_rooms" > (0)::numeric) AND ("max_rooms" <= (100)::numeric)))))
);


ALTER TABLE "public"."search_params" OWNER TO "postgres";


COMMENT ON TABLE "public"."search_params" IS 'One search per user. Decides which listings match the user and which municipalities the scraper covers.';



ALTER TABLE "public"."search_params" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."SearchParams_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."admins" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


COMMENT ON TABLE "public"."admins" IS 'Product admins (the product owner). Rows are added only through the Dashboard or service_role. The app reads it only through is_admin().';



CREATE TABLE IF NOT EXISTS "public"."api_rate_limit" (
    "user_id" "uuid" NOT NULL,
    "minute" timestamp with time zone NOT NULL,
    "writes" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."api_rate_limit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."areas" (
    "id" bigint NOT NULL,
    "municipality_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text",
    CONSTRAINT "areas_display_name_check" CHECK ((("display_name" IS NULL) OR (("display_name" <> ''::"text") AND ("display_name" = "btrim"("display_name"))))),
    CONSTRAINT "areas_name_check" CHECK ((("name" <> ''::"text") AND ("name" = "btrim"("name"))))
);


ALTER TABLE "public"."areas" OWNER TO "postgres";


ALTER TABLE "public"."areas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."areas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."counties" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."counties" OWNER TO "postgres";


ALTER TABLE "public"."counties" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."counties_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


ALTER TABLE "public"."groups" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_email" "text" NOT NULL,
    "status" "public"."invite_status" DEFAULT 'pending'::"public"."invite_status" NOT NULL,
    "responded_at" timestamp with time zone,
    CONSTRAINT "invites_email_length" CHECK (("char_length"("to_email") <= 254))
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


ALTER TABLE "public"."invites" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."invites_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."listing_tags" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_tag_id" bigint NOT NULL,
    "user_listing_id" bigint NOT NULL
);


ALTER TABLE "public"."listing_tags" OWNER TO "postgres";


ALTER TABLE "public"."listing_tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."listing_tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."listings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."listings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."municipalities" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "county_id" bigint NOT NULL
);


ALTER TABLE "public"."municipalities" OWNER TO "postgres";


ALTER TABLE "public"."municipalities" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."municipalities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "group_id" bigint,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "onboarding_completed_at" timestamp with time zone,
    "avatar_path" "text",
    "email_frequency" "public"."email_frequency" DEFAULT 'day'::"public"."email_frequency" NOT NULL,
    "last_emailed_at" timestamp with time zone,
    "notifications_seen_at" timestamp with time zone,
    CONSTRAINT "profiles_avatar_path_check" CHECK ((("avatar_path" IS NULL) OR (("char_length"("avatar_path") <= 200) AND ("avatar_path" ~ (('^'::"text" || ("id")::"text") || '/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$'::"text"))))),
    CONSTRAINT "profiles_name_length" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 100)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."notifications_seen_at" IS 'When the user last opened the notifications page. Anything newer counts as unseen (has_new_notifications(), my_showing_events().is_unseen). null = never opened. Set only by mark_notifications_seen().';



CREATE TABLE IF NOT EXISTS "public"."scrape_issues" (
    "id" bigint NOT NULL,
    "agency" "text" NOT NULL,
    "kind" "public"."scrape_issue_kind" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurrences" integer DEFAULT 1 NOT NULL,
    "status" "public"."scrape_issue_status" DEFAULT 'open'::"public"."scrape_issue_status" NOT NULL,
    "first_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notified_at" timestamp with time zone,
    "resolved_at" timestamp with time zone
);


ALTER TABLE "public"."scrape_issues" OWNER TO "postgres";


ALTER TABLE "public"."scrape_issues" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."scrape_issues_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."scrape_runs" (
    "id" bigint NOT NULL,
    "run_started_at" timestamp with time zone NOT NULL,
    "github_run_id" bigint,
    "agency" "text" NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "finished_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "outcome" "public"."scrape_run_outcome" NOT NULL,
    "reason" "text",
    "saved" integer DEFAULT 0 NOT NULL,
    "failed_pages" integer DEFAULT 0 NOT NULL,
    "removed" integer DEFAULT 0 NOT NULL,
    "message" "text",
    CONSTRAINT "scrape_runs_counts_check" CHECK ((("saved" >= 0) AND ("failed_pages" >= 0) AND ("removed" >= 0))),
    CONSTRAINT "scrape_runs_message_length" CHECK ((("message" IS NULL) OR ("char_length"("message") <= 2000))),
    CONSTRAINT "scrape_runs_reason_length" CHECK ((("reason" IS NULL) OR ("char_length"("reason") <= 50)))
);


ALTER TABLE "public"."scrape_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."scrape_runs" IS 'One row per scrape run and agency, written by the scraper (service_role). Problems and their details live in scrape_issues. Rows older than 90 days are deleted by purge_old_scrape_runs().';



ALTER TABLE "public"."scrape_runs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."scrape_runs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."search_params_log" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "operation" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb" NOT NULL,
    CONSTRAINT "search_params_log_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text"])))
);


ALTER TABLE "public"."search_params_log" OWNER TO "postgres";


ALTER TABLE "public"."search_params_log" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."search_params_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."seen_listings" (
    "user_id" "uuid" NOT NULL,
    "listing_id" bigint NOT NULL,
    "seen_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seen_listings" OWNER TO "postgres";


COMMENT ON TABLE "public"."seen_listings" IS 'Listings a user has opened (or liked). Written by mark_listing_seen() and like_listing(), never by the app. Unlike user_listings.is_new it survives the user_listings row being deleted by match_user_listings(), and also covers a group member''s listings outside my search. Read by match_user_listings() (a listing I have seen is not new again) and my_new_listing_ids().';



CREATE TABLE IF NOT EXISTS "public"."showing_events" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "group_id" bigint NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "listing_id" bigint NOT NULL,
    "action" "public"."showing_event_action" NOT NULL,
    "showing_date" "date" NOT NULL,
    "start_time" time without time zone
);


ALTER TABLE "public"."showing_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."showing_events" IS 'Log of changes to group showings (created, updated, deleted) for the notifications page. Written only by the trigger showings_log_event, read by the app through my_showing_events(). Kept 30 days (purge_old_showing_events()). Personal showings, moves between owners and changes without a signed-in user (pg_cron, scripts) are not logged.';



ALTER TABLE "public"."showing_events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."showing_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."showings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "group_id" bigint DEFAULT "public"."my_group_id"(),
    "listing_id" bigint NOT NULL,
    "showing_date" "date" NOT NULL,
    "start_time" time without time zone,
    "note" "text",
    "user_id" "uuid" DEFAULT 
CASE
    WHEN ("public"."my_group_id"() IS NULL) THEN "auth"."uid"()
    ELSE NULL::"uuid"
END,
    CONSTRAINT "showings_date_range" CHECK ((("showing_date" >= '2000-01-01'::"date") AND ("showing_date" <= '2099-12-31'::"date"))),
    CONSTRAINT "showings_note_length" CHECK ((("note" IS NULL) OR ("char_length"("note") <= 500))),
    CONSTRAINT "showings_owner_check" CHECK (("num_nonnulls"("group_id", "user_id") = 1))
);


ALTER TABLE "public"."showings" OWNER TO "postgres";


ALTER TABLE "public"."showings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."showings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_listings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" bigint NOT NULL,
    "is_new" boolean DEFAULT true NOT NULL,
    "liked" boolean DEFAULT false NOT NULL,
    "liked_at" timestamp with time zone,
    "in_search" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."user_listings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_listings" IS 'Matches between users and listings, with the user''s liked and is_new flags.';



COMMENT ON COLUMN "public"."user_listings"."in_search" IS 'True when the listing matches the user''s current search params. Written only by match_user_listings(). Rows kept because they are liked, tagged or removed get false, and so do rows created by like_listing() for a group member''s listing. The search feed shows only in_search = true; the liked lists ignore it.';



ALTER TABLE "public"."user_listings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_listings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_tags" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tag_name" "text" NOT NULL,
    CONSTRAINT "user_tags_name_length" CHECK ((("char_length"("tag_name") >= 1) AND ("char_length"("tag_name") <= 20))),
    CONSTRAINT "user_tags_name_not_blank" CHECK (("tag_name" ~ '\S'::"text"))
);


ALTER TABLE "public"."user_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_tags" IS 'Each user''s own tags (categories in the app).';



ALTER TABLE "public"."user_tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."api_rate_limit"
    ADD CONSTRAINT "api_rate_limit_pkey" PRIMARY KEY ("user_id", "minute");



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counties"
    ADD CONSTRAINT "counties_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."counties"
    ADD CONSTRAINT "counties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_tags"
    ADD CONSTRAINT "listing_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_tags"
    ADD CONSTRAINT "listing_tags_unique" UNIQUE ("user_tag_id", "user_listing_id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_agency_external_id_key" UNIQUE ("agency", "external_id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."municipalities"
    ADD CONSTRAINT "municipalities_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."municipalities"
    ADD CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scrape_issues"
    ADD CONSTRAINT "scrape_issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scrape_runs"
    ADD CONSTRAINT "scrape_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_params_log"
    ADD CONSTRAINT "search_params_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_params"
    ADD CONSTRAINT "search_params_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_params"
    ADD CONSTRAINT "search_params_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."seen_listings"
    ADD CONSTRAINT "seen_listings_pkey" PRIMARY KEY ("user_id", "listing_id");



ALTER TABLE ONLY "public"."showing_events"
    ADD CONSTRAINT "showing_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showings"
    ADD CONSTRAINT "showings_group_listing_unique" UNIQUE ("group_id", "listing_id");



ALTER TABLE ONLY "public"."showings"
    ADD CONSTRAINT "showings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showings"
    ADD CONSTRAINT "showings_user_listing_unique" UNIQUE ("user_id", "listing_id");



ALTER TABLE ONLY "public"."user_listings"
    ADD CONSTRAINT "user_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_listings"
    ADD CONSTRAINT "user_listings_unique" UNIQUE ("user_id", "listing_id");



ALTER TABLE ONLY "public"."user_tags"
    ADD CONSTRAINT "user_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tags"
    ADD CONSTRAINT "user_tags_unique" UNIQUE ("user_id", "tag_name");



CREATE UNIQUE INDEX "areas_municipality_name_key" ON "public"."areas" USING "btree" ("municipality_id", "lower"("name"));



CREATE UNIQUE INDEX "invites_one_pending" ON "public"."invites" USING "btree" ("from_user_id", "lower"("to_email")) WHERE ("status" = 'pending'::"public"."invite_status");



CREATE INDEX "listing_tags_user_listing_id_idx" ON "public"."listing_tags" USING "btree" ("user_listing_id");



CREATE INDEX "listings_agency_active_idx" ON "public"."listings" USING "btree" ("agency", "last_seen_at") WHERE ("removed_at" IS NULL);



CREATE UNIQUE INDEX "scrape_issues_one_open" ON "public"."scrape_issues" USING "btree" ("agency", "kind") WHERE ("status" = 'open'::"public"."scrape_issue_status");



CREATE INDEX "scrape_runs_agency_started" ON "public"."scrape_runs" USING "btree" ("agency", "started_at" DESC);



CREATE INDEX "search_params_log_user_changed_idx" ON "public"."search_params_log" USING "btree" ("user_id", "changed_at");



CREATE INDEX "seen_listings_listing_id_idx" ON "public"."seen_listings" USING "btree" ("listing_id");



CREATE INDEX "showing_events_actor_id_idx" ON "public"."showing_events" USING "btree" ("actor_id");



CREATE INDEX "showing_events_group_created_idx" ON "public"."showing_events" USING "btree" ("group_id", "created_at" DESC);



CREATE INDEX "showing_events_listing_id_idx" ON "public"."showing_events" USING "btree" ("listing_id");



CREATE INDEX "showings_listing_id_idx" ON "public"."showings" USING "btree" ("listing_id");



CREATE INDEX "user_listings_listing_id_idx" ON "public"."user_listings" USING "btree" ("listing_id");



CREATE OR REPLACE TRIGGER "invites_check_recipient" BEFORE INSERT ON "public"."invites" FOR EACH ROW EXECUTE FUNCTION "public"."check_invite_recipient"();



CREATE OR REPLACE TRIGGER "invites_limit_per_pair" BEFORE INSERT ON "public"."invites" FOR EACH ROW EXECUTE FUNCTION "public"."limit_invites_per_pair"();



CREATE OR REPLACE TRIGGER "on_profile_deleted" AFTER DELETE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_deleted_profile"();



CREATE OR REPLACE TRIGGER "search_params_check_places" BEFORE INSERT OR UPDATE OF "municipalities", "areas" ON "public"."search_params" FOR EACH ROW EXECUTE FUNCTION "public"."validate_search_places"();



CREATE OR REPLACE TRIGGER "search_params_limit_changes" BEFORE INSERT OR UPDATE OF "property_types", "municipalities", "areas", "min_price", "max_price", "min_rooms", "max_rooms", "max_monthly_fee", "min_living_area", "include_new_construction" ON "public"."search_params" FOR EACH ROW EXECUTE FUNCTION "public"."limit_search_params_changes"();



CREATE OR REPLACE TRIGGER "search_params_match" AFTER INSERT OR UPDATE OF "property_types", "municipalities", "areas", "min_price", "max_price", "min_rooms", "max_rooms", "max_monthly_fee", "min_living_area", "include_new_construction" ON "public"."search_params" FOR EACH ROW EXECUTE FUNCTION "public"."search_params_match_trigger"();



CREATE OR REPLACE TRIGGER "showings_limit_per_group" BEFORE INSERT ON "public"."showings" FOR EACH ROW EXECUTE FUNCTION "public"."limit_showings_per_group"();



CREATE OR REPLACE TRIGGER "showings_log_event" AFTER INSERT OR DELETE OR UPDATE ON "public"."showings" FOR EACH ROW EXECUTE FUNCTION "public"."log_showing_event"();



CREATE OR REPLACE TRIGGER "user_listings_set_liked_at" BEFORE INSERT OR UPDATE OF "liked" ON "public"."user_listings" FOR EACH ROW EXECUTE FUNCTION "public"."set_liked_at"();



CREATE OR REPLACE TRIGGER "user_tags_limit_per_user" BEFORE INSERT ON "public"."user_tags" FOR EACH ROW EXECUTE FUNCTION "public"."limit_tags_per_user"();



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_tags"
    ADD CONSTRAINT "listing_tags_user_listing_id_fkey" FOREIGN KEY ("user_listing_id") REFERENCES "public"."user_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_tags"
    ADD CONSTRAINT "listing_tags_user_tag_id_fkey" FOREIGN KEY ("user_tag_id") REFERENCES "public"."user_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_municipality_fkey" FOREIGN KEY ("municipality") REFERENCES "public"."municipalities"("name") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."municipalities"
    ADD CONSTRAINT "municipalities_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_params_log"
    ADD CONSTRAINT "search_params_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_params"
    ADD CONSTRAINT "search_params_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seen_listings"
    ADD CONSTRAINT "seen_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seen_listings"
    ADD CONSTRAINT "seen_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showing_events"
    ADD CONSTRAINT "showing_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showing_events"
    ADD CONSTRAINT "showing_events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showing_events"
    ADD CONSTRAINT "showing_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showings"
    ADD CONSTRAINT "showings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showings"
    ADD CONSTRAINT "showings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showings"
    ADD CONSTRAINT "showings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_listings"
    ADD CONSTRAINT "user_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_listings"
    ADD CONSTRAINT "user_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tags"
    ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_rate_limit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "areas_select" ON "public"."areas" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."counties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "counties_select" ON "public"."counties" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "groups_select" ON "public"."groups" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND ("id" = ( SELECT "profiles"."group_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invites_insert" ON "public"."invites" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_user"() AND ("from_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("lower"("to_email") <> "lower"(COALESCE((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text"), ''::"text")))));



CREATE POLICY "invites_select" ON "public"."invites" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND (("from_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("lower"("to_email") = "lower"((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text"))) AND ("status" <> 'cancelled'::"public"."invite_status")))));



ALTER TABLE "public"."listing_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listing_tags_delete" ON "public"."listing_tags" FOR DELETE TO "authenticated" USING (("public"."is_active_user"() AND (EXISTS ( SELECT 1
   FROM "public"."user_listings" "ul"
  WHERE (("ul"."id" = "listing_tags"."user_listing_id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "listing_tags_insert" ON "public"."listing_tags" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_user"() AND (EXISTS ( SELECT 1
   FROM "public"."user_listings" "ul"
  WHERE (("ul"."id" = "listing_tags"."user_listing_id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (EXISTS ( SELECT 1
   FROM "public"."user_tags" "ut"
  WHERE (("ut"."id" = "listing_tags"."user_tag_id") AND ("ut"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "listing_tags_select" ON "public"."listing_tags" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND (EXISTS ( SELECT 1
   FROM "public"."user_listings" "ul"
  WHERE (("ul"."id" = "listing_tags"."user_listing_id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listings_select_matched" ON "public"."listings" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND (EXISTS ( SELECT 1
   FROM "public"."user_listings" "ul"
  WHERE (("ul"."listing_id" = "listings"."id") AND "public"."shares_group_with"("ul"."user_id"))))));



CREATE POLICY "listings_select_showings" ON "public"."listings" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND (EXISTS ( SELECT 1
   FROM "public"."showings" "s"
  WHERE (("s"."listing_id" = "listings"."id") AND (("s"."group_id" = ( SELECT "public"."my_group_id"() AS "my_group_id")) OR ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."municipalities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "municipalities_select" ON "public"."municipalities" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."is_active_user"() AND "public"."shares_group_with"("id"))));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_active_user"())) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."scrape_issues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scrape_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_params" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "search_params_delete" ON "public"."search_params" FOR DELETE TO "authenticated" USING (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "search_params_insert" ON "public"."search_params" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."search_params_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "search_params_select" ON "public"."search_params" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "search_params_update" ON "public"."search_params" FOR UPDATE TO "authenticated" USING (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."seen_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showing_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "showings_delete" ON "public"."showings" FOR DELETE TO "authenticated" USING (("public"."is_active_user"() AND (("group_id" = ( SELECT "public"."my_group_id"() AS "my_group_id")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "showings_insert" ON "public"."showings" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_user"() AND (("group_id" = ( SELECT "public"."my_group_id"() AS "my_group_id")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))) AND "public"."can_see_listing"("listing_id")));



CREATE POLICY "showings_select" ON "public"."showings" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND (("group_id" = ( SELECT "public"."my_group_id"() AS "my_group_id")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "showings_update" ON "public"."showings" FOR UPDATE TO "authenticated" USING (("public"."is_active_user"() AND (("group_id" = ( SELECT "public"."my_group_id"() AS "my_group_id")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("public"."is_active_user"() AND (("group_id" = ( SELECT "public"."my_group_id"() AS "my_group_id")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."user_listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_listings_select" ON "public"."user_listings" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND "public"."shares_group_with"("user_id")));



CREATE POLICY "user_listings_update" ON "public"."user_listings" FOR UPDATE TO "authenticated" USING (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_tags_delete" ON "public"."user_tags" FOR DELETE TO "authenticated" USING (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "user_tags_insert" ON "public"."user_tags" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "user_tags_select" ON "public"."user_tags" FOR SELECT TO "authenticated" USING (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "user_tags_update" ON "public"."user_tags" FOR UPDATE TO "authenticated" USING (("public"."is_active_user"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."invites";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."showings";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON TYPE "public"."email_frequency" FROM PUBLIC;
GRANT ALL ON TYPE "public"."email_frequency" TO "authenticated";
GRANT ALL ON TYPE "public"."email_frequency" TO "service_role";



REVOKE ALL ON TYPE "public"."invite_status" FROM PUBLIC;
GRANT ALL ON TYPE "public"."invite_status" TO "authenticated";
GRANT ALL ON TYPE "public"."invite_status" TO "service_role";



REVOKE ALL ON TYPE "public"."property_type" FROM PUBLIC;
GRANT ALL ON TYPE "public"."property_type" TO "authenticated";
GRANT ALL ON TYPE "public"."property_type" TO "service_role";



REVOKE ALL ON TYPE "public"."scrape_issue_kind" FROM PUBLIC;
GRANT ALL ON TYPE "public"."scrape_issue_kind" TO "authenticated";
GRANT ALL ON TYPE "public"."scrape_issue_kind" TO "service_role";



REVOKE ALL ON TYPE "public"."scrape_issue_status" FROM PUBLIC;
GRANT ALL ON TYPE "public"."scrape_issue_status" TO "authenticated";
GRANT ALL ON TYPE "public"."scrape_issue_status" TO "service_role";



REVOKE ALL ON TYPE "public"."scrape_run_outcome" FROM PUBLIC;
GRANT ALL ON TYPE "public"."scrape_run_outcome" TO "authenticated";
GRANT ALL ON TYPE "public"."scrape_run_outcome" TO "service_role";



REVOKE ALL ON TYPE "public"."showing_event_action" FROM PUBLIC;
GRANT ALL ON TYPE "public"."showing_event_action" TO "authenticated";
GRANT ALL ON TYPE "public"."showing_event_action" TO "service_role";











































































































































































REVOKE ALL ON FUNCTION "public"."accept_invite"("invite_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_invite"("invite_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."accept_invite"("invite_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_see_listing"("p_listing_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_see_listing"("p_listing_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."can_see_listing"("p_listing_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."cancel_invite"("invite_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_invite"("invite_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."cancel_invite"("invite_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_invite_recipient"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_invite_recipient"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_request"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_request"() TO "service_role";
GRANT ALL ON FUNCTION "public"."check_request"() TO "authenticator";



REVOKE ALL ON FUNCTION "public"."clean_stale_listings"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clean_stale_listings"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."decline_invite"("invite_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."decline_invite"("invite_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."decline_invite"("invite_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_my_account"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_my_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_my_account"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."dispatch_github_workflow"("workflow" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."dissolve_group_if_alone"("g" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dissolve_group_if_alone"("g" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."due_emails"("p_include_weekly" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."due_emails"("p_include_weekly" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_deleted_profile"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_deleted_profile"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_new_notifications"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_new_notifications"() TO "service_role";
GRANT ALL ON FUNCTION "public"."has_new_notifications"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."in_my_group"("target" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."in_my_group"("target" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."in_my_group"("target" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_active_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_active_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_active_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."leave_group"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leave_group"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_group"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."like_listing"("p_listing_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."like_listing"("p_listing_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."like_listing"("p_listing_id" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."limit_invites_per_pair"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."limit_invites_per_pair"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."limit_search_params_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."limit_search_params_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."limit_showings_per_group"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."limit_showings_per_group"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."limit_tags_per_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."limit_tags_per_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_showing_event"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_showing_event"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_listing_seen"("p_listing_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_listing_seen"("p_listing_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_listing_seen"("p_listing_id" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_notifications_seen"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_notifications_seen"() TO "service_role";
GRANT ALL ON FUNCTION "public"."mark_notifications_seen"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."match_user_listings"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."match_user_listings"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."move_personal_showings"("p_user" "uuid", "p_group" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."move_personal_showings"("p_user" "uuid", "p_group" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."my_avatar_count"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_avatar_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_avatar_count"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."my_group_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_group_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_group_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."my_group_members"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_group_members"() TO "service_role";
GRANT ALL ON FUNCTION "public"."my_group_members"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."my_new_listing_ids"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_new_listing_ids"() TO "service_role";
GRANT ALL ON FUNCTION "public"."my_new_listing_ids"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."my_pending_invites"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_pending_invites"() TO "service_role";
GRANT ALL ON FUNCTION "public"."my_pending_invites"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."my_showing_events"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_showing_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_showing_events"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."orphan_avatar_objects"("min_age" interval) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."orphan_avatar_objects"("min_age" interval) TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_old_invites"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_old_invites"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_old_scrape_runs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_old_scrape_runs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_old_showing_events"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_old_showing_events"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_old_showings"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_old_showings"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_rate_limit_counters"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_rate_limit_counters"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_removed_listings"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_removed_listings"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_search_params_log"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_search_params_log"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_group_member"("target" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_group_member"("target" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."remove_group_member"("target" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."search_params_match_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."search_params_match_trigger"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_liked_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_liked_at"() TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "service_role";
GRANT SELECT ON TABLE "public"."listings" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."shared_likes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."shared_likes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."shared_likes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."shares_group_with"("target" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."shares_group_with"("target" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."shares_group_with"("target" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_search_places"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_search_places"() TO "service_role";
























GRANT ALL ON TABLE "public"."search_params" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."search_params" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."SearchParams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."SearchParams_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."api_rate_limit" TO "service_role";



GRANT ALL ON TABLE "public"."areas" TO "service_role";
GRANT SELECT ON TABLE "public"."areas" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."areas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."areas_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."counties" TO "service_role";
GRANT SELECT ON TABLE "public"."counties" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "service_role";
GRANT SELECT ON TABLE "public"."groups" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invites" TO "service_role";
GRANT SELECT ON TABLE "public"."invites" TO "authenticated";



GRANT INSERT("from_user_id") ON TABLE "public"."invites" TO "authenticated";



GRANT INSERT("to_email") ON TABLE "public"."invites" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."invites_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invites_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."listing_tags" TO "service_role";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."listing_tags" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."listing_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."listing_tags_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."listings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."listings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."municipalities" TO "service_role";
GRANT SELECT ON TABLE "public"."municipalities" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."municipalities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."municipalities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("onboarding_completed_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("avatar_path") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("email_frequency") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."scrape_issues" TO "service_role";



GRANT ALL ON SEQUENCE "public"."scrape_issues_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."scrape_issues_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."scrape_runs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."scrape_runs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."scrape_runs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."search_params_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."search_params_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."search_params_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."seen_listings" TO "service_role";



GRANT ALL ON TABLE "public"."showing_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."showing_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."showing_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."showings" TO "service_role";
GRANT SELECT,DELETE ON TABLE "public"."showings" TO "authenticated";



GRANT INSERT("listing_id") ON TABLE "public"."showings" TO "authenticated";



GRANT INSERT("showing_date"),UPDATE("showing_date") ON TABLE "public"."showings" TO "authenticated";



GRANT INSERT("start_time"),UPDATE("start_time") ON TABLE "public"."showings" TO "authenticated";



GRANT INSERT("note"),UPDATE("note") ON TABLE "public"."showings" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."showings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."showings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_listings" TO "service_role";
GRANT SELECT ON TABLE "public"."user_listings" TO "authenticated";



GRANT UPDATE("liked") ON TABLE "public"."user_listings" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."user_listings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_listings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_tags" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_tags" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."user_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_tags_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































