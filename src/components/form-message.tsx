import { Text } from "@/components/ui/text";

type FormMessageProps = {
  children: string;
};

export default function FormMessage({ children }: FormMessageProps) {
  return (
    <>
      <Text className="bg-muted-foreground rounded min-h-10 text-center px-10 py-2 text-background self-start">
        {children}
      </Text>
    </>
  );
}
