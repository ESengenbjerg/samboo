# Production setup

How to run your own Samboo beyond the demo: real sign-up, e-mails, scheduled jobs, the map and a public web build. Start with the demo steps in the [README](../README.md#try-it-with-demo-data-fork-or-clone); this guide adds what the demo leaves out.

No secret values live in the repo. Each one is set in the dashboard of the service that uses it, and in your local `.env` for the scripts.

**NOTE!** Scraping may break an agency's terms of use, which can have legal consequences. In the original project, permission was obtained from each agency, specifying where, when and how we were allowed to scrape, store and share their data. The base URLs of the scraped agencies are therefore not shared. To replicate this product, ask each agency for permission, write your own files in `scripts/scraper/agencies/` and `scripts/scraper/mappers/`, then import them in `scripts/scraper/run.ts` and add them to `allAgencies`.

## Services

| Service                   | Used for                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Supabase                  | Database, Auth, storage, scheduled database jobs (pg_cron)                                                          |
| Domain registrar (Loopia) | The domain, and DNS records for the web app (Vercel) and e-mail (Resend). Loopia needs the DNS package to edit them |
| Resend                    | E-mail: sign-up and password reset codes, notification mails                                                        |
| GitHub Actions            | Scraping, e-mails and avatar cleanup on a schedule                                                                  |
| Google Cloud (Maps)       | The map on the listing page                                                                                         |
| Vercel                    | Builds and hosts the web app                                                                                        |

## 1. Supabase

1. Follow demo steps 1-3 in the README, in a project that will only hold real users.
2. Add the three Vault secrets (step 2 below) before running [supabase/setup-extras.sql](../supabase/setup-extras.sql), then run the whole file, including the three `dispatch-*` jobs at the end.
3. Run `node scripts/seed/places/seedPlaces.ts` (Node 24) for counties, municipalities and areas.
4. Under Authentication → Rate Limits, check the limits for sign-up, sign-in and e-mails per hour. See [security.md](security.md) for why they matter.

## 2. GitHub token and repository in Supabase Vault

GitHub's own schedule does not always fire, so pg_cron starts the workflows as a backup. It needs a GitHub token, and the repository and branch to start them in:

1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
2. Repository access: **only your Samboo repository**. Permissions: **Actions: read and write**. Nothing else.
3. Store it, your repository and its default branch in the SQL Editor, never in a file:

   ```sql
   select vault.create_secret('<token>', 'github_dispatch_token');
   select vault.create_secret('<owner>/<repo>', 'github_repo');
   select vault.create_secret('<default branch>', 'github_branch');
   ```

   The branch must be the default branch, the one GitHub's own schedule runs on, so both start the same code.

4. Check that it is there (shows names, not values): Integrations → Vault → Secrets, or

   ```sql
   select name, created_at, updated_at from vault.secrets;
   ```

**The token expires.** Write down the date. When it has expired, every `dispatch-*` job fails and only GitHub's own schedule is left. To replace it, create a new token and run `select vault.update_secret(id, '<new token>') from vault.secrets where name = 'github_dispatch_token';`.

## 3. Domain and e-mail

Everything about the domain, DNS, Resend and the Supabase Auth settings (SMTP, e-mail templates, redirect URLs) is in [email-setup.md](email-setup.md).

The Resend API key needs only **Sending access**. The same key is used in two places:

- as the SMTP password in Supabase (Authentication → Emails → SMTP Settings, username `resend`)
- as `RESEND_API_KEY` in GitHub Actions, for the notification e-mails

If the key is replaced, update both places, or either the sign-up codes or the notification e-mails stop.

## 4. GitHub Actions

Settings → Secrets and variables → Actions.

| Name                        | Type     | Used by                      |
| --------------------------- | -------- | ---------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`  | Secret   | all workflows                |
| `EXPO_PUBLIC_SUPABASE_KEY`  | Secret   | `ci.yml`                     |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret   | scrape, email, purge-avatars |
| `RESEND_API_KEY`            | Secret   | email                        |
| `NOTIFY_FROM`               | Variable | email (sender address)       |
| `APP_URL`                   | Variable | email (links in the mails)   |
| `BASE_PATH_*`               | Secret   | scrape (one per source)      |

**Scraping needs permission from each agency.** The original project's sources and permissions are not shared. Write your own mapper in `scripts/scraper/agencies/` and give it its own `BASE_PATH_*` secret.

## 5. Google Maps

The listing page shows a map if both map variables are set. Without them the map is hidden.

1. Create a project in Google Cloud and enable the **Maps JavaScript API**.
2. Create an API key. Restrict it to the Maps JavaScript API and to your domains (plus `localhost:8081` for development).
3. Create a **Map ID** (needed for the marker).
4. Set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` and `EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID`.
5. Set a daily quota on map loads. It cannot be set during Google's free trial.

## 6. Vercel

1. Import the repository. [vercel.json](../vercel.json) sets the build (`npx expo export --platform web`) and the output folder.
2. Set the production branch (the original project deploys from `main`).
3. Environment variables:

   | Name                              | Value                    |
   | --------------------------------- | ------------------------ |
   | `EXPO_PUBLIC_SUPABASE_URL`        | Supabase project URL     |
   | `EXPO_PUBLIC_SUPABASE_KEY`        | Supabase publishable key |
   | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps key (optional)      |
   | `EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID`  | Map ID (optional)        |

   Set them for every environment you deploy (Production, Preview). They are read at build time, so redeploy after changing them.

4. Vercel gives the app a `vercel.app` address. To use your own domain (the original project runs on its own domain), add it under Settings → Domains and the DNS records Vercel shows at your registrar.

Everything starting with `EXPO_PUBLIC_` ends up in the JavaScript sent to the browser, so it is public on purpose: the Supabase key is guarded by RLS and the Maps key by its restrictions. **`SUPABASE_SERVICE_ROLE_KEY` must never be set in Vercel or have an `EXPO_PUBLIC_` name.**

## All keys at a glance

| Key                              | Where it lives                                 | Expires                       |
| -------------------------------- | ---------------------------------------------- | ----------------------------- |
| Supabase URL and publishable key | `.env`, GitHub Actions, Vercel                 | No                            |
| Supabase service role key        | `.env`, GitHub Actions                         | No (rotate if leaked)         |
| GitHub fine-grained token        | Supabase Vault                                 | **Yes, on the date you set**  |
| Resend API key                   | `.env`, GitHub Actions, Supabase SMTP settings | No                            |
| Google Maps key and Map ID       | `.env`, Vercel                                 | Free trial ends after 90 days |
| `BASE_PATH_*`                    | `.env`, GitHub Actions                         | No                            |
