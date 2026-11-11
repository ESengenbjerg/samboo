import { AuthScreen } from "@/components/auth/auth-screen";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Redirect, useLocalSearchParams } from "expo-router";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  // With an email there is nothin to verify or resend to
  if (!email) return <Redirect href="/forgotten-password" />;

  return (
    <AuthScreen>
      <ResetPasswordForm />
    </AuthScreen>
  );
}
