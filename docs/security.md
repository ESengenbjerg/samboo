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
