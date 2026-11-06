import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Text } from "@/components/ui/text";
import { ScrollView, useWindowDimensions, View } from "react-native";

type PrivacyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PrivacyDialog({ open, onOpenChange }: PrivacyDialogProps) {
  const { height } = useWindowDimensions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dina personuppgifter</DialogTitle>
        </DialogHeader>
        <ScrollView style={{ maxHeight: height * 0.6 }}>
          <View className="gap-4">
            <View className="gap-1">
              <Text variant="bold">Vad vi sparar</Text>
              <Text>
                Din e-postadress, ditt namn, en publik profilbild (om du laddar
                upp en), dina bevakningar, gillade objekt, taggar och planerade
                visningar. Om du bjuder in någon sparar vi mottagarens
                e-postadress.
              </Text>
            </View>

            <View className="gap-1">
              <Text variant="bold">Varför</Text>
              <Text>
                För att appen ska fungera: hitta bostäder som matchar dina
                bevakningar, låta dig och din grupp se varandras gillade objekt
                och skicka mail om nya objekt.
              </Text>
            </View>

            <View className="gap-1">
              <Text variant="bold">Vem ser vad</Text>
              <Text>
                Personer i din grupp ser ditt namn, din e-post, din profilbild
                och vad du gillat. Den du bjuder in ser ditt namn och din
                e-post. Din profilbild ligger publikt: den som har länken kan se
                den.
              </Text>
            </View>

            <View className="gap-1">
              <Text variant="bold">Hur länge</Text>
              <Text>
                Så länge du har kvar ditt konto. Obesvarade inbjudningar raderas
                automatiskt efter 90 dagar samt besvarade efter ett år.
                Visningar raderas 30 dagar efter visningsdagen.
              </Text>
            </View>

            <View className="gap-1">
              <Text variant="bold">Tjänster vi använder</Text>
              <Text>
                Supabase (databas och inloggning), Resend (mail) och Vercel
                (webbversionen). Dina uppgifter lagras i Supabase på servrar i
                Irland, inom EU.
              </Text>
            </View>

            <View className="gap-1">
              <Text variant="bold">Dina rättigheter</Text>
              <Text>
                Under Inställningar kan du när som helst ändra dina uppgifter,
                ta bort din bild, stänga av mail och radera ditt konto. Raderar
                du kontot försvinner allt som är kopplat till dig.
              </Text>
            </View>

            <View className="gap-1">
              <Text variant="bold">Kontakta oss</Text>
              <Text>info@samboo.site</Text>
            </View>
          </View>
        </ScrollView>
        <DialogFooter>
          <DialogClose asChild>
            <Button>
              <Text>Stäng</Text>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
