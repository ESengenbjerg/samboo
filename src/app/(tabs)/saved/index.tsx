import SavedListSection from "@/components/saved/list-section";
import ScheduledShowingsSection from "@/components/saved/scheduled-showings-section";
import { useSession } from "@/hooks/useSession";
import { useRef } from "react";
import { ScrollView, type ScrollViewInstance, View } from "react-native";

export default function SavedScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const showingsY = useRef(0);

  if (!userId) return null;

  // Scrolls to the showings section, so a message at its top is not off-screen
  function scrollToShowings() {
    scrollRef.current?.scrollTo({ y: showingsY.current, animated: true });
  }

  return (
    <ScrollView
      ref={scrollRef}
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
  );
}
