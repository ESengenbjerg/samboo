import { PASSWORD_MIN_LENGTH } from "@/constants/limits";
import type { AuthError } from "@supabase/supabase-js";

// Maps Supabase Auth's errors to messages the user can act on
export function authErrorMessage(error: AuthError) {
  // Sign-up returns 500 unexpected_failure when the confirmation e-mail can't be sent, e.g. to a domain that doesn't accept mail. The code alone is too broad, so the message is checked
  if (error.message.toLowerCase().includes("sending confirmation email")) {
    return "Vi kunde inte skicka verifieringsmejlet. Kontrollera e-postadressen eller försök igen om en stund.";
  }

  switch (error.code) {
    case "email_address_invalid":
      return "Fyll i en giltig e-postadress.";
    case "weak_password":
      return `För svagt lösenord. Lösenordet måste vara minst ${PASSWORD_MIN_LENGTH} tecken.`;
    case "same_password":
      return "Välj ett annat lösenord än det du har nu.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "För många försök. Vänta en stund och försök igen.";
    // Supabase uses the same code for a wrong and an expired code
    case "otp_expired":
      return "Koden är fel eller har gått ut.";
    default:
      return "Något gick fel, försök igen.";
  }
}

// Supabase's cooldown between sends (60 s) or its hourly email limit
export function isRateLimitError(error: AuthError | null): error is AuthError {
  return (
    error?.code === "over_email_send_rate_limit" ||
    error?.code === "over_request_rate_limit"
  );
}
