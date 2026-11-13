import BackToTopButton from "@/components/back-to-top-button";
import SavedListSection from "@/components/saved/list-section";
import ScheduledShowingsSection from "@/components/saved/scheduled-showings-section";
import { useSession } from "@/hooks/auth/useSession";
import { useBackToTop } from "@/hooks/useBackToTop";
import { useRef } from "react";
import { ScrollView, View } from "react-native";

export default function SavedScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const showingsY = useRef(0);
  const { scrollRef, showBackToTop, handleScroll, scrollToTop } =
    useBackToTop();

  if (!userId) return null;

  // Scrolls to the showings section, so a message at its top is not off-screen
  function scrollToShowings() {
    scrollRef.current?.scrollTo({ y: showingsY.current, animated: true });
  }

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="bg-background"
        contentContainerClassName="px-6 pb-8 gap-8"
      >
        <SavedListSection userId={userId} />
        <View
          onLayout={(e) => {
            showingsY.current = e.nativeEvent.layout.y;
          }}
        >
          <ScheduledShowingsSection
            userId={userId}
            onScrollToFeedback={scrollToShowings}
          />
        </View>
      </ScrollView>
      {showBackToTop && <BackToTopButton onPress={scrollToTop} />}
    </View>
  );
}
