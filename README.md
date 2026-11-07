# samboo

Expo app built with Expo Router, NativeWind and React Native Reusables.

## Getting started

The app requires Node 22+ (see `.nvmrc`, run `nvm use`). The scripts in `scripts/` require Node 24 (see `scripts/.nvmrc`), because they run `.ts` files directly with `node`.

```bash
npm install
npx expo start
```

## Try it with demo data (fork or clone)

You can try the app against your own Supabase project without setting up e-mail, scraping or agency mappers. A script creates two accounts and 50 made-up listings.

1. Create a new, empty project on [supabase.com](https://supabase.com). Use a separate project for demo data, never one with real users.
2. Enable the `pg_cron` and `pg_net` extensions (Database → Extensions).
3. Run all of [supabase/schema.sql](supabase/schema.sql) in the SQL Editor.
4. Run [supabase/setup-extras.sql](supabase/setup-extras.sql) in the SQL Editor, **except the last three lines** (the `dispatch-scrape`, `dispatch-purge-avatars` and `dispatch-notify` jobs). This file is required: it creates the trigger that gives every new account a profile, the rate limit, the `avatars` bucket for profile pictures and the daily cleanup jobs. The three `dispatch-*` jobs start GitHub Actions workflows in the original repository and need a GitHub token in Vault, so they are not part of the demo. If the SQL Editor refuses the storage policies, create them under Storage → Policies instead.
5. Install the dependencies (`npm install`), then copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (publishable/anon key) and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API. The service role key is only used by the scripts and must never end up in the app.
   - `SEED_USER` and `SEED_FRIEND`: the e-mail addresses of the two demo accounts. No mail is sent to them.
   - `PASSWORD_SEED_USER` and `PASSWORD_FRIEND_USER`: choose your own passwords, at least 8 characters.
6. Fill in Sweden's counties and municipalities (Node 24): `node scripts/places/seedPlaces.ts`
7. Create the demo data (Node 24): `node scripts/seed/seedDemo.ts`
8. Start the app (`npx expo start`) and sign in as `SEED_USER`.

### What the demo data contains

The app itself is in Swedish. Labels from the app are quoted in Swedish below, with a translation.

- **You (`SEED_USER`, "Alex")**: a new account that has not gone through onboarding yet. You choose a name and a profile picture, connect with Robin and create your search.
- **Robin (`SEED_FRIEND`)**: already has a search (apartments, terraced houses and villas in Mölndal and Partille, max 6.5 million SEK). Robin has liked a few listings. Two of them have been removed by the agency and are shown as "Hittas inte" (not found). Robin also has two tags (categories), two planned showings, and has sent you a group invite. You will find the invite under notifications.
- **50 listings** in Mölndal, Partille and Göteborg, with different property types, prices and sizes, and some new construction. They have no images, so the app shows its fallback image. Choose one of those municipalities in your search to get matches right away.

What you can try: onboarding, profile picture, accepting or declining the invite, search results, filters and sorting, likes (like something Robin has already liked and it ends up in your shared list), tags, showings, changing your search, leaving the group and deleting your account.

Run `node scripts/seed/seedDemo.ts` again to start over. The script removes the old demo data and creates it again, with dates counted from today. `--remove` only removes the demo data. The script refuses to run if the database has users other than the demo accounts.

The daily cleanup deletes removed listings 14 days after they were removed. The two "Hittas inte" listings are created as removed 2 days ago, so they disappear about 12 days after the script ran. Run the script again to get them back.

### What does not work without your own e-mail (SMTP)

The following requires that you have set up SMTP (for example Resend) and configured Supabase Auth, see [docs/email-setup.md](docs/email-setup.md):

- signing up for a new account and verifying the e-mail address
- forgot password and password reset
- the notification mails about new listings (`scripts/notify`)

Scraping of real agency sites (`scripts/scraper`) and the scheduled GitHub Actions jobs are not part of the demo data either.

## Commands

```bash
npx expo start -c     # start with a cleared cache
npx expo start --web  # run the app in the browser (react-native-web)
npm run build:web     # static web export to dist/
npx expo lint         # lint
npx tsc --noEmit      # typecheck
```
