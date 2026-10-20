import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import FormError from "./form-error";

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);
  const repeatPasswordInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  async function onSubmit() {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      if (password !== repeatPassword) {
        setError("Lösenorden matchar inte");
        return;
      }
      router.push("/verify-email");
    } catch {
      setError("Något gick fel, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Skapa konto
      </Text>
      <View className="gap-1.5">
        <Label htmlFor="signup-email" className="text-background">
          E-post
        </Label>
        <Input
          id="signup-email"
          placeholder="m@example.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={onEmailSubmitEditing}
          returnKeyType="next"
          submitBehavior="submit"
          textContentType="emailAddress"
          editable={!isLoading}
        />
      </View>
      <View className="gap-1.5">
        <Label htmlFor="signup-password" className="text-background">
          Lösenord
        </Label>
        <Input
          ref={passwordInputRef}
          id="signup-password"
          placeholder="*****"
          secureTextEntry
          returnKeyType="next"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => repeatPasswordInputRef.current?.focus()}
          autoComplete="new-password"
          textContentType="newPassword"
          editable={!isLoading}
        />
      </View>
      <View className="gap-1.5">
        <Label htmlFor="signup-repeat-password" className="text-background">
          Upprepa lösenord
        </Label>
        <Input
          ref={repeatPasswordInputRef}
          id="signup-repeat-password"
          placeholder="*****"
          secureTextEntry
          returnKeyType="send"
          value={repeatPassword}
          onChangeText={setRepeatPassword}
          onSubmitEditing={onSubmit}
          autoComplete="new-password"
          textContentType="newPassword"
          editable={!isLoading}
        />
      </View>

      {error && <FormError>{error}</FormError>}

      <View className="gap-6 mt-6 items-center">
        <Button className="px-10" onPress={onSubmit} disabled={isLoading}>
          <Text>{!isLoading ? "Skapa konto" : "Skapar konto..."}</Text>
        </Button>

        <Button
          variant="link"
          size="sm"
          onPress={() => {
            router.dismissTo("/login");
          }}
          disabled={isLoading}
        >
          <Text className="font-normal leading-4 text-background">
            Logga in
          </Text>
        </Button>
      </View>
    </View>
  );
}
