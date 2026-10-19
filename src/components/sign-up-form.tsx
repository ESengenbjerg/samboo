import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import * as React from "react";
import { TextInput, View } from "react-native";

export function SignUpForm() {
  const passwordInputRef = React.useRef<TextInput>(null);
  const repeatPasswordInputRef = React.useRef<TextInput>(null);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  function onSubmit() {
    // TODO: Submit form and navigate to protected screen if successful
  }

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Skapa konto
      </Text>
      <View className="gap-1.5">
        <Label htmlFor="email" className="text-background">
          E-post
        </Label>
        <Input
          id="email"
          placeholder="m@example.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          onSubmitEditing={onEmailSubmitEditing}
          returnKeyType="next"
          submitBehavior="submit"
        />
      </View>
      <View className="gap-1.5">
        <Label htmlFor="password" className="text-background">
          Lösenord
        </Label>
        <Input
          ref={passwordInputRef}
          id="password"
          placeholder="*****"
          secureTextEntry
          returnKeyType="next"
          onSubmitEditing={() => repeatPasswordInputRef.current?.focus()}
        />
      </View>
      <View className="gap-1.5">
        <Label htmlFor="repeat-password" className="text-background">
          Upprepa lösenord
        </Label>
        <Input
          ref={repeatPasswordInputRef}
          id="repeat-password"
          placeholder="*****"
          secureTextEntry
          returnKeyType="send"
          onSubmitEditing={onSubmit}
        />
      </View>

      <View className="gap-6 mt-6 items-center">
        <Button className="px-10" onPress={onSubmit}>
          <Text>Skapa konto</Text>
        </Button>

        <Button
          variant="link"
          size="sm"
          onPress={() => {
            router.dismissTo("/login");
          }}
        >
          <Text className="font-normal leading-4 text-background">
            Logga in
          </Text>
        </Button>
      </View>
    </View>
  );
}
