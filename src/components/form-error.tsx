import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";

type FormErrorProps = {
  children: string;
  className?: string;
};

export default function FormError({ children, className }: FormErrorProps) {
  // Native screen readers don't reliably read a view that appears, so announce it
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(children);
  }, [children]);

  return (
    <>
      <Text
        // Announced by screen readers as soon as it appears
        role="alert"
        className={cn(
          "bg-destructive rounded-sm min-h-10 text-center px-10 py-2 text-background sm:self-start",
          className,
        )}
      >
        {children}
      </Text>
    </>
  );
}
