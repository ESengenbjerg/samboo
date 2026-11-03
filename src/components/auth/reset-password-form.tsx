import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useResetPassword } from "@/hooks/useResetPassword";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { type TextInputInstance, TextStyle, View } from "react-native";

// Digits of equal width, so the text doesn't jump while counting down
const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ["tabular-nums"] };

export function ResetPasswordForm() {
  const passwordInputRef = useRef<TextInputInstance>(null);
  const repeatPasswordInputRef = useRef<TextInputInstance>(null);

  const [isVerified, setIsVerified] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // Sent as a param from the forgot password screen. Needed to verify the code
  const { email } = useLocalSearchParams<{ email: string }>();

  const {
    verifyCode,
    resendCode,
    savePassword,
    countdown,
    isLoading,
    error,
  } = useResetPassword(email);

  async function onVerifyCode() {
    // Show the password fields only when the code was correct
    if (await verifyCode(code)) setIsVerified(true);
  }

  function onSubmit() {
    savePassword(password, repeatPassword);
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
            <Button
              variant="link"
              size="sm"
              disabled={countdown > 0 || isLoading}
              onPress={resendCode}
            >
              <Text className="text-center text-sm text-background">
                Skicka igen{" "}
                {countdown > 0 ? (
                  <Text
                    className="text-sm text-background"
                    style={TABULAR_NUMBERS_STYLE}
                  >
                    ({countdown})
                  </Text>
                ) : null}
              </Text>
            </Button>
          </View>

          <Button onPress={onVerifyCode} className="px-10" disabled={isLoading}>
            <Text>{!isLoading ? "Verifiera" : "Verifierar..."}</Text>
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
              {!isLoading ? "Återställ lösenord" : "Återställer lösenord..."}
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
