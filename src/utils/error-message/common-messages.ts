export const RATE_LIMITED_MESSAGE =
  "Du har gjort för många ändringar. Vänta en stund och försök igen.";

export const NETWORK_ERROR_MESSAGE =
  "Ingen kontakt med servern. Kontrollera din uppkoppling och försök igen.";

// True when the request never reached the server, e.g. offline or flight mode.
// Supabase returns these as { error } (message "Failed to fetch" on web,
// "Network request failed" on React Native, AuthRetryableFetchError in Auth),
// or they are thrown by fetch
export function isNetworkError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string; details?: string };
  if (e.name === "AuthRetryableFetchError") return true;
  return /failed to fetch|network request failed|networkerror|load failed|fetch failed|network error/i.test(
    `${e.message ?? ""} ${e.details ?? ""}`,
  );
}

// The message for errors with no cause of their own: offline and rate limit get
// their own text, everything else gets the fallback. fallback should say what failed
export function commonErrorMessage(error: unknown, fallback: string) {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;
  if ((error as { code?: string } | null)?.code === "rate_limited") {
    return RATE_LIMITED_MESSAGE;
  }
  return fallback;
}
