import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="picking_list"
        options={{
          title: 'Lấy hàng',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="assignment" color={color} />,
        }}
      />
      <Tabs.Screen
        name="push_list"
        options={{
          title: 'Cất hàng',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="inventory-2" color={color} />,
        }}
      />
      <Tabs.Screen name="picking" options={{ href: null }} />
      <Tabs.Screen name="pushing" options={{ href: null }} />
      <Tabs.Screen name="loginscreen" options={{ href: null }} />
    </Tabs>
  );
}
