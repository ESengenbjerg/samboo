import { useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text"

import { SaveObjectDialog } from "@/components/modals/save-object-dialog";
import { Button } from "@/components/ui/button";
import { SaveShowingDialog } from "@/components/modals/save-showing-dialog";

export default function CardAndDialogComponents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialog2Open, setDialog2Open] = useState(false);
  // const [alertOpen, setAlertOpen] = useState(false);
  return (
    <>
      <View>
        <Button onPress={() => setDialogOpen(true)}>
          <Text>Visning</Text>
        </Button>

        <SaveShowingDialog
        key={1}
          open={dialogOpen}
          onOpenChange={() => setDialogOpen(false)}
          dates={["3/10", "4/10"]}
          onSave={() => setDialogOpen(false)}
        ></SaveShowingDialog>
      </View>
   
      <View>
        <Button onPress={() => setDialog2Open(true)}>
          <Text>Öppna</Text>
        </Button>
        <SaveObjectDialog
          open={dialog2Open}
          onOpenChange={() => setDialog2Open(false)}
          onAction={() => setDialog2Open(false)}
        ></SaveObjectDialog>
      </View>

      {/* <View>
        <Button onPress={() => setAlertOpen(true)}>
          <Text>Alert</Text>
        </Button>
        <ConfirmDialog
          open={alertOpen}
          onOpenChange={() => setAlertOpen(false)}
          title="Inbjudan skickad"
          description="Din inbjudan har skickats. När kontona har kopplats kan ni se varandras gillade objekt och tillsammans hitta ert nästa hem."
          actionLabel="Radera konto"
          onAction={() => setAlertOpen(false)}
          cancelLabel="Avbryt"
          onCancel={() => setAlertOpen(false)}
        />
      </View>

      <View>
        <Button onPress={() => setDialogOpen(true)}>
          <Text>Bevakning</Text>
        </Button>
        <InfoDialog
          open={dialogOpen}
          onOpenChange={() => setDialogOpen(false)}
          title="Inbjudan skickad"
          description="Din inbjudan har skickats. När kontona har kopplats kan ni se varandras gillade objekt och tillsammans hitta ert nästa hem."
          actionLabel="Skapa bevakning"
          onAction={() => {
            setDialogOpen(false);
            router.push("/create-filter");
          }}
        />
      </View>

      <View>
        <Button variant="destructive" onPress={() => setDialog2Open(true)}>
          <Text>Fel</Text>
        </Button>
        <InfoDialog
          open={dialog2Open}
          onOpenChange={() => setDialog2Open(false)}
          title="Något gick fel"
          description="Kunde inte hitta bevakning."
          actionLabel="Försök igen"
          onAction={() => {
            setDialog2Open(false);
          }}
        />
      </View> */}

      {/* <View className="flex-1 gap-4 m-8 justify-center">
        <ObjectCard
          address="Stora Åvägen 53"
          price={5350000}
          rooms={3}
          area="Västra Frölunda, Göteborgs kommun"
          livingArea={78}
          imageUrl="https://images.unsplash.com/photo-1632829882891-5047ccc421bc?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
        />

        <View className="w-full flex-row flex-wrap justify-between gap-3">
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
          <CardContent className="gap-4">
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
      </View> */}
    </>
  );
}
