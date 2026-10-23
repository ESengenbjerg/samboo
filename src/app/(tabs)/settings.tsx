import ConnectedAccountsSettings from "@/components/settings/connected-accounts-settings";
import DeleteAccount from "@/components/settings/delete-account-settings";
import FilterSettings from "@/components/settings/filter-settings";
import ProfileSettingsForm from "@/components/settings/profile-settings-form";
import SettingsMenu from "@/components/settings/settings-menu";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { SETTING_OPTIONS } from "@/constants/setting-options";
import { useRef } from "react";
import { LayoutChangeEvent, ScrollView, View } from "react-native";

export default function SettingsScreen() {
  const scrollRef = useRef<ScrollView>(null);
  // Y-position for each section, saved without triggering rerender
  const sectionY = useRef<Record<string, number>>({});

  function trackSection(key: string) {
    return (e: LayoutChangeEvent) => {
      sectionY.current[key] = e.nativeEvent.layout.y;
    };
  }

  function scrollToSection(key: string) {
    const y = sectionY.current[key];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y, animated: true });
  }

  return (
    <ScrollView ref={scrollRef}>
      <View className="flex-1 px-8 bg-background gap-8">
        <View className="gap-3">
          <Text variant="h1">Kontoinställningar</Text>

          <SettingsMenu title={SETTING_OPTIONS} onSelect={scrollToSection} />
        </View>

        <Separator />
        <View onLayout={trackSection("din bevakning")}>
          <FilterSettings />
        </View>

        <Separator />
        <View onLayout={trackSection("kopplade konton")}>
          <ConnectedAccountsSettings />
        </View>

        <Separator />
        <View onLayout={trackSection("uppdatera profil")}>
          <ProfileSettingsForm />
        </View>

        <Separator />
        <View onLayout={trackSection("radera konto")}>
          <DeleteAccount />
        </View>
      </View>
    </ScrollView>
  );
}
