import SavedListSection from "@/components/saved/list-section";
import ScheduledShowingsSection from "@/components/saved/scheduled-showings-section";
import { useSession } from "@/hooks/useSession";
import { ScrollView } from "react-native";

export default function SavedScreen() {
  const { session } = useSession();
  const userId = session?.user.id;

  if (!userId) return null;

  return (
    <ScrollView
      className="bg-background"
      contentContainerClassName="px-6 pb-8 gap-8"
    >
      <SavedListSection userId={userId} />
      <ScheduledShowingsSection userId={userId} />
    </ScrollView>
  );
}
