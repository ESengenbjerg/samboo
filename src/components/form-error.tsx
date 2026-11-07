import { Text } from "@/components/ui/text";

type FormErrorProps = {
  children: string;
};

export default function FormError({ children }: FormErrorProps) {
  return (
    <>
      <Text className="bg-destructive rounded-sm min-h-10 text-center px-10 py-2 text-background sm:self-start">
        {children}
      </Text>
    </>
  );
}
