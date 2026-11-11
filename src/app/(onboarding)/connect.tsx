import ConnectAccountForm from "@/components/onboarding/connect-account-form";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { useState } from "react";

export default function OnboardingConnectScreen() {
  // Hidden on the "Inbjudan skickad" screen: onboarding is already saved there
  const [inviteSent, setInviteSent] = useState(false);

  return (
    <OnboardingScreen backButton={!inviteSent} step={3}>
      <ConnectAccountForm onInviteSent={() => setInviteSent(true)} />
    </OnboardingScreen>
  );
}
