import { Button, buttonVariants } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import { View } from "react-native";
import { HouseHeart } from "lucide-react-native";

export default function ButtonComponents() {
  return (
    <View className="flex-1 items-center gap-2 justify-center bg-background">
      <Text>Logga in</Text>

      <Button>
        <Text>Default default</Text>
      </Button>
      <Button variant="secondary" size="sm">
        <Text>Secondary sm</Text>
      </Button>
      <Button variant="destructive" size="lg">
        <Text>Destructive lg</Text>
      </Button>
      <Button variant="outline">
        <Text>Outline</Text>
      </Button>
      <Button variant="ghost">
        <Text>Ghost</Text>
      </Button>
      <Button variant="link">
        <Text>Link</Text>
      </Button>
      <Link
        href="/register"
        className={`${buttonVariants({ variant: "default" })} content-center`}
        asChild
      >
        <Text>Link med buttonVariant</Text>
      </Link>
      <Text className="mt-4" variant="small">Variant: link, Size: icon, OBS: aria-label</Text>
      <Button variant="link" size="icon" aria-label="Sparade objekt">
        <HouseHeart />
      </Button>
    </View>
  );
}
