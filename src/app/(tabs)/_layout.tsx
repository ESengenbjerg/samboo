import { Tabs } from "expo-router";
import { Bell, Bookmark, Search, Settings } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="search"
        options={{
          title: "Sök",
          tabBarIcon: ({ color }) => <Search color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Sparade",
          tabBarIcon: ({ color }) => <Bookmark color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notiser",
          tabBarIcon: ({ color }) => <Bell color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
            title: 'Inställningar',
            tabBarIcon: ({ color }) => <Settings color={color} />,
        }}
        />
    </Tabs>
  );
}
