import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { resendSignUpCode, verifyEmailOtp } from "@/services/auth";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { type TextStyle, View } from "react-native";

const RESEND_CODE_INTERVAL_SECONDS = 60;

const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ["tabular-nums"] };

export function VerifyEmailForm() {
  const { countdown, restartCountdown } = useCountdown(
    RESEND_CODE_INTERVAL_SECONDS,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");

  async function onSubmit() {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await verifyEmailOtp(email, code);

      if (error?.code === "otp_expired") {
        setError("Koden är fel eller har gått ut.");
      } else if (error) {
        setError("Något gick fel, försök igen.");
      }
      
      // If succeeded navigation will automatically redirect user to next step
    } catch {
      setError("Något gick fel, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Verifiera e-post
      </Text>
      <Text className="text-center text-background">
        Fyll i koden som skickats till din mail. Glöm inte kolla i skräpposten.
      </Text>
      <View className="gap-1.5">
        <Label htmlFor="verify-code" className="text-background">
          Verifieringskod
        </Label>
        <Input
          id="verify-code"
          placeholder="000000"
          autoCapitalize="none"
          returnKeyType="send"
          keyboardType="numeric"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          onSubmitEditing={onSubmit}
          value={code}
          onChangeText={setCode}
          editable={!isLoading}
          maxLength={6}
        />
        <Button
          variant="link"
          size="sm"
          disabled={countdown > 0 || isLoading}
          onPress={async () => {
            const { error } = await resendSignUpCode(email);
            if (error) {
              setError("Kunde inte skicka koden, försök igen.");
            } else {
              restartCountdown();
            }
          }}
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

      {error && <FormError>{error}</FormError>}

      <View className="gap-6 items-center justify-center mt-6">
        <Button className="px-10" onPress={onSubmit} disabled={isLoading}>
          <Text>{!isLoading ? "Verifiera" : "Verifierar..."}</Text>
        </Button>
        <Button
          variant="link"
          onPress={() => router.dismissTo("/register")}
          disabled={isLoading}
        >
          <Text className="text-background">Tillbaka</Text>
        </Button>
      </View>
    </View>
  );
}

// Countdown for email
function useCountdown(seconds = 30) {
  const [countdown, setCountdown] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stopCountdown();
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Stop countdown and set state to 0 when countdown is finished
          stopCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopCountdown]);

  const restartCountdown = useCallback(() => {
    setCountdown(seconds);
    startInterval();
  }, [seconds, startInterval]);

  useEffect(() => {
    startInterval();
    return stopCountdown;
  }, [startInterval, stopCountdown]);

  return { countdown, restartCountdown };
}
