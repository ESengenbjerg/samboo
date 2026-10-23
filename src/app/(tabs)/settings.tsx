import ConnectedAccountsSettings from "@/components/settings/connected-accounts-settings";
import DeleteAccount from "@/components/settings/delete-account-settings";
import FilterSettings from "@/components/settings/filter-settings";
import ProfileSettingsForm from "@/components/settings/profile-settings-form";
import SettingsMenu from "@/components/settings/settings-menu";
import { Text } from "@/components/ui/text";
import { SETTING_OPTIONS } from "@/constants/setting-options";
import { useState } from "react";
import { View } from "react-native";

export default function SettingsScreen() {
  const [settingsAlternative, setSettingsAlternative] = useState("");
  return (
    <View className="flex-1 px-8 bg-background gap-8">
      <Text variant="h1">Kontoinställningar</Text>

      <SettingsMenu
        title={SETTING_OPTIONS}
        value={settingsAlternative}
        onValueCange={() => setSettingsAlternative}
      />
      <FilterSettings />
      <ConnectedAccountsSettings />
      <ProfileSettingsForm />
      <DeleteAccount />
    </View>
  );
}
