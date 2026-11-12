import { supabase } from "@/lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export function getSession() {
  return supabase.auth.getSession();
}

// Returns an unsubscribe function
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return () => subscription.unsubscribe();
}

// Asks the Auth server whether the stored session still exists. If it was revoked (signed out from another device, for example after a password change), supabase-js removes it and sends SIGNED_OUT to onAuthStateChange
export async function verifySessionWithServer() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase.auth.getUser();
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export function signOut() {
  return supabase.auth.signOut();
}

// Clears the session on this device only, without calling the server.
// Used after the account is deleted, when the server no longer knows the user
export function signOutLocal() {
  return supabase.auth.signOut({ scope: "local" });
}

export function verifyEmailOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: "email" });
}

// Sends a new verification code to an unconfirmed account
export function resendSignUpCode(email: string) {
  return supabase.auth.resend({ type: "signup", email });
}

// Sends a verification code to a user who has requested to reset their password
export function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email);
}

// Verifies the code. On success the user is signed in with a recovery session
export function verifyRecoveryOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: "recovery" });
}

// Sets a new password for the signed-in user
export function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

// Sign out other clients when a password is updated
export function signOutOtherClients() {
  return supabase.auth.signOut({ scope: "others" });
}

// Deletes the signed-in user permanently (no grace period). The database cascades
// to profile, search, matches, tags and sent invites
export function deleteMyAccount() {
  return supabase.rpc("delete_my_account");
}
