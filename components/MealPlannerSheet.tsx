import React, { forwardRef, useImperativeHandle, useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
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
import { X, Search, Camera, Sandwich } from 'lucide-react-native';
import useUserProfileStore from '@/store/useProfileStore';
import { useNutritionProfile } from '@/hooks/useNutrition';
import { UserProfile } from '@/types/profile';
import useMealStore from '@/store/useMealStore';
import useAuthStore from '@/store/useAuthStore';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT / 2;

interface MealPlannerSheetProps {
  onSearch: (foodName: string, foodQuantity: string) => void;
  onClose: () => void;
}

export interface MealPlannerSheetRef {
  open: () => void;
  close: () => void;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const MealPlannerSheet = forwardRef<MealPlannerSheetRef, MealPlannerSheetProps>(
  ({ onSearch, onClose }, ref) => {
    const translateY = useSharedValue(0);
    const keyboard = useAnimatedKeyboard()
    const active = useSharedValue(false);
    const [planDetails, setPlanDetails] = useState('');
    const {personalMealPlan, isLoading} = useNutritionProfile()
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
        scrollTo(0);
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
    const {profile} = useUserProfileStore()
    const {populateStore} = useMealStore()
    const {response} = useAuthStore()
    const userId = response?.user.id.toString()
    const getCurrentDate = new Date().toISOString().split('T')[0];

    const handleSearch = async () => {
        if(!userId) return
        const res = await personalMealPlan({nutritionProfile:profile, planDetails:planDetails})
        populateStore([{
            date:getCurrentDate,
            userId:userId,
            categories:res
        }], userId)
        onClose()
    };  

    return (
        <Animated.View style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Meal Plan{'\n'}
            <Text style={{fontSize:14}}>Current meals will be replaced.</Text>
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Describle your meal plan. It will be curated to your plan."
                  value={planDetails}
                  multiline
                  onChangeText={setPlanDetails}
                  placeholderTextColor="#A0AEC0"
                />
                <Sandwich size={20} color="#666" style={styles.inputIcon} />
              </View>

            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSearch}
            >
              {isLoading?<ActivityIndicator
                size={18}
                color={"white"}
              />:<Text style={styles.buttonText}>Search</Text>}
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
    top: SCREEN_HEIGHT,
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
    height: 100,
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

export default MealPlannerSheet;

