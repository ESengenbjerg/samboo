import FormError from "@/components/form-error";
import FormMessage from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useState } from "react";
import { type TextStyle, View } from "react-native";

// Digits of equal width, so the text doesn't jump while counting down
const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ["tabular-nums"] };

type CodeFormProps = {
  onVerify: (code: string) => void;
  onResend: () => void;
  countdown: number;
  isLoading: boolean;
  message: string | null;
  error: string | null;
};

// The code field, "Skicka igen", the error and "Verifiera", shared by /verify-email and /reset-password.
// The screen decides what verifying and resending do, through onVerify and onResend
export function CodeForm({
  onVerify,
  onResend,
  countdown,
  isLoading,
  error,
  message,
}: CodeFormProps) {
  const [code, setCode] = useState("");

  // A fragment, so the parent's gap spaces these parts like the rest of the form
  return (
    <>
      <View className="gap-1.5">
        <Label htmlFor="verify-code" className="text-background">
          Verifieringskod
        </Label>
        <Input
          id="verify-code"
          placeholder="000000"
          autoCapitalize="none"
          returnKeyType="send"
          keyboardType="numeric"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          onSubmitEditing={() => onVerify(code)}
          value={code}
          // Keeps digits only. The web ignores keyboardType, so letters could be typed there
          onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
          editable={!isLoading}
          maxLength={6}
        />
        <Button
          variant="link"
          size="sm"
          disabled={countdown > 0 || isLoading}
          onPress={onResend}
        >
          <Text className="text-center text-sm text-background">
            Skicka igen
            {countdown > 0 ? (
              <Text
                className="text-sm text-background"
                style={TABULAR_NUMBERS_STYLE}
              >
                {` om ${countdown} s`}
              </Text>
            ) : null}
          </Text>
        </Button>
      </View>

      {error && <FormError>{error}</FormError>}
      {message && <FormMessage>{message}</FormMessage>}

      <View className="items-center mt-6">
        <Button
          className="px-10"
          onPress={() => onVerify(code)}
          disabled={isLoading}
        >
          <Text>{!isLoading ? "Verifiera" : "Verifierar..."}</Text>
        </Button>
      </View>
    </>
  );
}
