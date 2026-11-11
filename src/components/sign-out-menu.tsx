import { Icon } from "@/components/ui/icon";
import { signOut } from "@/services/auth";
import { LogOut } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Text } from "./ui/text";

// Log out icon that opens a menu with "Logga ut". Used in the header and the admin header
export default function SignOutMenu() {
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 0,
    right: 4,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable hitSlop={12} role="button" aria-label="Logga ut">
          <Icon as={LogOut} size={24} />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent insets={contentInsets} align="end">
        <DropdownMenuItem
          onPress={async () => {
            setIsLoading(true);
            const { error } = await signOut();
            if (error) setIsLoading(false);
          }}
        >
          <Text>{!isLoading ? "Logga ut" : "Loggar ut..."}</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
