import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { View } from "react-native";

import { ObjectCard } from "@/components/object-card";

export default function CardAndDialogComponents() {
  return (
    <>
      <View className="flex-1 gap-4 m-8 justify-center">
        <ObjectCard
          address="Stora Åvägen 53"
          price={5350000}
          rooms={3}
          area="Västra Frölunda, Göteborgs kommun"
          livingArea={78}
          imageUrl="https://images.unsplash.com/photo-1632829882891-5047ccc421bc?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
        />

        <View className="w-full flex-row flex-wrap justify-between gap-y-3">
          <ObjectCard
            size="small"
            address="Stora Åvägen 53"
            price={5350000}
            rooms={3}
            area="Västra Frölunda, Göteborgs kommun"
            livingArea={78}
            imageUrl="https://images.unsplash.com/photo-1632829882891-5047ccc421bc?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
          />
          <ObjectCard
            size="small"
            address="Stora Åvägen 53"
            price={5350000}
            rooms={3}
            area="Västra Frölunda, Göteborgs kommun"
            livingArea={78}
            imageUrl="https://images.unsplash.com/photo-1632829882891-5047ccc421bc?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
          />
          <ObjectCard
            size="small"
            address="Stora Åvägen 53"
            price={5350000}
            rooms={3}
            area="Västra Frölunda, Göteborgs kommun"
            livingArea={78}
            imageUrl="https://images.unsplash.com/photo-1632829882891-5047ccc421bc?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
          />
          <ObjectCard
            size="small"
            address="Stora Åvägen 53"
            price={5350000}
            rooms={3}
            area="Västra Frölunda, Göteborgs kommun"
            livingArea={78}
            imageUrl="https://images.unsplash.com/photo-1632829882891-5047ccc421bc?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
          />
        </View>

        <Card className="max-w-80">
          <CardHeader>
            <CardTitle>Titel</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Text>Massa text</Text>
            <View className="gap-1">
              <Label>En label</Label>
              <Input placeholder="Ett inputfält"></Input>
            </View>
          </CardContent>
          <CardFooter>
            <Text variant="xsmall">Någon mer liten info</Text>
          </CardFooter>
        </Card>

        <Dialog>
          <DialogTrigger
            className={`${buttonVariants({ variant: "default" })} w-fit`}
          >
            <Text>Koppla konto</Text>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Titel</DialogTitle>
              <DialogDescription>
                Lite text som beskriver och har jag mer text här så växer rutan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="w-[45%] max-w-36">
                <Text>Ja</Text>
              </Button>
              <Button variant="destructive" className="w-[45%] max-w-36">
                <Text>Nej</Text>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </View>
    </>
  );
}
