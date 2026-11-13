import BackToTopButton from "@/components/back-to-top-button";
import UpdateFilterForm from "@/components/filter/update-filter-form";
import { useBackToTop } from "@/hooks/useBackToTop";
import { ScrollView } from "react-native";

export default function EditFilterScreen() {
  const { scrollRef, showBackToTop, handleScroll, scrollToTop } =
    useBackToTop();
  return (
    <>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="bg-background"
        contentContainerClassName="pt-6 pb-8"
      >
        <UpdateFilterForm />
      </ScrollView>
      {showBackToTop && <BackToTopButton onPress={scrollToTop} />}
    </>
  );
}
