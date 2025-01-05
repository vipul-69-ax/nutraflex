import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, Stack } from "expo-router";
import { View } from "react-native";
import { MenuProvider } from 'react-native-popup-menu';
import {GestureHandlerRootView} from 'react-native-gesture-handler'
const queryClient = new QueryClient();

export default function RootLayout() {
  return <QueryClientProvider client={queryClient}>
    <GestureHandlerRootView>
      <MenuProvider>
    <Stack
    screenOptions={{
      headerShown:false
    }}
  />
  </MenuProvider>
  </GestureHandlerRootView>
  </QueryClientProvider>
}
