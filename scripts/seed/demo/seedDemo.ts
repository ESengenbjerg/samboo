// Demo data for a forked/cloned project: two users and 50 fake listings, so the app can be tried without e-mail, scraping or agency mappers. See README.md, "Try it with demo data".

// Every run removes the previous demo data first, so it doubles as a reset.

// Remove + create:
//   node scripts/seed/demo/seedDemo.ts

// Only remove:
//   node scripts/seed/demo/seedDemo.ts --remove

// Run even if the database has real users:
//   node scripts/seed/demo/seedDemo.ts --allow-existing-users

// Requires: schema.sql and scripts/seed/places/seedPlaces.ts.
// Each step lives in its own file in this folder; this file only runs them in order.

import { REMOVED } from "./listings/listingRows.ts";
import { readConfig } from "./setup/config.ts";

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
    `${tagCount} tags, 3 showings, invite sent to user 1`,
);
console.log(`Done. Sign in with user 1 (${config.user1.email}) in the app.`);
