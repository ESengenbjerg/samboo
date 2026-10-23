import { Text } from "@/components/ui/text";

type FormMessageProps = {
  children: string;
};

export default function FormMessage({ children }: FormMessageProps) {
  return (
    <>
      <Text className="bg-foreground rounded min-h-10 text-center p-2 text-background">
        {children}
      </Text>
    </>
  );
}
