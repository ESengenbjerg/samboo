# Removed listings logic

How the scraper handles removed listings, failed scrapes and suspicious scrapes.

## Purpose

The scraper marks listings that have been sold or taken down from an agency's website with `removed_at`.

A broken scrape must never make listings look removed. Therefore every run is judged per agency (see `scripts/scraper/agencies/<agency>.ts`) before anything is marked.

## Basic rules

- An active listing that the scraper does not find gets `removed_at` immediately, in the first run where it is missing. There is no delay. The listing is shown to the user as "Hittas inte" (not found) in the app.
- If a removed listing is found again, `removed_at` is set back to null and it is active for the user again.
- Removed listings are permanently deleted after 10 days (including the users' connections to the listing).
- Only active listings in the scope of the scrape are compared: the same agency, and a municipality/area and property type that match the users' searches. Listings outside every search are handled by the database instead, see [Stale listings](#stale-listings-outside-every-search).

## Outcome of a run (per agency)

| Outcome | When | What happens |
| --- | --- | --- |
| **Success** | None of the conditions below apply | New and updated listings are saved. Listings that were not found get `removed_at`. Open backlog issues for that agency are closed. |
| **Failed** | Any of F1–F4 | `removed_at` is not touched at all. The problem is saved in the backlog. |
| **Suspicious** | Unusually many listings disappear at once | New and updated listings are saved. No listings are marked as removed. The problem is saved in the backlog and the admin is notified immediately. |

## Failed conditions

| Code | Condition | Common cause |
| --- | --- | --- |
| F1 | The search page returns an error: timeout, network error or a status that is not 2xx | Site is down, blocking, network |
| F2 | The search page loads but is not what we expect: the result counter is missing or unreadable, or fewer listing links are found than the site itself reports | Layout change, captcha, pagination |
| F3 | 50% or more of the listing pages cannot be read | Reading the listing pages is broken |
| F4 | Saving to the database fails | Database error |

### "True 0 hits" vs a broken scraper

The mockdata site always shows a result counter, also for 0 hits (`data-count="0"` and the text "Inga bostäder matchade din sökning"). If the counter exists, the page is healthy and 0 is a real answer, so the listings are marked as removed. If the counter is missing, it is an F2 failure.

Listings whose own page could not be read, but that would otherwise still be there, are not counted as removed.

## Suspicious conditions

All of these must be true:

- The run is technically approved (no F1–F4).
- At least 5 listings would be marked as removed.
- More than 50% of the agency's active listings\* in scope would be marked as removed.

\* The number of active listings is counted before new listings are saved, so new listings do not dilute the percentage.

Small scopes are not affected by the percentage. For example, if 2 of 3 listings are sold on the same day they are marked as removed, because that is fewer than 5.

| Active → removed | Result |
| --- | --- |
| 3 → 2 | Marked as removed |
| 4 → 4 | Marked as removed (fewer than 5) |
| 10 → 6 | Suspicious |
| 100 → 30 | Marked as removed |
| 100 → 60 | Suspicious |

## Backlog (table `scrape_issues`)

- Every problem is saved with agency, type (`failed` or `suspicious`), reason (F1–F4 or `mass_removal`), details and the number of runs in a row.
- There is at most one open row per agency and type. A repeated problem raises the counter instead of creating a new row.
- A row is closed automatically by the next complete run for the agency. A successful run closes both failed and suspicious rows. A suspicious run only closes open failed rows.
- If the agency gets a new suspicious run while a suspicious row is open, the counter is raised. A suspicious case that is real, for example an agency that really takes everything down, must be acknowledged manually by an admin.

## When the admin is notified

| Problem | Notification |
| --- | --- |
| Failed F1, F3, F4 | After 2 runs in a row for the same agency (a single day is noise) |
| Failed F2 | Immediately (requires a code change) |
| Suspicious | Immediately |

- The notification is sent once per open problem. It is not repeated every day.
- The notification is an error line in GitHub Actions (`::error::`) and the run ending as failed (exit code 1), which makes GitHub notify. There is no separate mail or push service at the moment.
- A single failed run does not give a notification.

## Purge

Listings that have been removed for more than 10 days are deleted by a daily pg_cron job (the database function `purge_removed_listings`, 03:15 UTC). This runs inside the database, so it does not depend on the scraper running.

Why 10 days: the purge also deletes likes, tags, notes and showings for the listing (cascade). The days give a user time to see "Hittas inte", and give a listing marked as removed by mistake time to be found again, which keeps everything. With weekly mail on Fridays, a weekly user sees "Hittas inte" at least once with up to 3 days to spare. 7 days would leave no margin.

## Stale listings (outside every search)

The scraper only visits listings in the current scope. A listing that no user searches for any more is never checked again, so it would never get `removed_at`. Such listings are kept for 7 days as a bank, so a new account or a wider search gets listings right away. After that, the daily pg_cron job `clean_stale_listings()` (03:10 UTC, before the purge) handles them:

- **Stale** means not seen for 7 days, counted from the latest `last_seen_at` of an active listing from the same agency, not from now. If the scraper stops, the agency's latest time stops too, and nothing becomes stale.
- Agencies with an open row in `scrape_issues` are skipped. F3 and suspicious runs still save what they found, so the agency's latest time moves, and without this the stale rule would remove what those guards keep.
- A stale listing that nobody has in a list (`user_listings`) or a showing is deleted directly. Nobody would notice, and there is nothing to keep.
- A stale listing that someone has liked, tagged or has a showing for gets `removed_at`, is shown as "Hittas inte", and is purged 10 days later.

### All outcomes for a listing

**Inside someone's search (the scraper visits it)**

| # | Situation | What happens |
| --- | --- | --- |
| A1 | The scraper finds it | `last_seen_at` is updated, the listing is active |
| A2 | Clean run, the listing is missing | `removed_at` right away, "Hittas inte". Deleted after 10 days, with likes, tags and showings |
| A3 | As A2, found again within 10 days | `removed_at` back to null, everything is kept |
| A4 | As A2, found again after the purge | Saved as a new listing. Old likes, tags and showings are gone |
| A5 | Suspicious run | Nothing is marked as removed. The admin is notified and must acknowledge it manually |
| A6 | Failed run (F1–F4) | Nothing is marked as removed. Logged in the backlog |
| A7 | Its page could not be read in an otherwise clean run | Not counted as removed, but `last_seen_at` is not updated. Unreadable for 7 days: stale, see B |

**Outside every search (the scraper never visits it)**

| # | Situation | What happens |
| --- | --- | --- |
| B1 | Not seen for less than 7 days | In the bank, can be matched to new accounts and wider searches |
| B2 | 7 days, nobody has it in a list or showing | Deleted directly. 7 days in total from last seen |
| B3 | 7 days, someone has liked, tagged or has a showing for it | `removed_at`, "Hittas inte", deleted after 10 days. 17 days in total |
| B4 | Someone searches the municipality again during B3, and the listing is still there | The scraper finds it and sets `removed_at` back to null. Everything is kept, as in A3 |
| B5 | Someone searches the municipality again after it was deleted, and it is still there | Saved as a new listing. Nothing is lost, nobody was connected to it |

**When the scraper does not work (the guards)**

| # | Situation | What happens |
| --- | --- | --- |
| C1 | The scraper does not run at all (e.g. a GitHub outage) | The agency's latest time stops, nothing becomes stale |
| C2 | F1, F2 or F4 (nothing is saved) | As C1 |
| C3 | F3 or a suspicious run | Some listings are saved and the latest time moves, but the agency has an open issue, so it is skipped until the issue is closed |
| C4 | No user has a search ("Nothing to scrape") | Nothing is updated, nothing is cleaned. The bank stays until someone searches again |
| C5 | The agency is outside every search, or has been removed from the scraper | Its latest time stops, so its listings stay forever. Rare, delete by hand if needed |

**The user's view**

| # | Situation | What happens |
| --- | --- | --- |
| D1 | New user or wider search | Gets listings from the bank right away (seen in the last 7 days). One may have been sold and becomes "Hittas inte" after the next scrape, as in A2 |
| D2 | Weekly user who opens the app on Fridays | Sees "Hittas inte" at least once, with up to 3 days to spare |

## Special cases

- **Skipped:** if the agency has no search URL in the current scope (for example the chosen property types do not exist there), nothing is scraped and nothing is marked as removed.
- Users see removed listings for at most 10 days, even if they no longer search for them. The matching function does not remove removed listings from the users' lists, and does not match them to new users.
- The first run after a scraper has been changed needs to be followed up manually.

## Adjusting the thresholds

All numbers are constants in the code:

- `scripts/scraper/removal.ts`: 50% for F3, and 5 listings and 50% for suspicious.
- `scripts/scraper/issues.ts`: 2 runs in a row before a failed run notifies.
- Database: 7 days for stale in `clean_stale_listings()`, 10 days before the purge in `purge_removed_listings()`. Change them with `create or replace function`, then re-dump `schema.sql`.
