import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { View, ActivityIndicator } from "react-native";

import { AuthProvider, AuthContext } from "./AuthContext";
import { WearableProvider } from "./src/context/WearableContext";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import Settings from "./src/screens/Settings";
import ReliefScreen from "./src/screens/ReliefScreen";
import AppInfoScreen from "./src/screens/AppInfoScreen";
import DeviceConnection from "./src/screens/DeviceInfoScreen";
import MusicScreen from "./src/screens/MusicScreen";
import GamesScreen from "./src/screens/GamesScreen";
import BubblePopperGame from "./src/screens/BubblePopperGame";
import MemoryMatchGame from "./src/screens/MemoryMatchGame";
import ReactionGame from "./src/screens/ReactionGame";
import BreathingGame from "./src/screens/BreathingGame";
import WeeklyHistory from "./src/screens/WeeklyHistory";

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
          <Stack.Screen name="DeviceConnection" component={DeviceConnection} />
          <Stack.Screen name="Music" component={MusicScreen} />
          <Stack.Screen name="Games" component={GamesScreen} />
          <Stack.Screen name="BubblePopperGame" component={BubblePopperGame} />
          <Stack.Screen name="MemoryMatchGame" component={MemoryMatchGame} />
          <Stack.Screen name="ReactionGame" component={ReactionGame} />
          <Stack.Screen name="BreathingGame" component={BreathingGame} />
          <Stack.Screen name="WeeklyHistory" component={WeeklyHistory} />
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // App is ready immediately - no TF.js needed
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f7f8' }}>
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <WearableProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </WearableProvider>
    </AuthProvider>
  );
}
