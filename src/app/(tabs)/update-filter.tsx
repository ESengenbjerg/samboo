import UpdateFilterForm from "@/components/filter/update-filter-form";
import { ScrollView } from "react-native";

export default function EditFilterScreen() {
  return (
    <ScrollView className="bg-background py-6">
      <UpdateFilterForm />
    </ScrollView>
  );
}
