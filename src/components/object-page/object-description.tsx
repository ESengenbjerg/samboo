import { Text } from "@/components/ui/text";
import type { Listing } from "@/types/listing";
import { useState } from "react";
import { Pressable, View } from "react-native";

// How many lines of the description are shown before "Visa mer"
const COLLAPSED_LINES = 5;
// Shorter descriptions fit in those lines, so they get no button
const COLLAPSIBLE_LENGTH = 250;

export default function ObjectDescription({
  description,
}: Pick<Listing, "description">) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Missing description -> nothing is shown
  if (!description) return null;

  const isCollapsible = description.length > COLLAPSIBLE_LENGTH;

  return (
    <View className="gap-2">
      <Text variant="h4">Beskrivning</Text>
      <Text numberOfLines={isExpanded ? undefined : COLLAPSED_LINES}>
        {description}
      </Text>
      {isCollapsible && (
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          className="self-start active:opacity-60"
        >
          <Text variant="bold">{isExpanded ? "Visa mindre" : "Visa mer"}</Text>
        </Pressable>
      )}
    </View>
  );
}
