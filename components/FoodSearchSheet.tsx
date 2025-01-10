import React, { forwardRef, useImperativeHandle, useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useAnimatedKeyboard,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search, Camera } from 'lucide-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT / 2;

interface FoodSearchBottomSheetProps {
  onSearch: (foodName: string, foodQuantity: string) => void;
  onClose: () => void;
}

export interface FoodSearchBottomSheetRef {
  open: () => void;
  close: () => void;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const FoodSearchBottomSheet = forwardRef<FoodSearchBottomSheetRef, FoodSearchBottomSheetProps>(
  ({ onSearch, onClose }, ref) => {
    const translateY = useSharedValue(40);
    const keyboard = useAnimatedKeyboard()
    const active = useSharedValue(false);
    const [foodName, setFoodName] = useState('');
    const [foodQuantity, setFoodQuantity] = useState('');

    const scrollTo = useCallback((destination: number) => {
      'worklet';
      active.value = destination !== 0;
      translateY.value = withSpring(destination, { 
        damping: 20,
        stiffness: 90 
      });
    }, []);

    useImperativeHandle(ref, () => ({
      open: () => scrollTo(MAX_TRANSLATE_Y),
      close: () => {
        scrollTo(40);
      },
    }));

    const context = useSharedValue({ y: 0 });
    const gesture = Gesture.Pan()
      .onStart(() => {
        context.value = { y: translateY.value };
      })
      .onUpdate((event) => {
        translateY.value = event.translationY + context.value.y;
        translateY.value = Math.max(MAX_TRANSLATE_Y, Math.min(translateY.value, 0));
      })
      .onEnd(() => {
        if (translateY.value > -SCREEN_HEIGHT / 3) {
          scrollTo(0);
          onClose();
        } else {
          scrollTo(MAX_TRANSLATE_Y);
        }
      });

    const rBottomSheetStyle = useAnimatedStyle(() => {
      const borderRadius = interpolate(
        translateY.value,
        [MAX_TRANSLATE_Y + 50, MAX_TRANSLATE_Y],
        [25, 25],
        Extrapolate.CLAMP
      );

      return {
        borderRadius,
        transform: [{ translateY: translateY.value - keyboard.height.value }],
      };
    });

    const handleSearch = () => {
      onSearch(foodName, foodQuantity);
    };
    

    return (
        <Animated.View style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Search Food</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Food Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter food name"
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholderTextColor="#A0AEC0"
                />
                <Camera size={20} color="#666" style={styles.inputIcon} />
              </View>

              <Text style={styles.label}>Quantity</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter quantity"
                  value={foodQuantity}
                  onChangeText={setFoodQuantity}
                  placeholderTextColor="#A0AEC0"
                />
                <Search size={20} color="#666" style={styles.inputIcon} />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSearch}
            >
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: '#fff',
    position: 'absolute',
    top: SCREEN_HEIGHT - 40,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputIcon: {
    marginLeft: 12,
  },
  button: {
    backgroundColor: '#1db954',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FoodSearchBottomSheet;

