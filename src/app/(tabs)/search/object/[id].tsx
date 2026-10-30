import ObjectPageScreen from "@/components/object-page/object-page";
import { useListingById } from "@/hooks/useListingById";
import { useLocalSearchParams } from "expo-router";

export default function SearchObjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listing, isLoading } = useListingById(id);

  return <ObjectPageScreen listing={listing} isLoading={isLoading} />;
}
