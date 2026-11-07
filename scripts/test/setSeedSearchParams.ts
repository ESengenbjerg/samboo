// This file aims to set the profiles search param
// The user fills in a form on app
// Posting -> a DB row
// The users DB row is then used to match with real estate listings on the listing table, (to give the user its matching objects)

// Set search param for the seed user (Admin)
// The user is looked up by SEED_USER_EMAIL, so createSeedUser.ts must have run first (CHECK!)
// user_id is unique in search_params, so this can be re-run safely

// Fetch credentials in dotenv
process.loadEnvFile(".env");

// Fetch DB connection
const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

const email = process.env.SEED_USER_EMAIL?.toLowerCase();

if (!email) {
  throw new Error("Missing SEED_USER_EMAIL in dotenv");
}

// The full desired state. null = no limit, [] = no choice made
const seedSearches = [
  {
    email: process.env.SEED_USER_EMAIL,
    searchParams: {
      property_types: ["villa", "radhus", "tomt"],
      municipalities: ["Partille", "Höganäs"],
      areas: [],
      min_price: null,
      max_price: null,
      min_rooms: null,
      max_rooms: null,
      max_monthly_fee: null,
      min_living_area: null,
      include_new_construction: true,
    },
  },
  {
    email: process.env.SEED_USER2_EMAIL,
    searchParams: {
      property_types: ["radhus", "lagenhet"],
      municipalities: ["Mölndal"],
      areas: [],
      min_price: null,
      max_price: 4000000,
      min_rooms: null,
      max_rooms: null,
      max_monthly_fee: null,
      min_living_area: null,
      include_new_construction: true,
    },
  },
];

// Find user's id
const { data: usersData, error: usersError } =
  await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

if (usersError) {
  console.error("Failed to list users:", usersError);
  process.exit(1);
}

for (const { email, searchParams } of seedSearches) {
  const user = usersData.users.find(
    (u) => u.email?.toLowerCase() === email?.toLowerCase(),
  );

  if (!user) {
    console.error(`No user with email ${email}`);
    process.exitCode = 1;
    continue;
  }

  // Insert (or update if user already has search params)
  const { error } = await supabaseAdmin.from("search_params").upsert(
    {
      user_id: user.id,
      ...searchParams,
    },
    { onConflict: "user_id" },
  );

  // Error
  if (error) {
    console.error("Failed to save search params:", error);
    process.exit(1);
  }
  // Success
  console.log(`Saved search params for ${email}`);
}
