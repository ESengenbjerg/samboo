import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import FormError from "./form-error";

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);
  const repeatPasswordInputRef = useRef<TextInput>(null);

  const [isVerified, setIsVerified] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // TODO: Remove, verify the code with the auth provider instead
  const DEV_CODE = "123456";

  function onVerifyCode() {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      code === DEV_CODE ? setIsVerified(true) : setError("Koden stämmer inte.");
    } catch {
      setError("Något gick fel, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit() {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      if (password === repeatPassword) {
        // TODO: Set new password with the auth provider
        router.dismissTo("/login");
      } else {
        setError("Lösenorden matchar inte");
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
        Återställ lösenord
      </Text>
      {!isVerified && (
        <>
          <Text className="text-center text-background">
            Fyll i koden du fått i mailet och välj sedan ett nytt lösenord.
          </Text>
          <View className="gap-1.5">
            <Label htmlFor="reset-code" className="text-background">
              Verifieringskod
            </Label>
            <Input
              id="reset-code"
              placeholder="*****"
              autoCapitalize="none"
              returnKeyType="send"
              keyboardType="numeric"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              onSubmitEditing={onVerifyCode}
              value={code}
              onChangeText={setCode}
              editable={!isLoading}
            />
          </View>

          <Button onPress={onVerifyCode} className="px-10" disabled={isLoading}>
            <Text>
              {!isLoading ? "Verifiera" : "Laddar..." }
            </Text>
          </Button>
        </>
      )}

      {isVerified && (
        <>
          <View className="gap-1.5">
            <Label htmlFor="reset-password" className="text-background">
              Nytt lösenord
            </Label>
            <Input
              ref={passwordInputRef}
              id="reset-password"
              placeholder="*****"
              secureTextEntry
              returnKeyType="next"
              value={password}
              onChangeText={setPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!isLoading}
              autoFocus
            />
          </View>

          <View className="gap-1.5">
            <Label htmlFor="reset-repeat-password" className="text-background">
              Upprepa lösenord
            </Label>
            <Input
              ref={repeatPasswordInputRef}
              id="reset-repeat-password"
              placeholder="*****"
              secureTextEntry
              returnKeyType="send"
              value={repeatPassword}
              onChangeText={setRepeatPassword}
              onSubmitEditing={onSubmit}
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!isLoading}
            />
          </View>
        </>
      )}

      {error && <FormError>{error}</FormError>}

      <View className="gap-6 items-center justify-center mt-6">
        {isVerified && (
          <Button className="px-10" onPress={onSubmit} disabled={isLoading}>
            <Text>
              {!isLoading ? "Återställ lösenord" : "Laddar..." }
            </Text>
          </Button>
        )}
        <Button variant="link" onPress={() => router.dismissTo("/login")}>
          <Text className="text-background">Tillbaka</Text>
        </Button>
      </View>
    </View>
  );
}
