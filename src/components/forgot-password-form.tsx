import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import FormError from "./form-error";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const DEV_EMAIL = "test@samboo.se";

  function onSubmit() {
    setError(null);
    setIsLoading(true);

    try {
      if (email === DEV_EMAIL) {
        router.push("/reset-password");
        // TODO: Send verification email
      } else {
        setError("Det finns inget konto registrerat med denna mail.");
        return;
      }
    } catch {
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
          <Text>{!isLoading ? "Återställ lösenord" : "Återställer lösenord..."}</Text>
        </Button>
        <Button variant="link" onPress={() => router.dismissTo("/login")}>
          <Text className="text-background">Tillbaka</Text>
        </Button>
      </View>
    </View>
  );
}
