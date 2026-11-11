import ConnectAccountForm from "@/components/onboarding/connect-account-form";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";

export default function OnboardingConnectScreen() {
  return (
    <OnboardingScreen backButton step={3}>
      <ConnectAccountForm />
    </OnboardingScreen>
  );
}
