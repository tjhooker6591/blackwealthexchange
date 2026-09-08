// mobile/src/navigation/RootNavigator.tsx
//
// Real native-quality navigation: a bottom-tab shell (Directory,
// Marketplace, Jobs, Opportunities, AI Mode) plus an auth-gated stack
// (Login <-> Account/Saved/Notifications/Business Management) -- the
// same navigation pattern App Store apps use, built on
// @react-navigation, not a custom web-view wrapper.

import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../api/AuthContext";
import DirectoryScreen from "../screens/DirectoryScreen";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import JobsScreen from "../screens/JobsScreen";
import OpportunitiesScreen from "../screens/OpportunitiesScreen";
import AiModeScreen from "../screens/AiModeScreen";
import LoginScreen from "../screens/LoginScreen";
import AccountScreen from "../screens/AccountScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SavedScreen from "../screens/SavedScreen";
import BusinessManagementScreen from "../screens/BusinessManagementScreen";
import WalletScreen from "../screens/WalletScreen";
import { ActivityIndicator, View } from "react-native";

const Tab = createBottomTabNavigator();
const AccountStack = createNativeStackNavigator();

const bweTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#000",
    card: "#0a0a0a",
    primary: "#D4AF37",
  },
};

function AccountStackNavigator() {
  const { user } = useAuth();
  return (
    <AccountStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#0a0a0a" },
        headerTintColor: "#fff",
      }}
    >
      {user ? (
        <>
          <AccountStack.Screen name="Account" component={AccountScreen} />
          <AccountStack.Screen name="Wallet" component={WalletScreen} />
          <AccountStack.Screen name="Saved" component={SavedScreen} />
          <AccountStack.Screen
            name="Notifications"
            component={NotificationsScreen}
          />
          <AccountStack.Screen
            name="Manage Businesses"
            component={BusinessManagementScreen}
          />
        </>
      ) : (
        <AccountStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </AccountStack.Navigator>
  );
}

export default function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={bweTheme}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#0a0a0a" },
          headerTintColor: "#fff",
          tabBarStyle: { backgroundColor: "#0a0a0a", borderTopColor: "#222" },
          tabBarActiveTintColor: "#D4AF37",
          tabBarInactiveTintColor: "#666",
        }}
      >
        <Tab.Screen name="Directory" component={DirectoryScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
        <Tab.Screen name="Jobs" component={JobsScreen} />
        <Tab.Screen name="Opportunities" component={OpportunitiesScreen} />
        <Tab.Screen name="AI Mode" component={AiModeScreen} />
        <Tab.Screen
          name="Account"
          component={AccountStackNavigator}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
