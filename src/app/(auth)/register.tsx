import { AuthScreen } from "@/components/auth-screen";
import { SignUpForm } from "@/components/sign-up-form";

export default function RegisterScreen() {
  return (
    <AuthScreen>
      <SignUpForm />
    </AuthScreen>
  );
}
