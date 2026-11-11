import { supabase } from "@/lib/supabase";

// Every admin function checks is_admin() in the database. A non-admin gets HTTP 403 "Endast för administratörer". See docs/openapi.yml, tag Admin

// true if I am an active user with a row in admins. Only for showing or hiding the admin view. STABLE function: must be called with GET
export async function isAdmin() {
  const { data, error } = await supabase.rpc("is_admin", undefined, {
    get: true,
  });
  return { data: data === true, error };
}

// One row per agency: last run and its outcome, last ok run, active listings, last seen listing and open issues. STABLE function: must be called with GET
export function getScrapeStatus() {
  return supabase.rpc("admin_scrape_status", undefined, { get: true });
}

// Open scrape issues, with a Swedish description to show as is.
// STABLE function: must be called with GET
export function getOpenIssues() {
  return supabase.rpc("admin_open_issues", undefined, { get: true });
}

// Every user: name, e-mail, created, last sign-in, e-mail confirmed, is_active and is_admin. STABLE function: must be called with GET
export function getUsers() {
  return supabase.rpc("admin_list_users", undefined, { get: true });
}

// Blocks (active = false) or unblocks (active = true) a user. The error message ("Du kan inte spärra dig själv", "Användaren finns inte") is meant to be shown as is
export function setUserActive(userId: string, active: boolean) {
  return supabase.rpc("admin_set_user_active", {
    p_user_id: userId,
    p_active: active,
  });
}
