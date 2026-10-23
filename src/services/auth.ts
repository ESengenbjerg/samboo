import { supabase } from "@/utils/supabase";

// All functions throw an AuthError (with .code) if Supabase returns an error

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// Returns the session, which is null if the email must be verified first
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.session;
}

export async function verifyEmailCode(email: string, code: string) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  if (error) throw error;
}

export async function resendSignupCode(email: string) {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
