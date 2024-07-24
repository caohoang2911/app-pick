/* eslint-disable react/no-unstable-nested-components */
import { Link, Redirect, SplashScreen, Tabs } from "expo-router";
import React, { useCallback, useEffect } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

type Props = {
  materialIconName: keyof typeof MaterialIcons.glyphMap;
};

import { useAuth } from "@/core";
// import { Pressable, Text } from "@/ui";
// import {
//   Feed as FeedIcon,
//   Settings as SettingsIcon,
//   Style as StyleIcon,
// } from "@/ui/icons";

export default function TabLayout() {
  const status = useAuth.use.status();
  // const [isFirstTime] = useIsFirstTime();
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    hideSplash();
    if (status !== "idle") {
      setTimeout(() => {
        hideSplash();
      }, 1000);
    }
  }, [hideSplash, status]);

  if (status === "idle") {
    alert(3);
    return <Redirect href="/login" />;
  }

  // if (status === "signOut") {
  //   return <Redirect href="/login" />;
  // }

  return (
    <>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            title: "Feed",
            tabBarIcon: ({ color }) => (
              <Ionicons icon="md-checkmark-circle" size={32} color={color} />
            ),
            headerRight: () => <CreateNewPostLink />,
            tabBarTestID: "feed-tab",
          }}
        />
        <Tabs.Screen
          name="style"
          options={{
            title: "Style",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons icon="md-checkmark-circle" size={32} color={color} />
            ),
            tabBarTestID: "style-tab",
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons icon="md-checkmark-circle" size={32} color={color} />
            ),
            tabBarTestID: "settings-tab",
          }}
        />
      </Tabs>
    </>
  );
}

const CreateNewPostLink = () => {
  return (
    <Link href="/feed/add-post" asChild>
      <Pressable>
        <Text>Create</Text>
      </Pressable>
    </Link>
  );
};
