# Email delivery (sign-up codes)

Sign-up sends a 6-digit code by email. Supabase Auth creates the message and sends it through Resend over SMTP. Nothing in this setup lives in the repo: it is configured in the Loopia, Resend and Supabase dashboards. This file records what was set up and why, so it can be found again.

## How it fits together

1. The app calls `supabase.auth.signUp({ email, password })`. This creates the user in `auth.users` (unconfirmed). The `handle_new_user` trigger creates the row in `public.profiles`.
2. Supabase sends the "Confirm signup" template via custom SMTP (Resend).
3. The user enters the code in the app, which calls `supabase.auth.verifyOtp(...)`. On success the user gets a session.

The template must contain `{{ .Token }}`. Without it the user only gets a link, and the code screen has nothing to enter.

## Decisions

### Send from a subdomain of our own domain

- **Domain:** `samboo.site`, registered at Loopia. The Loopia DNS package is required to edit the DNS zone.
- **Sending domain:** `mail.samboo.site` (verified in Resend, region eu-west-1 / Ireland).
- **Sender:** `noreply@mail.samboo.site`, sender name `Samboo`.

Why:

- Without a verified domain Resend only delivers to the account owner's own address, so sign-up fails for everyone else.
- A subdomain keeps the reputation of the root domain separate from the mail traffic.
- The EU region keeps the mail processing inside the EU.

### DNS records

Added in the Loopia DNS editor, one subdomain per record, all with TTL 3600. Values come from the domain page in Resend (copy them from there).

| Type  | Name                     | Purpose                                                       |
| ----- | ------------------------ | ------------------------------------------------------------- |
| TXT   | `resend._domainkey.mail` | DKIM public key                                               |
| CNAME | `rsend.mail`             | Resend sending/SPF (value ends with a trailing dot in Loopia) |
| CNAME | `send.mail`              | Resend sending/SPF (value ends with a trailing dot in Loopia) |
| TXT   | `_dmarc`                 | `v=DMARC1; p=none;`                                           |

- SPF is covered by the two CNAME records. No separate SPF TXT or MX record is needed.
- DMARC starts at `p=none` (monitoring only). Tighten it once mail has been flowing without problems.
- Receiving is disabled in Resend (`Enable Receiving` off). We only send.
- Leave the existing `*`, `@` and `www` records in the Loopia zone alone.

### Supabase SMTP settings

Authentication → SMTP Settings (custom SMTP enabled):

- Host `smtp.resend.com`, port `465`, username `resend`.
- Password is a Resend API key with Sending access. It is stored only in Supabase (and in the local `.env` for scripts), never in the repo.

## Things to know when debugging

- If no mail arrives and Resend → Logs is empty, the message never reached Resend. Find out how far the request got: in the browser's network tab, check whether the `signUp` request was sent and what it answered, and look in Supabase → Authentication → Logs.
- `signUp` creates the user and the profile row before the email is confirmed, so failed attempts leave unconfirmed users behind.

## Limits and defaults

- **OTP expiry:** left at the Supabase default of 1 hour.
- **Supabase email rate limit:** the default for custom SMTP is low (about 30 emails/hour when this was written). Check the current value under Authentication → Rate Limits.
- **Resend free tier:** about 100 emails/day. Check Resend's current limits before launch.
