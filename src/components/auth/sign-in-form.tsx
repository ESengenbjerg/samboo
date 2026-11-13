import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { EMAIL_MAX_LENGTH } from "@/constants/limits";
import { useSignIn } from "@/hooks/auth/useSignIn";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { type TextInputInstance, View } from "react-native";

export function SignInForm() {
  const { logIn, isLoading, error } = useSignIn();

  const passwordInputRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit() {
    logIn(email, password);
  }

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Logga in
      </Text>
      <View className="gap-1.5">
        <Label htmlFor="signin-email" className="text-background">
          Mejl
        </Label>
        <Input
          id="signin-email"
          placeholder="namn@example.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          maxLength={EMAIL_MAX_LENGTH}
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          returnKeyType="next"
          submitBehavior="submit"
          editable={!isLoading}
          textContentType="emailAddress"
        />
      </View>
      <View className="gap-1.5">
        <Label htmlFor="signin-password" className="text-background">
          Lösenord
        </Label>
        <Input
          ref={passwordInputRef}
          id="signin-password"
          placeholder="*****"
          secureTextEntry
          returnKeyType="send"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={onSubmit}
          editable={!isLoading}
          autoComplete="current-password"
          textContentType="password"
        />
      </View>

      {error && <FormError className="sm:self-stretch">{error}</FormError>}

      <View className="gap-6 mt-6 items-center">
        <Button className="px-10" onPress={onSubmit} disabled={isLoading}>
          <Text>{!isLoading ? "Logga in" : "Loggar in..."}</Text>
        </Button>

        <View className="flex-row gap-1 items-center justify-center">
          <Button
            variant="link"
            onPress={() => {
              router.push({
                pathname: "/forgotten-password",
                params: { email },
              });
            }}
          >
            <Text className="leading-4 text-background">Glömt lösenord?</Text>
          </Button>
          <Text className="text-background">|</Text>
          <Button
            variant="link"
            onPress={() => {
              router.push("/register");
            }}
          >
            <Text className="leading-4 text-background">Skapa konto</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
