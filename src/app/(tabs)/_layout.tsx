import TabsNavigation from "@/components/tabs-navigation";
import { Tabs } from "expo-router";
import { HouseHeart, ListFilter, Search, Settings } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <>
      <Tabs
        tabBar={(props) => <TabsNavigation {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="search"
          options={{
            title: "Sök bostad",
            tabBarIcon: ({ color }) => <Search color={color} />,
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: "Sparat",
            tabBarIcon: ({ color }) => <HouseHeart color={color} />,
          }}
        />
        <Tabs.Screen
          name="update-filter"
          options={{
            title: "Bevakning",
            tabBarIcon: ({ color }) => <ListFilter color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Inställningar",
            tabBarIcon: ({ color }) => <Settings color={color} />,
          }}
        />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </>
  );
}
