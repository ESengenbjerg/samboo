import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";

export default function OnboardingProfileScreen() {
    return (
        <OnboardingScreen>

        <View className="flex-1 items-center justify-center">
            <Text>Skapa profil</Text>
        </View>

        </OnboardingScreen>
    )
}