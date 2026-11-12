import BackToTopButton from "@/components/back-to-top-button";
import ConnectedAccountsSettings from "@/components/settings/connected-accounts-settings";
import DeleteAccount from "@/components/settings/delete-account-settings";
import FilterSettings from "@/components/settings/filter-settings";
import ConnectAccountsSettings from "@/components/settings/invited-accounts-settings";
import ProfileSettingsForm from "@/components/settings/profile-settings-form";
import ReceivedInvitesSettings from "@/components/settings/received-invites-settings";
import SettingsMenu from "@/components/settings/settings-menu";
import TagSettings from "@/components/settings/tags-settings";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { SETTING_OPTIONS } from "@/constants/setting-options";
import { useSession } from "@/hooks/auth/useSession";
import { useBackToTop } from "@/hooks/useBackToTop";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { LayoutChangeEvent, ScrollView, View } from "react-native";

export default function SettingsScreen() {
  const { session } = useSession();
  const accounts = useConnectedAccounts(session?.user.id);

  // Reload connected accounts every time the tab is opened.
  // Catches changes Realtime cannot send, e.g. another member leaving the group.
  const { refresh } = accounts;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const { scrollRef, showBackToTop, handleScroll, scrollToTop } =
    useBackToTop();

  // Y-position for each section, saved without triggering rerender
  const sectionY = useRef<Record<string, number>>({});

  function trackSection(key: string) {
    return (e: LayoutChangeEvent) => {
      // eslint-disable-next-line react-hooks/refs -- only written in onLayout, not during render
      sectionY.current[key] = e.nativeEvent.layout.y;
    };
  }

  function scrollToSection(key: string) {
    const y = sectionY.current[key];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y, animated: true });
  }

  return (
    <View className="flex-1 px-6 bg-background">
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="bg-background"
        contentContainerClassName="pb-8"
      >
        <View className="flex-1 px-2 bg-background gap-8">
          <View className="gap-3">
            <Text variant="h1">Kontoinställningar</Text>

            <SettingsMenu title={SETTING_OPTIONS} onSelect={scrollToSection} />
          </View>

          <Separator />
          <View onLayout={trackSection("din bevakning")}>
            <FilterSettings />
          </View>

          <Separator />
          <View onLayout={trackSection("dina taggar")}>
            <TagSettings />
          </View>

          <Separator />
          <View onLayout={trackSection("kopplade konton")}>
            <ConnectedAccountsSettings accounts={accounts} />
          </View>

          <Separator />
          <View onLayout={trackSection("mottagna inbjudningar")}>
            <ReceivedInvitesSettings accounts={accounts} />
          </View>

          <Separator />
          <View onLayout={trackSection("bjud in konto")}>
            <ConnectAccountsSettings accounts={accounts} />
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
      {showBackToTop && <BackToTopButton onPress={scrollToTop} />}
    </View>
  );
}
