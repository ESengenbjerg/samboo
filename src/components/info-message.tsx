import { Text } from "@/components/ui/text";
import { X } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";

type InfoMessageProps = {
  children: string;
  onDismiss: () => void;
};

// Message that stays until the user closes it
export default function InfoMessage({ children, onDismiss }: InfoMessageProps) {
  return (
    <View className="flex-row items-center justify-between gap-2 bg-muted rounded-sm min-h-10 pl-4 pr-1 py-1">
      <Text className="flex-1">{children}</Text>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Stäng meddelande"
        onPress={onDismiss}
      >
        <Icon as={X} />
      </Button>
    </View>
  );
}
