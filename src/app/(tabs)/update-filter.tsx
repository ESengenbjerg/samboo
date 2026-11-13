import BackToTopButton from "@/components/back-to-top-button";
import UpdateFilterForm from "@/components/filter/update-filter-form";
import { useBackToTop } from "@/hooks/ui/useBackToTop";
import { useTabBarInset } from "@/hooks/ui/useTabBarInset";
import { ScrollView } from "react-native";

export default function EditFilterScreen() {
  const { scrollRef, showBackToTop, handleScroll, scrollToTop } =
    useBackToTop();
  const tabBarInset = useTabBarInset();
  return (
    <>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="bg-background"
        contentContainerClassName="pt-6"
        contentContainerStyle={{ paddingBottom: tabBarInset + 16 }}
      >
        <UpdateFilterForm />
      </ScrollView>
      {showBackToTop && <BackToTopButton onPress={scrollToTop} />}
    </>
  );
}
