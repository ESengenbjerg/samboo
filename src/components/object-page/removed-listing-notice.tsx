import { MessageCircleWarningIcon } from "lucide-react-native";
import { Linking, View } from "react-native";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

// Shown when the listing was not found in the latest search. Links to the broker
export default function RemovedListingNotice({ url }: { url: string }) {
  return (
    <>
      <View className="gap-2 rounded">
        <View className="flex-row items-center gap-2">
          <Icon as={MessageCircleWarningIcon} size={18} />
          <Text variant="bold">Objekt hittades inte</Text>
        </View>
        <Text>
          Objektet hittades inte i vår senaste sökning. Det kan bero på att det
          blivit sålt eller tagits bort från mäklaren, alternativt att något
          gick fel under sökningen.
        </Text>
        <Text>
          Besök mäklaren för att ta reda på om objektet fortfarande är
          tillgängligt.
        </Text>
        <Button
          variant="secondary"
          onPress={() => Linking.openURL(url)}
          className="max-w-40 mt-4"
        >
          <Text>Till mäklaren</Text>
        </Button>
      </View>
      <Separator />
    </>
  );
}
