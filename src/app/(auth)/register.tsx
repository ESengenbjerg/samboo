import { AuthScreen } from "@/components/auth/auth-screen";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function RegisterScreen() {
  return (
    <AuthScreen>
      <SignUpForm />
    </AuthScreen>
  );
}
