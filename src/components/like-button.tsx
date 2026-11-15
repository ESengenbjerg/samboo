import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLikesStore } from "@/stores/likes";
import { Heart } from "lucide-react-native";
import { Pressable } from "react-native";

type LikeButtonProps = {
  listingId: number;
  className?: string;
  size?: number;
  // Which listing the heart belongs to, so a screen reader can tell the hearts apart
  address?: string;
};

export function LikeButton({ listingId, className, size, address }: LikeButtonProps) {
  // Selects a bool, so only this heart re-renders when its related like changes
  const isLiked = useLikesStore((s) => s.likedIds.has(listingId));
  const toggleLike = useLikesStore((s) => s.toggleLike);

  return (
    <Pressable
      onPress={() => toggleLike(listingId)}
      hitSlop={8}
      role="button"
      aria-label={address ? `Spara objekt, ${address}` : "Spara objekt"}
      aria-pressed={isLiked}
      className={cn("size-9 items-center justify-center", className)}
    >
      <Icon
        as={Heart}
        size={size}
        fill={`${isLiked ? "currentColor" : "none"}`}
        className={cn(isLiked ? "text-destructive" : "text-foreground")}
      />
    </Pressable>
  );
}
