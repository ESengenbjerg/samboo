# Database design

# Info

Why the Supabase database is built the way it is. The facts live elsewhere:

| File                                                      | What                                                                                                                                                   | Updated                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| [supabase/schema.sql](../supabase/schema.sql)             | The database as it is: a `pg_dump` of the `public` schema                                                                                              | Dumped again after every database change           |
| [supabase/setup-extras.sql](../supabase/setup-extras.sql) | What the dump does not contain: the trigger on `auth.users`, the RLS event trigger, role settings, the `avatars` bucket and its policies, pg_cron jobs | By hand, when one of those changes                 |
| This file                                                 | Design decisions, and rules that span several tables or functions                                                                                      | When a decision changes                            |
| [docs/openapi.yml](openapi.yml)                           | The API the app uses                                                                                                                                   | With every change to functions, grants or policies |
| [shared/database.types.ts](../shared/database.types.ts)   | TypeScript types for every table, function and enum, generated from the database. The app and the scripts both import them                             | `npm run gen:types` after every database change    |
| [docs/removed_listings.md](removed_listings.md)           | How the scraper marks listings as removed                                                                                                              | With the scraper                                   |

New project: run `schema.sql`, then `setup-extras.sql`, then `node scripts/seed/places/seedPlaces.ts`.

Updating `schema.sql` after a database change (needs the Supabase CLI, `supabase login` once, and Docker running, since the CLI runs `pg_dump` in a container). From the repo root:

```bash
REF=$(sed -n "s|^EXPO_PUBLIC_SUPABASE_URL=['\"]\{0,1\}https://\([a-z0-9]*\)\.supabase\.co.*|\1|p" .env)
supabase db dump --remote="$REF" -f supabase/schema.sql
```

Then regenerate the TypeScript types, so `tsc` shows every place in the app and the scripts that no longer matches the database:

```bash
npm run gen:types
```

The dump keeps function bodies (including comments inside them) and `COMMENT ON` texts, but not comments written outside them. Explanations that should survive therefore go inside the function body, into a `COMMENT ON`, or into this file.

## Security model

- **RLS on every table, policies only for `authenticated`.** `anon` has no grants at all in `public`: no tables, sequences or functions, and no default privileges for objects that `postgres` creates later. The only thing left is `USAGE` on the schema, inherited from `PUBLIC` (a Postgres default). It allows looking up names but not reading or calling anything, and it is kept because Supabase's own roles (Auth, Storage, Realtime) may depend on it. Supabase's default privileges for objects created by `supabase_admin` still mention `anon`; they cannot be changed from `postgres` and do not apply to our objects. Tables that only scripts and functions use (`admins`, `scrape_issues`, `scrape_runs`, `search_params_log`, `api_rate_limit`, `seen_listings`, `showing_events`) have RLS on and no policies, so only `service_role` and security definer functions reach them.
- **`is_active_user()` is the gate.** Nearly every policy and RPC calls it: the profile must exist, be active and have a confirmed e-mail, and the JWT's `session_id` must still exist in `auth.sessions`. An already issued JWT stays valid until it expires, but once the session is revoked (signing out, or "sign out other devices" after a password reset), or the profile is deleted or deactivated, the function returns `false` and RLS blocks everything at once. The app also asks the Auth server whether its session still exists (`useVerifySession()`: at start, when the app becomes active and once a minute), so a revoked device is sent to the login screen instead of showing empty lists. `profiles.is_active` is never set by the app's users: it is a manual kill switch, set by an admin through `admin_set_user_active()`, that is checked live on every request. It exists for copyright reasons, so the listing data can be kept from someone who should not have it. Deleting that person's account is not enough, because the e-mail address becomes free and they can sign up again. With `is_active = false` the row in `auth.users` stays, so the address remains taken and blocked. It blocks that address, not the person: a different address can still sign up.
- **Narrow grants, then RLS.** Supabase's default privileges give new tables and sequences `ALL` for `authenticated` (no longer for `anon`, see above), and new functions `EXECUTE` for `authenticated` and, through Postgres itself, for `PUBLIC`. This database revokes that and grants only what the app needs. Direct writes are limited to a few columns (for example `profiles.name`, `user_listings.liked`, `showings.note`). Everything else, such as `profiles.group_id` and `user_listings.is_new`, changes only through functions. **Every new table or function must get its grants revoked and granted explicitly**, otherwise it is open to `authenticated` by default.
- **Security definer functions to avoid recursion.** A policy that reads another table with its own policy can loop (error 42P17). `can_see_listing()` (used by the `showings` insert policy) and `my_avatar_count()` (used by the storage policy) exist only to break such loops.
- **Messages in Swedish.** Functions and triggers use `raise exception` with Swedish text, so the app can show the message as is.

## Rate limits and abuse guards

| Limit                                                                    | Where                                                                             | Why                                                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 100 write requests per signed-in user per 5 minutes (HTTP 429)           | `check_request()`, run by PostgREST before every request (`pgrst.db_pre_request`) | Stops scripted abuse through the API. Reads cannot be counted: they run in a read-only transaction |
| 5 search changes per user per 24 hours                                   | `limit_search_params_changes()`                                                   | Every change re-runs matching and may widen what the scraper fetches                               |
| Max 10 municipalities per search                                         | `search_params_place_limit`                                                       | Nobody can make the scraper cover the whole country                                                |
| 20 invites per sender and recipient, 20 different recipients per 30 days | `limit_invites_per_pair()`, `check_invite_recipient()`                            | Spam protection. Cancelled and declined invites still count, so they are kept for a year           |
| 10 members per group, 50 showings per owner, 30 tags per user            | `accept_invite()`, `limit_showings_per_group()`, `limit_tags_per_user()`          | Keeps lists and queries small                                                                      |
| 5 files per avatar folder, 2 MB per file                                 | Storage policy and bucket                                                         | Upload abuse                                                                                       |
| `statement_timeout`: 3 s for `anon`, 8 s for `authenticated`             | Role settings in `setup-extras.sql`                                               | No single request can keep the database busy                                                       |

The limit triggers and functions lock first (the profile row, the group row or an advisory lock) and count after, so two simultaneous requests cannot both pass the limit.

**STABLE functions must be called with `{ get: true }`.** PostgREST runs STABLE functions in a read-only transaction. Called with POST (the `supabase.rpc` default), `check_request()` tries to write its counter and the call fails with 405 / 25006. `my_group_id()`, `my_group_members()`, `my_pending_invites()`, `my_new_listing_ids()`, `my_showing_events()`, `has_new_notifications()` and `shared_likes()` are STABLE, and so must any new STABLE function the app calls.

**Trigger order matters.** BEFORE triggers on the same table fire in alphabetical order. The names are chosen so validation runs before counting: `search_params_check_places` before `search_params_limit_changes` (an invalid search is not logged), and `invites_check_recipient` before `invites_limit_per_pair`.

## Fixed value lists (enums)

Columns with a fixed list of values are Postgres enums, not text with a check constraint:

| Type                   | Column                                                           | Values                                                       |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `property_type`        | `listings.property_type`, `search_params.property_types` (array) | `villa`, `radhus`, `lagenhet`, `fritidshus`, `tomt`, `other` |
| `invite_status`        | `invites.status`                                                 | `pending`, `accepted`, `declined`, `cancelled`               |
| `email_frequency`      | `profiles.email_frequency`                                       | `day`, `week`, `none`                                        |
| `scrape_issue_kind`    | `scrape_issues.kind`                                             | `failed`, `suspicious`                                       |
| `scrape_issue_status`  | `scrape_issues.status`                                           | `open`, `resolved`                                           |
| `scrape_run_outcome`   | `scrape_runs.outcome`                                            | `ok`, `failed`, `suspicious`, `skipped`, `error`             |
| `showing_event_action` | `showing_events.action`                                          | `created`, `updated`, `deleted`                              |

- **Why enums:** the type generator cannot read check constraints, so a text column only becomes `string`. An enum becomes a union type and a runtime list (`Constants.public.Enums`) in `shared/database.types.ts`, so the app and the scripts take the values from the database instead of keeping their own copies.
- **For the API nothing changed:** the values are the same strings in JSON. An unknown value fails with `22P02` (invalid input value for enum) instead of `23514` (check constraint).
- **Adding a value** is easy: `alter type public.<type> add value '<value>'`, then `npm run gen:types`. The new value can not be used in the same transaction that adds it. **Removing or renaming a value** is not possible: it needs a new type and a column change, like the migration that introduced the enums.
- **Changing a column's type** is blocked by everything that refers to the column: the `UPDATE OF` triggers on `search_params`, the policy `invites_select` and the partial indexes `invites_one_pending` and `scrape_issues_one_open`. They have to be dropped and recreated in the same transaction.
- **No rights for `anon`:** Postgres gives every new type to `PUBLIC`. The enum types have that revoked and `USAGE` granted to `authenticated` and `service_role`. A new enum type needs the same.
- **Not enums on purpose:** `scrape_issues.reason` and `scrape_runs.reason` (the database does not limit it, the list `F1`–`F4`, `mass_removal` belongs to the scraper's rules in `scripts/lib/types.ts`) and `search_params_log.operation` (written only by a trigger from `tg_op`, never read by code).

## Listings and matching

- **`listings` is shared data, not tied to a user.** The scraper writes it with `service_role`. A user sees a listing only through a row in `user_listings` (own or a group member's) or a showing.
- **`user_listings` is the match table.** `match_user_listings()` fills it. It runs when a search changes (trigger) and after every scrape. It also removes rows that no longer match, except rows that are liked, tagged, or for a removed listing. Those are kept so nothing the user has acted on disappears.
- **`in_search` says what belongs in the search feed.** `match_user_listings()` sets it to true for rows that match the current search and to false for kept rows that no longer match. A row created by `like_listing()` for a group member's listing starts as false. The feed (Sök bostad) shows only `in_search = true`, while the liked lists ignore it. Access is not affected: a kept row still lets the user and the group read the listing.
- **Matching rules:**
  - A search without a municipality matches nothing.
  - Areas narrow a municipality down. With areas chosen in a municipality, a listing there must have one of them (ignoring upper and lower case), and a listing without an area is hidden.
  - Unknown values (price, rooms, fee, living area) pass the filter, because agencies often leave them out.
  - New construction is shown unless the user turns it off.
- **Places are reference data.** `municipalities` (290) is the one source of truth for municipality names. The app and `validate_search_places()` read it, and `listings.municipality` has a foreign key to it. The scraper's mapping takes the spelling from the list that is seeded into the table (`scripts/seed/places/data/swedishPlaces.ts`), so a change to that list must also reach the table, or the foreign key fails the whole batch. agency1's list for search URLs (`scripts/scraper/swedishPlaces.ts`) follows the agency's site and is separate. `areas` is entered by hand, only for municipalities we can check ourselves. `listings.area` is free text from the agencies and is not the source of `areas`.
- **`is_new`** belongs to the app (the "NYTT" flag). It is cleared by `mark_listing_seen()` when the listing page opens, and by `like_listing()`. It is not used for mails, see below.
- **`seen_listings` remembers what a user has opened**, because `is_new` cannot do that alone. `is_new` lives on a `user_listings` row, and that row is missing for a group member's listing outside my search, and is deleted by `match_user_listings()` when the listing stops matching. `mark_listing_seen()` and `like_listing()` always write a row (user, listing), whether or not a `user_listings` row exists. The table is used in two places:
  - `match_user_listings()` creates a new row with `is_new = false` if the listing is already seen, so a listing does not get "NYTT" again after a search change.
  - `my_new_listing_ids()` returns what is new to me: my own rows with `is_new = true`, plus listings a group member has liked that I have no row for and have not seen. The app uses it for the flag in every list and for the group notifications.

  Only functions read and write it (RLS on, no grants to the app). Rows go away with the user or the listing (cascade). When the table was added, it was filled with all rows with `is_new = false` and with every existing group like outside the member's own search, so nobody got a flood of "new" listings.

- **Removed listings** get `removed_at` and are shown as "Hittas inte" (not found). They are deleted 10 days later by pg_cron. Listings outside every search are never checked by the scraper, so `clean_stale_listings()` handles those after 7 days without being seen. See [removed_listings.md](removed_listings.md).
- **`listings` constraints mirror the scraper's limits** (`LIMITS` in `scripts/scraper/mappers/parse.ts`). The scraper makes bad values null before the upsert, because one failing check fails the whole batch. The constraints catch a bug in a mapper.

## Groups

A group is just an id. Membership is `profiles.group_id`, and there is no membership table. A user joins only by accepting an invite (`accept_invite()`), which creates the group if the sender has none.

A user leaves a group in three ways, and all of them end in the same rule, `dissolve_group_if_alone()`:

| Way                                 | Function                                             |
| ----------------------------------- | ---------------------------------------------------- |
| I leave                             | `leave_group()`                                      |
| Someone else in my group removes me | `remove_group_member(target)`                        |
| I delete my account                 | `delete_my_account()` → trigger `on_profile_deleted` |

- **No roles.** Any member can remove any other member. This handles an invite to the wrong person who will not leave. A malicious member can do no lasting damage: the others can leave and form a new group.
- **Dissolving:** if at most 1 member remains, the group is deleted and the last member gets `group_id = null`. A group of 2 therefore ends when one removes the other.
- **The shared list** (`shared_likes()`, "Gemensam-listan") is computed from the current members' likes and is never stored. It recalculates by itself when someone joins or leaves.
- **Simultaneous changes:** `accept_invite()`, `leave_group()` and `remove_group_member()` lock the group row (`accept_invite()` also both profile rows, in id order) and check their conditions again after the lock. A double tap or two crossing accepts cannot create two groups. In rare cases two operations on crossing rows deadlock. Postgres then aborts one of them and the data stays consistent.
- **Removed users are not notified.** The app shows the missing group the next time it reads the profile.

## Showings

Showings are planned viewings, entered by hand. They are not an official booking: the real booking is made at the agency.

- **Owned by the group while the user is in one, otherwise by the user.** Exactly one of `group_id` and `user_id` is set. The database fills both in through column defaults, so the app never sends them.
- **They follow the group, not the person:**
  - A member who leaves or is removed stops seeing the group's showings and starts with none of their own.
  - When a group is dissolved, its showings go to the last member.
  - When a user joins a group, their own showings move into it (`move_personal_showings()`). On a duplicate listing the group's showing wins, and the dropped ones are returned to the app so it can tell the user.
- **One showing per listing and owner** (unique constraints). This also handles two members saving the same listing at once: the second gets error 23505.
- **The 50 limit is checked on insert only.** Moving showings into a group is an update, so nothing is lost, but the group can end up above 50.
- **Deleted 30 days after the date** by pg_cron.

## In-app notifications

The notifications page and the dot on its icon. Most notifications are not stored: they are worked out from data that already exists, and disappear when the user has handled them.

| Notification                                      | Comes from                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| Invite to me                                      | `my_pending_invites()`                                           |
| Answer to my invite                               | `invites.status` / `responded_at` (the sender reads own invites) |
| New listings in my search                         | `my_new_listing_ids()`, own part (`is_new`)                      |
| A group member has liked listings I have not seen | `my_new_listing_ids()`, group part (`seen_listings`)             |
| A showing was created, changed or deleted         | `showing_events` (a log, the only stored notification)           |

- **`showing_events` is a log, because a deleted showing leaves no trace.** The trigger `showings_log_event` writes one row per change (`created`, `updated`, `deleted`) with the member, the listing and a copy of date and time. One row per group, not per recipient: `my_showing_events()` shows a group's events to its members, never their own. It does not log personal showings (nobody else to tell), moves between owners (`accept_invite()`, `dissolve_group_if_alone()`), saves that change nothing, changes without a signed-in user (pg_cron, scripts, the SQL Editor), or showings deleted together with their group. Rows are deleted after 30 days by pg_cron, with the group, the listing, or the member who made the change (cascade).
- **One "last visit" per user, no `is_seen` per notification.** `profiles.notifications_seen_at` is set by `mark_notifications_seen()` when the page is left. `has_new_notifications()` (the dot) is true if anything in the table above happened after it, and `my_showing_events().is_unseen` uses the same time. Something older that is still unhandled, like an invite seen but not answered, does not turn the dot on again.
- **New members** see up to 30 days of the group's earlier showing events, since the time a user joined is not stored.
- **Not built:** notifications when a member leaves or is removed, showing reminders, and a stored history of every notification.

## Admins

The product owner manages the product from an admin view in the app. Who is admin lives in `admins(user_id)`, not in the JWT and not in `profiles`.

- **Only the Dashboard or `service_role` adds an admin.** The table has RLS on, no policies, and no grants for `authenticated`, so nobody can make themselves admin. A column in `profiles` would not be safe, since users may update their own profile row.
- **`is_admin()` is the gate,** checked live on every call like `is_active_user()`, so removing a row takes effect at once. It also requires `is_active_user()`, so the `is_active` kill switch applies to admins too. `authenticated` may call it, so the app can decide whether to show the admin view; it only reveals the caller's own status.
- **Security lives in the database.** Every admin function starts with an `is_admin()` check. Hiding the view in the app is only for the user's sake.
- **Admin functions:** `admin_scrape_status()` (one row per agency: latest run, latest ok run, active listings, open issues) and `admin_open_issues()` (open rows in `scrape_issues` with a plain Swedish `description`). A non-admin gets `Endast för administratörer` with code `42501`. The Swedish texts for the scraper's reasons live in `admin_open_issues()`, so a new reason in `scripts/lib/types.ts` needs a text there too (until then the raw reason is shown).
- **Scrape issues are read-only for the admin.** The product owner sees them and contacts the developer, who fixes the scraper. There is no resolve button: issues close themselves on the next clean run.
- **Blocking users:** `admin_find_user(p_email)` looks up one user by exact e-mail (case-insensitive), and `admin_set_user_active(p_user_id, p_active)` sets the `is_active` kill switch described above. The view searches instead of listing everyone, since a full list grows with every user and shows every address on screen; exact match only, so the admin cannot browse addresses. An admin cannot block themselves, since that would remove their own admin rights with no way back.
- **`admin_list_users()`** (every user with e-mail and status) is not used by the app since the search above replaced it. Kept until after the freeze.

## Account deletion

`delete_my_account()` deletes the row in `auth.users`. It is permanent, with no grace period.

- **Cascade:** the profile, admin row, search, matches, tags, seen listings, showing events the user caused, invites the user sent, and personal showings. Invites sent _to_ the user's e-mail are deleted by the function itself, since they have no foreign key.
- **Groups:** the trigger `on_profile_deleted` applies the group rule above.
- **Profile image:** a trigger cannot delete files, so the file becomes an orphan and is removed by the next avatar purge run.
- `listings` is unaffected (shared data).

## Profile images

Bucket `avatars`, **public**: anyone with an image URL can open it without signing in. The app should tell the user this. The database stores only the path (`profiles.avatar_path`, `<user id>/<name>.<ext>`), not the URL.

- **A new file name for every upload, never overwrite.** A replaced image under the same URL can be served from the CDN or app cache, and a new name avoids that without cache busting. That is why there is no UPDATE policy and `upsert` must not be used.
- **One image per user in the end.** The app deletes the previous file after saving the new path (best effort). `orphan_avatar_objects()` finds files older than 1 hour that no profile points to, and `scripts/avatars/purgeOrphanAvatars.ts` deletes them through the Storage API (workflow `purge-avatars.yml`). Files are never deleted with SQL on `storage.objects`: that leaves the file in the bucket.
- **Later: private bucket.** Because the table stores a path and not a URL, the bucket can be made private and the app can switch to signed URLs without changing the data.

## Emails

**Naming:** "email" is what is sent with Resend (`scripts/email`). "Notifications" is the inbox in the app, see [In-app notifications](#in-app-notifications).

A mail about new matches and group members' likes, sent with Resend by `scripts/email` at about 07:00 Swedish time. The database cannot send mail itself.

- **Frequency:** `profiles.email_frequency`: `day` (every morning), `week` (Friday mornings, Swedish time) or `none`.
- **Who is due:** `due_emails()` returns active users with a confirmed e-mail whose frequency fits today and who have not been mailed today (Swedish date). A second run on the same day returns nobody. Users with nothing new are left out, so an empty mail is never sent.
- **The window:** new means after `last_emailed_at` (after sign-up for a new user), but at most 8 days back, so a user who turns mails on again does not get old listings.
- **New listings use `listings.created_at`, not `user_listings.created_at`.** Changing the search re-creates match rows for old listings, which would otherwise be mailed as new. As a consequence, a listing that only starts to match later (for example after a price drop) is not mailed. Liked and removed listings are left out.
- **Partner likes:** per other group member, the listings they liked in the window (`user_listings.liked_at`) that I have not liked myself. The mail turns this into one sentence per member, so many likes never make the mail longer.
- **No double mails:** the script sets `last_emailed_at` after each successful batch and sends each batch with an idempotency key (date + user ids). This is not guaranteed: if a mail was sent but the marking failed, and the set of due users has changed by the rerun, those users can get the mail twice.
- Resend rejects a whole batch if one address is invalid. The script then sends that batch one mail at a time.

## Scheduled jobs

Cleanup runs inside the database with pg_cron, so it does not depend on GitHub Actions. The jobs are listed in `setup-extras.sql`.

The scraper, the avatar purge and the emails run as GitHub Actions. GitHub's schedule does not always fire, so pg_cron also starts each workflow through `dispatch_github_workflow()` (pg_net + the GitHub API, token in Vault). The scrape and avatar purge workflows skip themselves if they already succeeded in the last 12 hours. The email workflow has no such guard: `due_emails()` only returns users who have not been emailed today, so extra runs send nothing. Both triggers can therefore be active at once. No role may call `dispatch_github_workflow()`, not even `service_role`, because it reads a secret. The repository and branch are read from Vault too (`github_repo`, `github_branch`), so a fork sets its own values instead of editing the function. The branch must be the repository's default branch, the same one GitHub's schedule runs on, so both triggers run the same code.

## Realtime

`invites`, `profiles` and `showings` are in the `supabase_realtime` publication, so other accounts update immediately (for example, the inviter sees an accept or decline at once, and group members see each other's showings). Realtime only delivers INSERT and UPDATE events for rows the user can read under RLS.

DELETE events are not checked against RLS, because the row no longer exists. They go to every subscriber of the table and contain only the primary key (`old = { id }`). This leaks nothing beyond the id, but clients must ignore ids they do not know, or simply refetch on every event. `REPLICA IDENTITY FULL` would not help: with RLS on, `old` still contains only the primary key.

## Open points

### Known issues

- `listings.rooms` and `search_params.min_rooms`/`max_rooms` are `numeric(3,1)` (max 99.9), while the check constraints allow up to 100. A value of 100 fails with a numeric overflow instead of the check.
