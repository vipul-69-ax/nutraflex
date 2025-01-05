import React, { useRef } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FoodSearchBottomSheet, { FoodSearchBottomSheetRef } from '@/components/FoodSearchSheet';

export default function App() {
  const bottomSheetRef = useRef<FoodSearchBottomSheetRef>(null);

  const handleOpenBottomSheet = () => {
    bottomSheetRef.current?.open();
  };

  const handleSearch = (foodName: string, foodQuantity: string) => {
    console.log(`Searching for ${foodName} (${foodQuantity})`);
    // Implement your search logic here
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.container}>
          <Button title="Open Food Search" onPress={handleOpenBottomSheet} />
          
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

