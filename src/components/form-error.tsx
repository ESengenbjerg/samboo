import { Text } from "react-native"

type FormErrorProps = {
  children: string;
};
 
export default function FormError({ children }: FormErrorProps) {
    return (
        <>
        <Text className="bg-destructive rounded min-h-10 text-center p-2 text-background">
        {children}
        </Text>
        </>
    )
}