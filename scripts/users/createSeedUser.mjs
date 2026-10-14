// This file aims to create a user

// Create a seed user via the Auth Admin API
// The on_auth_user_created triger creates the matching row in profiles

// Fetch seed user credentials
process.loadEnvFile(".env");

// Fetch DB connection
const { supabaseAdmin } = await import("../lib/supabaseAdmin.mjs");

const email = process.env.SEED_USER_EMAIL;
const password = process.env.SEED_USER_PASSWORD;
const name = "Admin";

if (!email || !password) {
  throw new Error("Missing admin email or admin password in dotenv");
}

const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // No confirmation mail needed
  user_metadata: { name }, //Read by handle_new_user() -> profiles.name
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
