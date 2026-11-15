// Reads the command line flags and the demo accounts from .env, and checks that they are usable.
// Call after process.loadEnvFile(".env").
import { normalizeEmail } from "../../../../shared/email.ts";
import { fail } from "./helpers.ts";

export type Account = { email: string; password: string };

export type SeedConfig = {
  removeOnly: boolean;
  allowExistingUsers: boolean;
  user1: Account; // SEED_USER,
  user2: Account; // SEED_FRIEND, the friend with data
};

export function readConfig(): SeedConfig {
  const args = process.argv.slice(2);

  const user1Email = process.env.SEED_USER && normalizeEmail(process.env.SEED_USER);
  const user1Password = process.env.PASSWORD_SEED_USER;
  const user2Email = process.env.SEED_FRIEND && normalizeEmail(process.env.SEED_FRIEND);
  const user2Password = process.env.PASSWORD_FRIEND_USER;

  if (!user1Email || !user1Password || !user2Email || !user2Password) {
    fail(
      "Missing SEED_USER, PASSWORD_SEED_USER, SEED_FRIEND or PASSWORD_FRIEND_USER in .env (see .env.example)",
    );
  }
  if (user1Email === user2Email) {
    fail("SEED_USER and SEED_FRIEND must be different e-mail addresses");
  }
  if (user1Password.length < 8 || user2Password.length < 8) {
    fail(
      "PASSWORD_SEED_USER and PASSWORD_FRIEND_USER must be at least 8 characters",
    );
  }

  return {
    removeOnly: args.includes("--remove"),
    allowExistingUsers: args.includes("--allow-existing-users"),
    user1: { email: user1Email, password: user1Password },
    user2: { email: user2Email, password: user2Password },
  };
}
