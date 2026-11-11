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

  const { verifyCode, resendCode, countdown, isLoading, error, message } =
    useVerifyEmail(email, source);

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Verifiera e-post
      </Text>
      <Text className="text-center text-background">
        Vi har skickat en kod till{" "}
        <Text variant="bold" className="text-background">
          {email}
        </Text>
        . Glöm inte att kolla skräpposten.
      </Text>

      <CodeForm
        onVerify={verifyCode}
        onResend={resendCode}
        countdown={countdown}
        isLoading={isLoading}
        error={error}
        message={message}
      />

      {/* Supabase sends no code to an email that already has an account, so this gives a way on */}
      {source === "register" && (
        <View className="items-center gap-1">
          <Text className="text-center text-background">
            Har du redan ett konto?
          </Text>
          <View className="flex-row gap-1 items-center justify-center">
            <Button
              variant="link"
              size="sm"
              onPress={() => router.dismissTo("/login")}
              disabled={isLoading}
            >
              <Text className="leading-4 text-background">Logga in</Text>
            </Button>
            <Text className="text-background">|</Text>
            <Button
              variant="link"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: "/forgotten-password",
                  params: { email },
                })
              }
              disabled={isLoading}
            >
              <Text className="leading-4 text-background">
                Återställ lösenord
              </Text>
            </Button>
          </View>
        </View>
      )}

      <Button
        variant="link"
        onPress={() =>
          router.dismissTo(source === "login" ? "/login" : "/register")
        }
        disabled={isLoading}
      >
        <Text className="text-background">Tillbaka</Text>
      </Button>
    </View>
  );
}
