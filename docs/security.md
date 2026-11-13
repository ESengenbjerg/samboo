# Security

Security decisions outside of the database. Guards inside the database (RLS, grants, rate limits per user) are explained in [database-design.md](database-design.md).

## Signed in vs not signed in

- **Signed in:** every request goes through PostgREST, where RLS, `check_request()` and the limits in [database-design.md](database-design.md#rate-limits-and-abuse-guards) apply.
- **Not signed in:** `anon` has no grants in the database, so the only open endpoints are those of Supabase Auth: sign-up, sign-in, code verification and password reset. Only Supabase Auth's built-in limits apply there: per IP, plus a total number of emails per hour (see [email-setup.md](email-setup.md#limits-and-defaults)).

## Possible improvements

- **No CAPTCHA on sign-up, sign-in and password reset.**
  A bot spreading sign-ups over many IPs can use up the email limit, so real users stop getting their codes and the sending domain's reputation suffers.

  The simplest option is to use one of the two CAPTCHA services Supabase Auth supports, hCaptcha and Cloudflare Turnstile: Supabase verifies the token itself, so no extra backend code is needed. They check whether the caller is a human instead of where the call comes from.
  - Pros: bots are stopped before any email is sent, and the per-IP limits can stay generous for users who share an IP (office wifi, mobile networks).
  - Cons: real users sometimes get a challenge, which is an accessibility concern. It adds an outside service that sign-in depends on, and more keys to set up. It raises the cost of an attack but does not stop someone who pays for CAPTCHA solving.
  - When enabled, sign-up, sign-in and password reset calls need a `captchaToken`: the test scripts that use `signInWithPassword` and the ux-tester agent need test keys. The seeders use `auth.admin.createUser` and are not affected.

## Security review (November 2026)

Backend's security boundaries were tested systematically (issue #218, complementing the flow tests in #210):

- **SQL tests** run as `authenticated` or `anon` with a JWT claim for a test user, so the same RLS and privileges apply as through the API. Each test is rolled back and has control rows showing that allowed actions succeed.
- **Scripts against the API** in `scripts/test/`: rate limit (HTTP 429), Realtime isolation between groups, and Storage rules. Plus curl calls with the publishable key and no sign-in.
- **Read-only review** of the repo and its git history, the frontend code (`src/`), the workflows, the web build, Supabase Auth settings, hosting, the e-mail provider, the Maps key and the mail DNS records.

Covered: privilege escalation, access across users and groups (showings, invites, likes, tags, profiles, searches, avatars), input limits, blocked and unconfirmed users, deleted accounts, rate limits, anonymous access, Realtime, a catalog audit (RLS on every table, no functions for `anon`/`PUBLIC`, locked `search_path`), secrets in code and build, and frontend risks: no HTML is rendered from data (all text goes through `<Text>`, so XSS has no entry point), listing links must start with `https://` in the database, and no query filters are built from input.

**No finding lets a user read or change another user's data or gain rights they should not have.** The remaining findings are judged low risk and accepted for now:

- **By design or low impact:** showings can be given a past date through the API (only the own group sees them, and they are purged after 30 days). A blocked user can still leave their group or delete their account (erasure is a GDPR right, and a block applies to the account, not the person). Group members see each other's profile row and e-mail. Realtime delete events reach other subscribers with only the row id, a Supabase limitation; the app just refetches. Reads are not rate limited, but RLS limits them to the user's own data. After an account is deleted, the avatar file is purged within about a day and the rate-limit counters within an hour ("without undue delay"). Listing avatar files without signing in returns an error instead of an empty list; no data is returned. Opening the verify-email screen from a link with `source=login` sends a code to the address in the link, which adds nothing beyond calling Supabase Auth directly and is limited by its e-mail limits. The verify-email and reset-password screens carry the e-mail address in the URL, so it can end up in browser history. The session token is kept in `localStorage`, as is standard for web apps; it could only be read through XSS.
- **Admin:** an admin can block another admin, and the unused `admin_list_users()` still returns every user's e-mail to admins. Admins sign in with a password only.
- **Database hygiene:** new objects get rights for `authenticated` by default, and one cron-only function has `search_path=public`. Neither can be reached by users; the catalog audit should be re-run before each release.
- **Operational settings, not tuned since the product is not launched with real users:** passwords need 6 characters with no character rules, and the leaked-password check requires a paid plan. A password change needs no re-authentication. E-mail codes are valid for an hour. The site sends no security headers (CSP, frame protection). Mail is sent through Resend with SPF and DKIM on the sending subdomain, but DMARC only monitors (`p=none`), the root domain has no SPF record and the DKIM key is 1024-bit.

In production we would raise the password length, require re-authentication for password changes, shorten the code lifetime, add security headers in `vercel.json`, enforce DMARC with an SPF record on the root domain, add MFA for admins and delete the avatar file together with the account.

## npm audit (production dependencies)

Reported 11 findings in 5 packages (node-forge, zod, deepmerge, glob, minimatch). All come from Expo's build tooling (@expo/cli, @expo/config); the web build deployed to Vercel was searched and none of them are included in the code that runs in the user's browser, and no secret keys are present in it. The input to these tools is our own files, so the risk is judged low. Accepted without changes during the code freeze; to be re-checked after the next Expo SDK patch. npm audit fix --force was rejected since it would downgrade Expo to SDK 52.
