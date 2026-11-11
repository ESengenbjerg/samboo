import { CodeForm } from "@/components/auth/code-form";
import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useResetPassword } from "@/hooks/auth/useResetPassword";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { type TextInputInstance, View } from "react-native";

export function ResetPasswordForm() {
  const passwordInputRef = useRef<TextInputInstance>(null);
  const repeatPasswordInputRef = useRef<TextInputInstance>(null);

  const [isVerified, setIsVerified] = useState(false);
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
    message,
  } = useResetPassword(email);

  async function onVerifyCode(code: string) {
    // Show the password fields only when the code was correct
    if (await verifyCode(code)) setIsVerified(true);
  }

  function onSubmit() {
    // Updates DB with new password
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

          <CodeForm
            onVerify={onVerifyCode}
            onResend={resendCode}
            countdown={countdown}
            isLoading={isLoading}
            error={error}
            message={message}
          />
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

      {isVerified && error && <FormError>{error}</FormError>}

      <View
        className={
          isVerified
            ? "gap-6 items-center justify-center mt-6"
            : "gap-6 items-center"
        }
      >
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
