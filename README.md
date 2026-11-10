# Samboo

Are you and your partner hunting for the next apartment or the house to spend the rest of your lives in? Tired of losing track of endless realtor links, and wondering what your partner actually thought of that apartment with the Danish-design kitchen? Then Samboo is for you.

- **Never miss a match.** Samboo fetches new listings from realtors daily and e-mails you the ones that match your search.
- **Decide together.** Connect with your partner or housemates. Tap the heart on a listing and your group sees it. Listings everyone likes end up in the shared list ("Gemensam lista").
- **Keep track of showings.** Register booked showings, shared with the whole group, and add notes before, during and after. Never mix up, never forget.

## Copyright

During development of this product we were limited due to copyright. We have asked for and received permissions to scrape data. These permissions included conditions saying we are not allowed to share real agency listings, and therefore unfortunately we are not allowed to let others test this product with real data.
Hence we have set up a demo for you to try the concept of our product, see "Try it with demo data" under Getting started.

## Tech stack

### Frontend

Expo app built with:

- React Native
- TypeScript
- Expo Router
- NativeWind
- React Native Reusables
- Google Maps API

### Backend

- Supabase: Postgres with RLS, RPC functions, auth, Storage (avatars), pg_cron and pg_net
- Node 24 scripts in TypeScript (run natively, no build step): scraper (Playwright), notification mails, seeding and purges
- `shared/`: constants, generated database types and union types, used by both the app and the scripts
- Resend: SMTP for Supabase Auth mails, and API for notification mails
- Domain and DNS at Loopia
- Supabase CLI + OrbStack/Docker (schema dumps and `gen:types`)

### Infrastructure and CI/CD

- **CI** (GitHub Actions) on every pull request and push to `develop` and `main`: typecheck of both the app and `scripts/`, lint, and a full web build. Outdated runs are cancelled when new commits are pushed.
- **Scheduled workflows**: daily scraping, notification mails and avatar purge.
- **Backup trigger from pg_cron**: GitHub's scheduled workflows do not always fire on time (we have seen runs start several hours late). pg_cron in Supabase therefore also starts each workflow via `workflow_dispatch`, later the same morning. A guard job makes the scrape and purge workflows skip themselves if they already succeeded in the last 12 hours. The notification mails need no guard: users already mailed today are skipped, so double runs are harmless.
- **Branches and deployment**: feature branch → pull request to `develop` → `main`. Vercel deploys the web build from `main`.

## Security

- **Row Level Security on every table.** The `anon` role has no grants at all. All access to group, listing, showing and invite data checks `is_active_user()` against the database on each request, so a deleted or deactivated account is blocked at once, even while its JWT (valid for an hour) has not yet expired. Public reference data (e.g. municipalities) is readable by any signed-in user.
- **Explicit grants only.** Supabase's default privileges are revoked. Direct writes are limited to a few columns; everything else changes through database functions.
- **Rate limits and abuse guards in the database**: write requests per user (HTTP 429), search changes, invites, group size, uploads, and statement timeouts per role. Limits lock before counting, so simultaneous requests cannot slip past them.

See [docs/database-design.md](docs/database-design.md) for the reasoning behind each decision.

## Getting started

### Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) (or Node 22 and Node 24 installed some other way)
- npm
- A [Supabase](https://supabase.com) account (Free plan is enough)

The app needs Node 22+ (`.nvmrc`). The scripts in `scripts/` need Node 24 (`scripts/.nvmrc`), because they run `.ts` files directly with `node`.

### Installation

```bash
git clone https://github.com/ESengenbjerg/samboo.git
cd samboo
nvm install 24     # needed for the scripts
nvm install        # installs and switches to Node 22 from .nvmrc (the app)
npm install
cp .env.example .env
```

Then open `.env` and fill in the values (see [the demo steps](#try-it-with-demo-data-fork-or-clone) for which ones you need).

Before running any script in `scripts/`, switch to Node 24:

```bash
nvm use 24
```

### Try it with demo data (fork or clone)

You can try the app against your own Supabase project without setting up e-mail, scraping or agency mappers. The demo seeder creates two accounts and 50 made-up listings. Both accounts will have confirmed e-mail, and therefore you may log in directly after seeding them.

The `FOR NOTIFICATIONS` and `GOOGLE MAPS` sections in `.env` can be left empty for the demo. The map is then hidden and no e-mails are sent.

1. Create a new, empty project on [supabase.com](https://supabase.com). Use a separate project for demo data, never one with real users.
2. Enable the `pg_cron` and `pg_net` extensions (Database → Extensions).
3. Run all of [supabase/schema.sql](supabase/schema.sql) in the SQL Editor.
4. Run [supabase/setup-extras.sql](supabase/setup-extras.sql) in the SQL Editor, **except the last three lines** (the `dispatch-scrape`, `dispatch-purge-avatars` and `dispatch-notify` jobs). This file is required: it creates the trigger that gives every new account a profile, the rate limit, the `avatars` bucket for profile pictures and the daily cleanup jobs. The three `dispatch-*` jobs start GitHub Actions workflows in the original repository and need a GitHub token in Vault, so they are not part of the demo. If the SQL Editor refuses the storage policies, create them under Storage → Policies instead.
5. Fill in `.env` (created under [Installation](#installation)):
   - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (publishable/anon key) and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API. The service role key is only used by the scripts and must never end up in the app.
   - `SEED_USER`, `SEED_FRIEND` and their passwords are prefilled. Change them if you like (passwords need at least 8 characters). No mail is sent to these addresses.
6. Run `nvm use 24`, then fill in Sweden's counties and municipalities, and the areas of Göteborg, Mölndal and Partille, from the project root: `node scripts/places/seedPlaces.ts`
7. Create the demo data, from the project root: `node scripts/seed/seedDemo.ts`
8. Start the app and sign in as `SEED_USER`:
   - `npx expo start --web` to run it in the browser, or
   - `npx expo start` and scan the QR code with Expo Go.

### What the demo data contains

The app itself is in Swedish. Labels from the app are quoted in Swedish below, with a translation.

- **You (`SEED_USER`, "Alex")**: a new account that has not gone through onboarding yet. You choose a name and a profile picture, connect with Robin and create your search.
- **Robin (`SEED_FRIEND`)**: already has a search (apartments, terraced houses and villas in Mölndal and Partille, max 6.5 million SEK). Robin has liked a few listings. Two of them have been removed by the agency and are shown as "Hittas inte" (not found). Robin also has two tags (categories), two planned showings, and has sent you a group invite. You will find the invite under notifications.
- **50 listings** in Mölndal, Partille and Göteborg, with different property types, prices and sizes, and some new construction. They have no images, so the app shows its fallback image. Choose one of those municipalities in your search to get matches right away.

What you can try: onboarding, profile picture, accepting or declining the invite, search results, filters and sorting, likes (like something Robin has already liked and it ends up in your shared list), tags, showings, changing your search, leaving the group and deleting your account.

Run `node scripts/seed/seedDemo.ts` again to start over. The script removes the old demo data and creates it again, with dates counted from today. `--remove` only removes the demo data. The script refuses to run if the database has users other than the demo accounts.

The daily cleanup deletes removed listings 10 days after they were removed. The two "Hittas inte" listings are created as removed 2 days ago, so they disappear about 8 days after the script ran. Run the script again to get them back.

### What does not work without your own e-mail (SMTP)

The following requires that you have set up SMTP (for example Resend) and configured Supabase Auth, see [docs/email-setup.md](docs/email-setup.md):

- signing up for a new account and verifying the e-mail address
- forgot password and password reset
- the notification mails about new listings (`scripts/notify`)

Scraping of real agency sites (`scripts/scraper`) and the scheduled GitHub Actions jobs are not part of the demo data either.

## Project structure

| Folder      | What                                                                                   | Run by                        |
| ----------- | -------------------------------------------------------------------------------------- | ----------------------------- |
| `src/`      | The app. Routes in `src/app/`, everything else (components, hooks, services) beside it | Metro (Expo)                  |
| `scripts/`  | Node scripts: scraper, notification mails, seeding, purges, `gen:types`                | Node 24, directly as `.ts`    |
| `shared/`   | Code that both the app and the scripts import. Never run on its own                    | imported by both of the above |
| `supabase/` | The database described in SQL (`schema.sql`, `setup-extras.sql`)                       | pasted into the SQL Editor    |

### Why `scripts/` and `shared/` have their own `package.json` and `tsconfig.json`

The app and the scripts are run by two different tools, so they need different settings:

|                     | App (`src/`)                                         | Scripts and `shared/`                                                                    |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Run by              | Metro and Babel, which bundle everything             | Node, which strips the types from `.ts` files itself                                     |
| Imports             | `@/components/x` or `@shared/x`, no file extension   | Relative paths with the extension: `../lib/types.ts`                                     |
| Module format       | CommonJS in the root (see below)                     | ES modules: their own `package.json` has `"type": "module"`                              |
| TypeScript settings | root `tsconfig.json` (`moduleResolution: "bundler"`) | `scripts/tsconfig.json` (`NodeNext`, `allowImportingTsExtensions`, `erasableSyntaxOnly`) |

The root `package.json` has no `"type": "module"` on purpose. The config files in the root (`babel.config.js`, `metro.config.js`, `tailwind.config.js`, `eslint.config.js`) use `require` and `module.exports`, which stop working if Node reads every `.js` file as an ES module. So the root stays CommonJS, as Expo expects, and every folder that Node runs as ES modules gets a small `package.json` of its own.

Rules for `shared/`, because both tools must be able to read it:

- No imports from outside `shared/` (Node does not understand the app's `@/` alias).
- Imports inside `shared/` use relative paths with the `.ts` extension.
- Only TypeScript that Node can strip: no `enum` and no `namespace`. Use union types and `as const` lists instead.

## Commands

```bash
npx expo start -c     # start with a cleared cache
npx expo start --web  # run the app in the browser (react-native-web)
npm run build:web     # static web export to dist/
npx expo lint         # lint
npx tsc --noEmit      # typecheck the app
npx tsc --noEmit -p scripts/tsconfig.json   # typecheck scripts/ and shared/
npm run gen:types     # regenerate shared/database.types.ts after a database change (requires Node 24 and the Supabase CLI)
```

## Documentation

- [docs/database-design.md](docs/database-design.md): why the database is built the way it is (security model, rate limits, scheduled jobs, design decisions)
- [docs/openapi.yml](docs/openapi.yml): the API the app uses (tables, RPC functions and who may call them)
- [docs/email-setup.md](docs/email-setup.md): how sign-up and notification e-mails are set up (Resend, Supabase Auth, DNS at Loopia)
- [docs/removed_listings.md](docs/removed_listings.md): how the scraper detects and marks listings that have been removed by the agency

## Authors

Maria Tedeman & Emilie Sengenbjerg

## License

MIT, see [LICENSE](LICENSE)
