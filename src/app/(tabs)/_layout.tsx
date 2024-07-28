/* eslint-disable react/no-unstable-nested-components */
import { Link, Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { colors } from '@/ui/colors';

type Props = {
  materialIconName: keyof typeof MaterialIcons.glyphMap;
};

import { useAuth } from '@/core';
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
    if (status !== 'idle') {
      setTimeout(() => {
        hideSplash();
      }, 1000);
    }
  }, [hideSplash, status]);

  if (status === 'signOut') {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderWidth: 0,
            minHeight: 74,
            display: 'none',
          },
          tabBarItemStyle: {
            paddingBottom: 14,
            paddingTop: 14,
          },
          tabBarShowLabel: false,
          // tabBarActiveTintColor: colors.orange[500],
          // tabBarInactiveTintColor: colors.gray[400],
        }}
      >
        <Tabs.Screen
          name="order-list"
          options={{
            title: 'Feed',
            tabBarIcon: ({ size, color }) => (
              <MaterialIcons name="email" size={size} color={color} />
            ),
            headerRight: () => <CreateNewPostLink />,
            tabBarTestID: 'feed-tab',
          }}
        />
        <Tabs.Screen
          name="style"
          options={{
            title: 'Style',
            headerShown: false,
            tabBarIcon: ({ size, color }) => (
              <MaterialIcons name="videocam" size={size} color={color} />
            ),
            tabBarTestID: 'style-tab',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: false,
            tabBarIcon: ({ size, color }) => (
              <MaterialIcons name="chat-bubble" size={size} color={color} />
            ),
            tabBarTestID: 'settings-tab',
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
