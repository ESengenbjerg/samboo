import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as React from "react";
import { type TextInput, View } from "react-native";

export function SignInForm() {
  const passwordInputRef = React.useRef<TextInput>(null);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  function onSubmit() {
    // TODO: Submit form and navigate to protected screen if successful
  }

  return (
    <View className="gap- max-w-[70vw]">
      <View className="items-center mb-8">
        <Image
          source={require("@/assets/logos/logo-y-primary.svg")}
          style={{ width: 150, height: 90 }}
          contentFit="contain"
          className="left-100 "
        />
      </View>
      <View>
        <Text variant="bold" className="text-center text-xl text-background">
          Logga in
        </Text>
      </View>
      <View className="gap-6 align-center">
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
          <View className="flex-row items-center">
            <Label htmlFor="password" className="text-background">
              Lösenord
            </Label>
          </View>
          <Input
            ref={passwordInputRef}
            id="password"
            secureTextEntry
            returnKeyType="send"
            onSubmitEditing={onSubmit}
          />
        </View>

        <View className="gap-6 mt-6 items-center">
          <Button className="w-fit px-10" onPress={onSubmit}>
            <Text>Logga in</Text>
          </Button>

          <View className="flex-row gap-1 items-center justify-center">
            <Button
              variant="link"
              size="sm"
              className="web:h-fit h-4 sm:h-4"
              onPress={() => {
                router.push("/register");
              }}
            >
              <Text className="font-normal leading-4 text-background">
                Glömt lösenord?
              </Text>
            </Button>
            <Text className="text-background">|</Text>
            <Button
              variant="link"
              size="sm"
              className="web:h-fit h-4 sm:h-4"
              onPress={() => {
                router.push("/register");
              }}
            >
              <Text className="font-normal leading-4 text-background">
                Skapa konto
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
