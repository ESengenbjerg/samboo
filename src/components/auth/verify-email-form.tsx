import { CodeForm } from "@/components/auth/code-form";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useVerifyEmail } from "@/hooks/auth/useVerifyEmail";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export function VerifyEmailForm() {
  const { email, source } = useLocalSearchParams<{
    email: string;
    source?: "login" | "register";
  }>();

  const { verifyCode, resendCode, countdown, isLoading, error } =
    useVerifyEmail(email, source);

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Verifiera e-post
      </Text>
      <Text className="text-center text-background">
        Fyll i koden som skickats till din mail. Glöm inte kolla i skräpposten.
      </Text>

      <CodeForm
        onVerify={verifyCode}
        onResend={resendCode}
        countdown={countdown}
        isLoading={isLoading}
        error={error}
      />
      <Button
        variant="link"
        onPress={() =>
          router.dismissTo(source === "login" ? "/login" : "/register")
        }
        disabled={isLoading}
      >
        <Text className="text-background">Tillbaka</Text>
      </Button>
      {/* </View> */}
    </View>
  );
}
