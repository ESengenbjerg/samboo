import { AuthScreen } from "@/components/auth-screen";
import { SignInForm } from "@/components/sign-in-form";

export default function LoginScreen() {
  return (
    <AuthScreen>
      <SignInForm />
    </AuthScreen>
  );
}
