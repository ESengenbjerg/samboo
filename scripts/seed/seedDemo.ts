// Demo data for a forked/cloned project: two users and 50 fake listings, so the app can be tried without e-mail (SMTP/Resend), scraping or an agency mapper. See README.md, "Test with demo data".

// What it creates (all dates are relative to when the script runs):
//   * User 1 (SEED_USER): the forker. New account, not onboarded, no search, no group.
//   * User 2 (SEED_FRIEND): onboarded, has a search (Mölndal + Partille), has liked some listings
//     (two of them "Hittas inte"), has two tags, two planned showings, and a pending group invite to user 1.
//   * 50 listings with agency = 'seed' in Mölndal, Partille and Göteborg. No images (the app shows its fallback).
//   Both users are created with a confirmed e-mail and notification_frequency 'none', so no mail is ever needed or sent.

// Every run first removes the previous demo data and then creates it again, so it doubles as a reset.
// Remove + create:
//   node scripts/seed/seedDemo.ts

// Only remove:
//   node scripts/seed/seedDemo.ts--remove

// Run this when the database has other (real) users
//   node scripts/seed/seedDemo.ts --allow-existing-users

// Safety:
//   * Demo users are marked with app_metadata.demo_seed = true. Only users with that mark are ever deleted.
//     A demo e-mail that belongs to an unmarked user stops the script.
//   * By default the script refuses to run if the database has any user without the mark (e.g. our own dev/prod), because the seed listings would show up in real users' results and mails.
//   * Only listings with agency = 'seed' are deleted. The scraper never touches that agency.
//
// Requires: schema.sql has been run and scripts/places/seedPlaces.ts has filled the municipalities.
//
// Each step lives in its own file in this folder. This file only runs them in order.

import { readConfig } from "./setup/config.ts";
import { REMOVED } from "./listings/listingRows.ts";

process.loadEnvFile(".env");
const config = readConfig();

// Imported here, after loadEnvFile: the admin client reads the keys when it is imported
const { findDemoUsersSafely } = await import("./setup/safetyCheck.ts");
const { removeDemoData } = await import("./setup/removeDemoData.ts");
const { createListings } = await import("./listings/createListings.ts");
const { createUsers } = await import("./users/createUsers.ts");
const { createFriendSearch } = await import("./friend/friendSearch.ts");
const { createFriendTags } = await import("./friend/friendTags.ts");
const { createFriendShowings } = await import("./friend/friendShowings.ts");
const { createFriendInvite } = await import("./friend/friendInvite.ts");

const now = Date.now();

// Check that it is safe to run
const demoUsers = await findDemoUsersSafely(config);

// Remove the previous demo data
await removeDemoData(demoUsers);
if (config.removeOnly) {
  process.exit(0);
}

// Listings
const idOf = await createListings(now);

// Users
const { user2 } = await createUsers(config, now);

// User 2: search, likes, seen, tags, showings, invite
const { matchedCount, liked } = await createFriendSearch(user2, idOf);
const tagCount = await createFriendTags(user2, liked, idOf);
await createFriendShowings(user2, liked, idOf, now);
await createFriendInvite(user2, config.user1.email);

console.log(
  `User 2: ${matchedCount} matches, ${liked.length + REMOVED.size} liked (${REMOVED.size} "Hittas inte"), ` +
    `${tagCount} tags, 2 showings, invite sent to user 1`,
);
console.log(`Done. Sign in with user 1 (${config.user1.email}) in the app.`);
