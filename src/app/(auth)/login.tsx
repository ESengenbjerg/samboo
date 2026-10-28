import { AuthScreen } from "@/components/auth/auth-screen";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function LoginScreen() {
  return (
    <AuthScreen>
      <SignInForm />
    </AuthScreen>
  );
}
