import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useForgotPassword } from "@/hooks/useForgotPassword";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export function ForgotPasswordForm() {
  const { sendResetCode, isSending: isLoading, error } = useForgotPassword();

  const [email, setEmail] = useState("");

  async function onSubmit() {
    // Remove spaces, e.g. from autofill
    const trimmedEmail = email.trim();

    const sent = await sendResetCode(trimmedEmail);

    // Navigate only after the email is sent, so an error is shown on this screen.
    // The next screen needs the email to verify the code
    if (sent) {
      router.push({
        pathname: "/reset-password",
        params: { email: trimmedEmail },
      });
    }
  }

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Glömt lösenord?
      </Text>
      <Text className="text-background text-center">
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
          maxLength={254}
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
