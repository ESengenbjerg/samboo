// E-mail helpers shared by the app and the scripts.

// "  Anna@Mail.se " -> "anna@mail.se". The database compares lower(to_email) too, but stores what it gets
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Something, exactly one @, something, a dot, something: "a@b@c.se" and "anna@mail" fail.
// Only a first check for a clear message in the app: Supabase Auth does the full check
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

// The same address, ignoring case and spaces. false if either is missing
export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalizeEmail(a) === normalizeEmail(b);
}
