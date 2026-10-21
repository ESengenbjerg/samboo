import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import ConnectAccountForm from "@/components/onboarding/connect-account-form";

export default function OnboardingConnectScreen() {
    return (
        <OnboardingScreen>
            <ConnectAccountForm />
        </OnboardingScreen>
    )
}