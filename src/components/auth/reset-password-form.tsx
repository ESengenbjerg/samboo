import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useCountdown } from "@/hooks/useCountdown";
import {
  requestPasswordReset,
  signOutLocal,
  signOutOtherClients,
  updatePassword,
  verifyRecoveryOtp,
} from "@/services/auth";
import { usePasswordRecoveryStore } from "@/stores/password-recovery";
import { AuthError } from "@supabase/supabase-js";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { type TextInputInstance, TextStyle, View } from "react-native";

// Matches Supabase's cooldown between emails to the same address
const RESEND_CODE_INTERVAL_SECONDS = 60;

// Digits of equal width, so the text doesn't jump while counting down
const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ["tabular-nums"] };

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInputInstance>(null);
  const repeatPasswordInputRef = useRef<TextInputInstance>(null);

  const [isVerified, setIsVerified] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // Sent as a param from the forgot password screen. Needed to verify the code
  const { email } = useLocalSearchParams<{ email: string }>();

  // The code was just sent from the forgot password screen, so the countdown starts right away
  const { countdown, restartCountdown } = useCountdown(
    RESEND_CODE_INTERVAL_SECONDS,
  );

  async function onResendCode() {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await requestPasswordReset(email);

      if (error) {
        console.log("Resend reset code error:", error);
        setError("Kunde inte skicka koden, försök igen.");
        return;
      }

      restartCountdown();
    } catch (e) {
      console.log("Resend reset code error:", e);
      setError("Kunde inte skicka koden, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }

  // Leaving the screen after the code is verified but before a new password is saved (Tillbaka, swipe back, Android back) ends the recovery session.
  // Otherwise the user stays signed in with the flag set and gets stuck in (auth) at the next sign-in
  useEffect(() => {
    return () => {
      if (usePasswordRecoveryStore.getState().isRecovering) {
        signOutLocal();
      }
    };
  }, []);

  // Helper function - maps Supabase's error codes to messages
  function passwordErrorMessage(error: AuthError) {
    switch (error.code) {
      case "weak_password":
        return "För svagt lösenord. Lösenord måste vara minst 6 tecken.";
      case "same_password":
        return "Välj ett annat lösenord.";
      default:
        return "Något gick fel, försök igen.";
    }
  }

  async function onVerifyCode() {
    if (isLoading) return;
    setError(null);

    // Pasted codes may include a space
    if (!code.trim()) {
      setError("Fyll i koden från mailet.");
      return;
    }

    // Locks the button while verifying. Unlocked again in finally
    setIsLoading(true);

    try {
      // On success Supabase signs the user in and sends PASSWORD_RECOVERY -> useSession sets the recovery flag, so the user stays on this screen
      const { error } = await verifyRecoveryOtp(email, code.trim());

      if (error) {
        console.log("Verify recovery code error:", error);
        setError(
          error.code === "otp_expired"
            ? "Koden har gått ut. Tryck på Skicka igen för en ny kod."
            : "Koden stämmer inte. Försök igen.",
        );
        return;
      }

      // Only reached when the code was correct
      setIsVerified(true);
    } catch {
      setError("Något gick fel, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit() {
    if (isLoading) return;
    setError(null);

    // Protect againt "" === ""
    if (!password) {
      setError("Fyll i ett nytt lösenord.");
      return;
    }

    setIsLoading(true);

    try {
      if (password === repeatPassword) {
        const { error } = await updatePassword(password);

        if (error) {
          console.log("Update password error", error);
          setError(passwordErrorMessage(error));
          return;
        }

        // Signs out other devices, in case someone else had access to the account
        const { error: signOutError } = await signOutOtherClients();
        if (signOutError)
          console.log("Sign out other clients error:", signOutError);

        // The reset is done: the root layout now sees a normal signed-in user and sends them into the app, so no navigation is needed here
        usePasswordRecoveryStore.getState().setIsRecovering(false);
      } else {
        setError("Lösenorden matchar inte.");
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
            <Button
              variant="link"
              size="sm"
              disabled={countdown > 0 || isLoading}
              onPress={onResendCode}
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
