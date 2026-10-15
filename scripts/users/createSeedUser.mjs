// This file aims to create a user

// Create a seed user via the Auth Admin API
// The on_auth_user_created triger creates the matching row in profiles

// Fetch seed user credentials
process.loadEnvFile(".env");

// Fetch DB connection
const { supabaseAdmin } = await import("../lib/supabaseAdmin.mjs");

const seedUsers = [
  {
    email: process.env.SEED_USER_EMAIL,
    password: process.env.SEED_USER_PASSWORD,
    name: "Admin",
  },
  {
    email: process.env.SEED_USER2_EMAIL,
    password: process.env.SEED_USER2_PASSWORD,
    name: "User2",
  },
];

for (const { email, password, name } of seedUsers) {
  if (!email || !password) {
    console.error(`Missing email or password for ${name} in dotenv`);
    process.exitCode = 1;
    continue;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // No confirmation mail needed
    user_metadata: { name }, // Read by handle_new_user() -> profiles.name
  });

  if (error) {
    // Error
    if (error.code === "email_exists") {
      console.log(`User ${email} already exists`);
    } else {
      console.error("Failed to create user:", error);
      process.exitCode = 1;
    }
  } else {
    // Success
    console.log(`Created user ${data.user.id} (${email})`);
  }
}
