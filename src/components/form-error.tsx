import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type FormErrorProps = {
  children: string;
  className?: string;
};

export default function FormError({ children, className }: FormErrorProps) {
  return (
    <>
      <Text
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
