import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

import 'leaflet/dist/leaflet.css';

import { Stack } from 'expo-router';

 
export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
