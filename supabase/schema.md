# Database schema (dev project)

A readable overview of the Supabase database. The runnable counterpart is [schema.sql](schema.sql).
Both files are documentation only and never change the database. To update them after a database change, run the queries in [SQL-queries.txt](SQL-queries.txt) in the Studio SQL Editor.

## Overview

```
auth.users ──1:1──> profiles ──N:1──> groups ──1:N──> showings ──N:1──> listings
                      │  (group_id, ON DELETE SET NULL)
                      │
                      ├──1:1──> search_params
                      ├──1:N──> user_listings ──N:1──> listings (shared, scraped data)
                      │              └──1:N──> listing_tags ──N:1──> user_tags <──N:1── profiles
                      └──1:N──> invites (from_user_id)

scrape_issues, api_rate_limit, search_params_log  (standalone, service_role only)
```

Every relation from `profiles` is `ON DELETE CASCADE`, except `group_id`, which is `SET NULL`. A group is just an id: membership is `profiles.group_id`, there is no membership table.

## Tables

| Table | Purpose | Key rules |
|---|---|---|
| `profiles` | One row per user, created by the `on_auth_user_created` trigger | `id` → `auth.users` (cascade). `group_id` → `groups` (set null). `is_active` is used by RLS. `name` is 1–100 characters. `avatar_path` (nullable) is the path of the profile image in the `avatars` bucket, `<user id>/<name>.<jpg|jpeg|png|webp>`, max 200 characters. It must start with the user's own id; it is not checked that the file exists. The app builds the URL with `getPublicUrl()`. Updatable by the user |
| `groups` | A group (only an id and a timestamp) | Removed by `dissolve_group_if_alone()` when at most 1 member remains (after leaving, removal or account deletion) |
| `invites` | Invitation to a group by email | `status` ∈ pending/accepted/declined/cancelled (cancelled = withdrawn by the sender; hidden from the recipient, kept so it still counts towards the 20 per pair limit). `responded_at` is set when the invite leaves pending. Invites are cleaned up by pg_cron (see below). `from_user_id` → `profiles` (cascade). `to_email` is free text, max 254 characters. At most one pending invite per sender and recipient (unique index) and at most 20 invites in total per pair (trigger). Both rules are per direction |
| `search_params` | The user's search profile | `user_id` is unique (at most one per user). Price and room ranges must satisfy min ≤ max. `property_types` may only contain known types. At most 10 municipalities and 20 areas per search. Optional filters (null = no limit): `min_rooms`, `max_monthly_fee`, `min_living_area`. `include_new_construction` (default true, null counts as true) hides new builds only when false |
| `listings` | Scraped listings, shared data | Unique on (`agency`, `external_id`). `property_type` ∈ villa/radhus/lagenhet/fritidshus/tomt/other. `removed_at` is set when a listing has disappeared. `monthly_fee` (apartments only), `living_area` and `is_new_construction` (default false) are filter columns. Unknown fee and area pass the match |
| `user_listings` | Matches between users and listings | Unique on (`user_id`, `listing_id`). `is_new` (default true), `liked` (default false) |
| `user_tags` | The user's own tags | Unique on (`user_id`, `tag_name`). `tag_name` is 1–100 characters |
| `listing_tags` | A tag applied to a matched listing | Unique on (`user_tag_id`, `user_listing_id`) |
| `showings` | Showings a group has planned, entered by hand (not an official booking: the real booking is made at the agency) | Owned by the group: `group_id` → `groups` (cascade), so it is deleted when the group is dissolved, but not when a member leaves or is removed. `group_id` is filled in by the database (column default `my_group_id()`), never sent by the app. `listing_id` → `listings` (cascade). Unique on (`group_id`, `listing_id`): one showing per listing and group. `showing_date` (date), `start_time` (optional), `note` (max 500 characters). At most 50 per group (`limit_showings_per_group()`). Old rows are deleted by pg_cron 30 days after the date |
| `scrape_issues` | Failures and suspicious results from the scraper | At most one open issue per (`agency`, `kind`). RLS on with no policies, so only service_role can reach it |
| `search_params_log` | Every insert/update of a user's search, written by `limit_search_params_changes()` | Max 5 changes per user per 24 hours. Rows deleted after 90 days. Cascade on profile delete. No grants and no policies: service_role only |
| `api_rate_limit` | Write requests per user and minute, used by `check_request()` | Primary key (`user_id`, `minute`). No foreign key on purpose. No grants and no policies: only the functions and service_role touch it |

Full columns, types and defaults are in [schema.sql](schema.sql).

## Access (RLS)

RLS is enabled on every table. All policies apply to the `authenticated` role, and nearly all require `is_active_user()`.

| Table | Read | Write |
|---|---|---|
| `profiles` | Own row, or anyone in my group | Update own row |
| `groups` | My own group | No direct writes (via functions) |
| `invites` | Ones I sent (all statuses, so a declined invite is visible to the sender), or addressed to my email (not cancelled) | Create own (not to my own email) |
| `search_params` | Own | Create, update, delete own |
| `user_listings` | Mine and my group members' | Update own |
| `listings` | Listings matched to me or to someone in my group, and listings my group has a showing for | None (the scraper uses service_role) |
| `user_tags` | Own | Create, update, delete own |
| `showings` | My group's | Create (the listing must be visible to me), update (date, time, note) and delete, for any member of the group |
| `listing_tags` | Own | Create and delete own (both the tag and the listing must be mine) |
| `scrape_issues` | None | None |

`anon` has no privileges at all.

### `is_active_user()`

Returns `profiles.is_active AND auth.users.email_confirmed_at IS NOT NULL` for the signed-in user, otherwise `false`. It is the gate in nearly every policy.

### Direct writes (column-level grants)

Besides the table-level grants in [schema.sql](schema.sql), `authenticated` has these column-level grants. Everything else (for example `profiles.is_active` and `profiles.group_id`) can only change through functions or service_role.

| Table | Privilege | Columns |
|---|---|---|
| `invites` | insert | `from_user_id`, `to_email` |
| `profiles` | update | `name`, `onboarding_completed_at` |
| `user_listings` | update | `is_new`, `liked` |

### Who may call the functions

`anon` can call none of them.

- **`authenticated` and service_role:** `accept_invite`, `decline_invite`, `in_my_group`, `is_active_user`, `leave_group`, `remove_group_member`, `like_listing`, `my_group_id`, `my_pending_invites`, `shared_likes`, `shares_group_with`, `delete_my_account`, `cancel_invite`.
- **`anon`, `authenticated`, service_role and `authenticator`:** `check_request` only. PostgREST runs it before every request as the requesting role, so revoking it would break every request.
- **service_role only:** `dissolve_group_if_alone`, `handle_deleted_profile`, `handle_new_user`, `limit_invites_per_pair`, `limit_search_params_changes`, `limit_showings_per_group`, `match_user_listings`, `orphan_avatar_objects`, `purge_old_invites`, `purge_old_showings`, `purge_rate_limit_counters`, `purge_removed_listings`, `purge_search_params_log`, `rls_auto_enable`, `search_params_match_trigger`.

## Functions

| Function | Kind | What it does |
|---|---|---|
| `handle_new_user()` | trigger, security definer | Creates the `profiles` row when an auth user is created. Name comes from user metadata, otherwise the part of the email before `@` |
| `is_active_user()` | security definer | See above |
| `my_group_id()` | security definer | The signed-in user's `group_id` |
| `in_my_group(uuid)`, `shares_group_with(uuid)` | security definer | Whether the target is me or in my group |
| `accept_invite(invite_id)` | RPC, security definer | Joins the inviter's group (creating it if missing) and marks the invite accepted. Requires that I am not already in a group and that my account is active. Fails with `Gruppen är full (max 10 medlemmar)` if the group already has 10 members (the group row is locked while counting). Both profile rows are locked (in id order) and the invite is read again after the lock, so a double tap or two crossing accepts cannot create two groups: the second one fails with `Inbjudan finns inte eller är inte din` or `Du är redan med i en grupp. Lämna den först.`. A pending invite from me to the inviter is set to `cancelled` |
| `cancel_invite(invite_id)` | RPC, security definer | The sender sets a pending invite to `cancelled` (e.g. wrong e-mail address). Fails with `Inbjudan finns inte eller är inte din` if it is not mine or no longer pending |
| `my_pending_invites()` | RPC, security definer | Pending invites addressed to my email, with `from_name` and `from_email` of the sender. The recipient cannot read the sender's profile directly, so the app uses this to show who invited |
| `decline_invite(invite_id)` | RPC, security definer | Marks a pending invite addressed to my email as `declined` and sets `responded_at`. Requires an active account. Fails with `Inbjudan finns inte eller är inte din` if it is not mine or no longer pending |
| `delete_my_account()` | RPC, security definer | Deletes the signed-in user from `auth.users`. Everything else follows via cascade and the `on_profile_deleted` trigger. Fails with `Not signed in` without a session |
| `handle_deleted_profile()` | trigger, security definer | After a profile is deleted: if at most 1 member remains in its group, the group is dissolved (same rule as `leave_group()`, via `dissolve_group_if_alone()`) |
| `leave_group()` | RPC, security definer | Leaves the group. Locks the group row and checks membership again, then applies the shared group rule (see "Group membership") |
| `remove_group_member(target)` | RPC, security definer | Removes another member of my group (`group_id = null`), then applies the shared group rule. Any member can remove any other member. Requires an active account. Fails with `Använd "Lämna grupp" för att lämna din egen grupp` for myself, `Du är inte med i någon grupp` if I have no group, and `Personen är inte med i din grupp` if the target is in another group or does not exist |
| `dissolve_group_if_alone(group_id)` | security definer | The shared group rule: if at most 1 member is left, all remaining members get `group_id = null` and the group is deleted. Callers lock the group row first |
| `like_listing(listing_id)` | RPC, security definer | Upserts into `user_listings` with `liked = true`. Only allowed for listings already visible to me (matched to me or to someone in my group) and for an active account |
| `shared_likes()` | RPC | **The shared list** ("Gemensam-listan"): listings that *every* member of the group has liked |
| `match_user_listings(user_id?)` | security invoker | Matches search profile(s) against `listings` (a search with no municipality and no area matches nothing), inserts new rows and deletes rows that no longer match (except liked, tagged and removed listings) |
| `limit_invites_per_pair()` | trigger, security definer | Rejects a new invite if the sender has already sent 20 invites (any status) to the same e-mail. Error: `Du har skickat för många inbjudningar till den här personen` |
| `limit_showings_per_group()` | trigger, security definer | Rejects a new showing if the group already has 50. The group row is locked while counting, so simultaneous inserts cannot go past the limit. Error: `Gruppen har redan max antal visningar (50)` |
| `search_params_match_trigger()` | trigger, security definer | Runs `match_user_listings` for the user when their search profile changes |
| `check_request()` | pre-request function, security definer | Runs before every Data API request (`pgrst.db_pre_request`). Allows a signed-in user at most 100 write requests (POST/PUT/PATCH/DELETE, including RPC) per 5 minutes and otherwise answers HTTP 429. Skips reads, `service_role` and `anon` |
| `limit_search_params_changes()` | trigger, security definer | Before insert/update of the search columns: rejects the change if the user has already made 5 in the last 24 hours (`Du har ändrat din sökning för många gånger. Försök igen senare`), otherwise logs it in `search_params_log`. service_role and the SQL Editor are skipped. Unchanged updates do not count |
| `orphan_avatar_objects(min_age)` | security definer | Lists files in the `avatars` bucket (older than `min_age`, default 1 hour) that no `profiles.avatar_path` points to. Called by `scripts/avatars/purgeOrphanAvatars.ts` (service_role), which deletes the files through the Storage API |
| `purge_rate_limit_counters()` | security definer | Deletes counters older than one hour. Run by pg_cron |
| `purge_removed_listings()` | security definer | Deletes listings that have been removed for more than 14 days. Run by pg_cron |
| `purge_old_invites()` | security definer | Deletes pending invites older than 90 days, and accepted/declined/cancelled invites one year after `responded_at`. One year because all invites count towards the 20 per pair limit. Run by pg_cron |
| `purge_old_showings()` | security definer | Deletes showings whose date passed more than 30 days ago. Run by pg_cron |
| `purge_search_params_log()` | security definer | Deletes `search_params_log` rows older than 90 days. Run by pg_cron |
| `rls_auto_enable()` | event trigger function (`ensure_rls`) | Enables RLS on new tables in `public` |

## Triggers

| Trigger | Table | When | Function |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | after insert | `handle_new_user()` |
| `invites_limit_per_pair` | `invites` | before insert | `limit_invites_per_pair()` |
| `showings_limit_per_group` | `showings` | before insert | `limit_showings_per_group()` |
| `on_profile_deleted` | `profiles` | after delete | `handle_deleted_profile()` |
| `search_params_limit_changes` | `search_params` | before insert, or update of a search column | `limit_search_params_changes()` |
| `search_params_match` | `search_params` | after insert, or update of a search column | `search_params_match_trigger()` |

## Other Supabase features

One storage bucket exists (`avatars`, see "Profile images" below). No custom schemas, Vault secrets, Realtime-published tables or Edge Functions exist. (Edge Functions live outside the database; none were found under Edge Functions in Studio.)

### Default privileges

Supabase sets default privileges so that new objects in `public` get broad grants: tables get all privileges for `anon`, `authenticated` and `service_role`, and functions get execute for `authenticated` and `service_role`. This database has narrowed the table grants (`anon` has none, `authenticated` only what is listed above) and the function grants. A replica must therefore revoke first and then grant, which [schema.sql](schema.sql) does. RLS is the second line of defence for any new table.

## pg_cron jobs

Cleanup runs inside the database and no longer depends on the scraper (GitHub Action). Times are UTC.

| Job | Schedule | Runs |
|---|---|---|
| `purge-removed-listings` | daily 03:15 | `purge_removed_listings()` |
| `purge-rate-limit-counters` | hourly, minute 5 | `purge_rate_limit_counters()` |
| `purge-old-invites` | daily 03:30 | `purge_old_invites()` |
| `purge-search-params-log` | daily 03:45 | `purge_search_params_log()` |
| `purge-old-showings` | daily 03:50 | `purge_old_showings()` |
| `purge-cron-history` | daily 04:00 | deletes `cron.job_run_details` older than 7 days |

Check results with `select * from cron.job_run_details order by start_time desc limit 20;`.

## Extensions

`pg_cron`, `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`.

## Group membership

A user leaves a group in three ways, and all of them end in the same rule, `dissolve_group_if_alone()`:

| Way | Function |
|---|---|
| I leave | `leave_group()` |
| Someone else in my group removes me | `remove_group_member(target)` |
| I delete my account | `delete_my_account()` → `on_profile_deleted` trigger |

- **No roles.** Any member can remove any other member. This covers an invite to the wrong person who will not leave. If a malicious member removes others, the others can leave and form a new group (there is no lasting damage, only an invite).
- **Dissolving:** if at most 1 member remains, the group is deleted and the last member gets `group_id = null`. A group of 2 therefore ends when one removes the other.
- **The shared list** (`shared_likes()`) and `user_listings` are not touched. The list is computed from the current members, so it recalculates by itself in all three cases.
- **Showings** belong to the group (`showings.group_id`). When a member leaves or is removed, the group's showings stay and the member stops seeing them. When the group is dissolved, its showings are deleted with it. A new member sees all of the group's showings.
- **Invites:** removal does not touch invites. The same limits as for leaving apply: at most one pending invite per sender and recipient, and at most 20 invites in total per pair (`limit_invites_per_pair()`). A removed user can be invited again.
- **Notification:** the removed user is not notified yet. There is no `notifications` table; it is a possible later issue. The app shows the missing group the next time it reads the profile.
- **Simultaneous changes:** `leave_group()`, `remove_group_member()` and `accept_invite()` lock the group row (and `accept_invite()` also the two profile rows) and check their conditions again after the lock, so they run one at a time. Two operations on crossing rows can in rare cases deadlock; Postgres then aborts one with an error and the data stays consistent.
- An inactive user (`is_active = false`) cannot remove members.

## Profile images (Storage)

Bucket `avatars`, **public**: anyone with an image URL can open it without signing in. The app should tell the user this when they upload. The file itself lives in Supabase Storage; the database only holds the path in `profiles.avatar_path`.

| Rule | Where it is enforced |
|---|---|
| At most 2 MB per file, only `image/jpeg`, `image/png`, `image/webp` (HEIC is not allowed) | The bucket (`file_size_limit`, `allowed_mime_types`) |
| Path is `<own user id>/<name>.<jpg, jpeg, png or webp>`, one folder level | Policy `avatars_insert_own` and `profiles_avatar_path_check` |
| Upload only for active users, only into the own folder, at most 5 files in the folder | `avatars_insert_own` (abuse guard) |
| Delete only own files, active users only | `avatars_delete_own` |
| Listing through the API only for own files | `avatars_select_own` |
| No overwrite: every upload gets a new name, so there is no UPDATE policy and `upsert` must not be used | No policy |

- **One image per user.** `profiles.avatar_path` points to the current image. The app deletes the previous file after saving the new path (best effort). Anything left over is removed by the purge below, so in the end only one file per user remains.
- **Why a new name per upload:** a replaced image under the same URL can be shown from the CDN or app cache. A new name avoids that without cache busting.
- **Purge:** `orphan_avatar_objects()` finds files older than 1 hour that no profile points to (replaced images, abandoned uploads, images of deleted accounts). `scripts/avatars/purgeOrphanAvatars.ts` deletes them through the Storage API, run by the GitHub workflow `purge-avatars.yml` (manual run; the schedule is commented out until the secrets exist and the workflow is on the default branch). Files are never deleted with SQL on `storage.objects`: that leaves the file in the bucket.
- **Delay:** after an account deletion the image can remain until the next purge run, i.e. up to a day once scheduled.
- **Later: private bucket.** Because the table stores a path and not a URL, the bucket can be made private and the app can fetch signed URLs instead, without changing the data.

## What happens when a user deletes their account

The app calls `delete_my_account()`, which deletes the row in `auth.users`. This is permanent, with no grace period. Then:

- **Cascade:** `profiles` → `search_params`, `user_listings` (→ `listing_tags`), `user_tags`, and `invites` the user sent. Sessions and identities in `auth` go with the user.
- **Groups:** the `on_profile_deleted` trigger applies the shared group rule (see "Group membership"). With at most 1 left, the group is dissolved. With 2 or more left, the group stays and the user just disappears from it.
- **The shared list** (`shared_likes()`) is computed from the members' likes, so it recalculates on its own. The deleted user's likes disappear with their `user_listings`.
- **Left behind:** `invites` sent *to* the user's email (`to_email`). Known gap, to be handled in a later GDPR issue.
- **Profile image:** the file in the `avatars` bucket is not removed by the deletion (a trigger cannot delete files). It becomes an orphan and is removed by `purgeOrphanAvatars.ts` (see "Profile images").
- `listings` is unaffected (shared data).
- An already-issued JWT stays valid until it expires, but `is_active_user()` returns `false` once the profile is gone, so RLS blocks everything.

## Observations to follow up

- `invites.to_email` for deleted users is not cleaned up (GDPR, later issue).
- The constraint names on `search_params` are `SearchParams_*` (from an earlier table name).
- `profiles.is_active` is read in only three places: `is_active_user()`, `handle_new_user()` (the insert) and `my_pending_invites()`. The policies call the function `is_active_user()`, not the column, so removing the column means rewriting those three functions and not the policies. It is never set to `false` by the app; it works as a manual kill switch that is checked live on every request.
- The scraper's `PropertyType` in `scripts/lib/types.ts` lacks `fritidshus`, which the database allows.
