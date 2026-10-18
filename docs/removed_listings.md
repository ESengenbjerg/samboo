# Removed listings logic

How the scraper handles removed listings, failed scrapes and suspicious scrapes.

## Purpose

The scraper marks listings that have been sold or taken down from an agency's website with `removed_at`.

A broken scrape must never make listings look removed. Therefore every run is judged per agency (see `scripts/scraper/agencies/<agency>.ts`) before anything is marked.

## Basic rules

- An active listing that the scraper does not find gets `removed_at` immediately, in the first run where it is missing. There is no delay. The listing is shown to the user as "Hittas inte" (not found) in the app.
- If a removed listing is found again, `removed_at` is set back to null and it is active for the user again.
- Removed listings are permanently deleted after 14 days (including the users' connections to the listing).
- Only active listings in the scope of the scrape are compared: the same agency, and a municipality/area and property type that match the users' searches.

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

At the end of every run, listings that have been removed for more than 14 days are deleted (the database function `purge_removed_listings`).

## Special cases

- **Skipped:** if the agency has no search URL in the current scope (for example the chosen property types do not exist there), nothing is scraped and nothing is marked as removed.
- Users see removed listings for at most 14 days, even if they no longer search for them. The matching function does not remove removed listings from the users' lists, and does not match them to new users.
- The first run after a scraper has been changed needs to be followed up manually.

## Adjusting the thresholds

All numbers are constants in the code:

- `scripts/scraper/removal.ts`: 50% for F3, and 5 listings and 50% for suspicious.
- `scripts/scraper/issues.ts`: 2 runs in a row before a failed run notifies.
