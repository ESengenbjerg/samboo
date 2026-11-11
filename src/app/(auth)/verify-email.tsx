import { AuthScreen } from "@/components/auth/auth-screen";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { Redirect, useLocalSearchParams } from "expo-router";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  // Without an email there is nothing to verify or resend to
  if (!email) return <Redirect href="/login" />;

  return (
    <AuthScreen>
      <VerifyEmailForm />
    </AuthScreen>
  );
}
