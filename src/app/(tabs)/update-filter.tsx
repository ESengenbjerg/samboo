import UpdateFilterForm from "@/components/filter/update-filter-form";
import { ScrollView } from "react-native";

export default function EditFilterScreen() {
  return (
    <ScrollView
      className="bg-background"
      contentContainerClassName="pt-6 pb-8"
    >
      <UpdateFilterForm />
    </ScrollView>
  );
}
