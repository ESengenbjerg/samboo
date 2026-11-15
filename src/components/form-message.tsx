import { Text } from "@/components/ui/text";

type FormMessageProps = {
  children: string;
};

export default function FormMessage({ children }: FormMessageProps) {
  return (
    <>
      <Text
        // Announced politely when it appears, without interrupting
        role="status"
        aria-live="polite"
        className="bg-muted-foreground rounded-sm min-h-10 text-center px-10 py-2 text-background sm:self-start"
      >
        {children}
      </Text>
    </>
  );
}
