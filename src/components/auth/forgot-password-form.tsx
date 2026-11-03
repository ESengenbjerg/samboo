import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { requestPasswordReset } from "@/services/auth";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");

  async function onSubmit() {
    // The keyboard's submit can run this while sending. A second request would hit Supabase's cooldown and trigger an error after the user has moved on
    if (isLoading) return;
    setError(null);

    // Remove spaces
    const trimmedEmail = email.trim();

    // Something, @, something, dot, something. Supabase does the full check
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Fyll i en giltig e-postadress.");
      return;
    }

    setIsLoading(true);

    try {
      // Supabase answers the same whether the account exists or not, so the form can't be used to find out who has an account.
      // Errors are returned in { error }, not thrown, so they are checked below
      const { error } = await requestPasswordReset(trimmedEmail);

      if (error) {
        console.log("Reset password error:", error);
        setError(
          error.code === "over_email_send_rate_limit"
            ? "För många försök. Vänta en stund och försök igen."
            : "Något gick fel, försök igen.",
        );
        return;
      }

      // Navigate only after the email is sent, so an error is shown on this screen.
      // The next screen needs the email to verify the code
      router.push({
        pathname: "/reset-password",
        params: { email: trimmedEmail },
      });
    } catch (e) {
      // Unexpected errors, e.g. the network request failing completely
      console.log("Reset password error:", e);
      setError("Något gick fel, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Glömt lösenord?
      </Text>
      <Text className="text-background">
        Fyll i din e-postadress så skickar vi en återställningskod.
      </Text>

      <View className="gap-1.5">
        <Label htmlFor="forgot-email" className="text-background">
          E-post
        </Label>
        <Input
          id="forgot-email"
          placeholder="m@example.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          returnKeyType="send"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={onSubmit}
          editable={!isLoading}
        />
      </View>

      {error && <FormError>{error}</FormError>}

      <View className="gap-6 items-center justify-center mt-6">
        <Button className="px-10" onPress={onSubmit} disabled={isLoading}>
          <Text>
            {!isLoading ? "Återställ lösenord" : "Återställer lösenord..."}
          </Text>
        </Button>
        <Button variant="link" onPress={() => router.dismissTo("/login")}>
          <Text className="text-background">Tillbaka</Text>
        </Button>
      </View>
    </View>
  );
}
