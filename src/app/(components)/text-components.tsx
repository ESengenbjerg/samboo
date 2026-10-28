import { Text } from "@/components/ui/text";
import { View } from "react-native";

export default function TextComponents() {
    return (
        <View className="p-11 flex-1 gap-2 justify-center">
            <Text variant="h1">Heading 1</Text>
            <Text variant="h2">Heading 2</Text>
            <Text variant="h3">Heading 3</Text>
            <Text variant="h4">Heading 4</Text>
            <Text variant="default">Default - Ingen margin</Text>
            <Text variant="p">Body - mt-3</Text>
            <Text variant="mediumBold">Semibold</Text>
            <Text variant="bold">Bold</Text>
            <Text variant="large">Large</Text>
            <Text variant="small">Small</Text>
            <Text variant="xsmall">X-small</Text>
            <Text variant="lead">Lead</Text>
            <Text variant="muted">Muted</Text>
        </View>
    )
}