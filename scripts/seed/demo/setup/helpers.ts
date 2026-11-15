// Shared constants and error helpers for the demo seed. Does not import the admin client, so it can be imported before process.loadEnvFile() has run.

export const AGENCY = "seed";
export const DAY = 24 * 60 * 60 * 1000;

// Turns a listing number (1-50, external_id) into its database id
export type IdOf = (n: number) => number;

export function fail(message: string, error?: unknown): never {
  console.error(message, error ?? "");
  process.exit(1);
}

// For reads and writes with .select(): stops the script on error, otherwise returns the data
export function check<T>(
  result: { data: T; error: unknown },
  what: string,
): NonNullable<T> {
  if (result.error || result.data == null)
    fail(`Failed to ${what}:`, result.error);
  return result.data;
}

// For writes without .select(), which return no data
export function ok(result: { error: unknown }, what: string): void {
  if (result.error) fail(`Failed to ${what}:`, result.error);
}
