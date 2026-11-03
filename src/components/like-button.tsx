import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLikesStore } from "@/stores/likes";
import { Heart } from "lucide-react-native";
import { Pressable } from "react-native";

type LikeButtonProps = {
  listingId: number;
  className?: string;
  size?: number;
};

export function LikeButton({ listingId, className, size }: LikeButtonProps) {
  // Selects a bool, so only this heart re-renders when its related like changes
  const isLiked = useLikesStore((s) => s.likedIds.has(listingId));
  const toggleLike = useLikesStore((s) => s.toggleLike);

  return (
    <Pressable
      onPress={() => toggleLike(listingId)}
      hitSlop={8}
      role="button"
      aria-label={isLiked ? "Ta bort från sparade" : "Spara objekt"}
      className={cn("size-9 items-center justify-center", className)}
    >
      <Icon
        as={Heart}
        size={size}
        fill={`${isLiked ? "destructive" : "none"}`}
        className={cn(
          isLiked ? "fill-destructive text-destructive" : "text-foreground",
        )}
      />
    </Pressable>
  );
}
