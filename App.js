import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";

import { AuthProvider, AuthContext } from "./AuthContext";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import DeviceInfo from "./src/screens/DeviceInfo";
import Settings from "./src/screens/Settings";
import ReliefScreen from "./src/screens/ReliefScreen";
import AppInfoScreen from "./src/screens/AppInfoScreen"; // ✅ Stack only

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------- Bottom Tabs (ONLY these appear below) ---------- */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let icon;
          switch (route.name) {
            case "Home":
              icon = "home";
              break;
            case "History":
              icon = "history";
              break;
            case "DeviceInfo":
              icon = "devices";
              break;
            case "Relief":
              icon = "spa";
              break;
            case "Settings":
              icon = "settings";
              break;
          }
          return <MaterialIcons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="DeviceInfo" component={DeviceInfo} />
      <Tab.Screen name="Relief" component={ReliefScreen} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}

/* ---------- Root Stack ---------- */
function RootNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="AppInfo" component={AppInfoScreen} /> 
          {/* 👆 NOT IN TAB → NO BOTTOM BAR */}
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

/* ---------- App Entry ---------- */
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
