import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { type TextInput, View } from "react-native";
import FormError from "./form-error";

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit() {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      // Match credentials to Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.log("Auth error:", error);
        setError("Fel e-post eller lösenord.");
        return;
      }
    } catch {
      setError("Något gick fel, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="gap-6 w-full max-w-sm px-14">
      <Text variant="bold" className="text-center text-xl text-background">
        Logga in
      </Text>
      <View className="gap-1.5">
        <Label htmlFor="signin-email" className="text-background">
          E-post
        </Label>
        <Input
          id="signin-email"
          placeholder="m@example.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
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

      {error && <FormError>{error}</FormError>}

      <View className="gap-6 mt-6 items-center">
        <Button className="px-10" onPress={onSubmit} disabled={isLoading}>
          <Text>{!isLoading ? "Logga in" : "Loggar in..."}</Text>
        </Button>

        <View className="flex-row gap-1 items-center justify-center">
          <Button
            variant="link"
            size="sm"
            onPress={() => {
              router.push("/forgotten-password");
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
  );
}
