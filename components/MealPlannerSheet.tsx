import React, { forwardRef, useImperativeHandle, useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedKeyboard,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Coffee, Apple, Croissant, CookingPot, Sandwich } from 'lucide-react-native';
import useUserProfileStore from '@/store/useProfileStore';
import { useNutritionProfile } from '@/hooks/useNutrition';
import useMealStore from '@/store/useMealStore';
import useAuthStore from '@/store/useAuthStore';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 100;

interface MealPlannerSheetProps {
  onClose: () => void;
}

export interface MealPlannerSheetRef {
  open: () => void;
  close: () => void;
}

const MealPlannerSheet = forwardRef<MealPlannerSheetRef, MealPlannerSheetProps>(
  ({ onClose }, ref) => {
    const translateY = useSharedValue(0);
    const keyboard = useAnimatedKeyboard()
    const active = useSharedValue(false);
    const [mealPlans, setMealPlans] = useState({
      breakfast: '',
      lunch: '',
      dinner: '',
      snacks: ''
    });
    const [planDetails, setPlanDetails] = useState('')
    const {personalMealPlan, isLoading} = useNutritionProfile()
    const insets = useSafeAreaInsets();

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
        transform: [{ translateY: translateY.value }],
      };
    });

    const {profile} = useUserProfileStore()
    const {populateStore} = useMealStore()
    const {response} = useAuthStore()
    const userId = response?.user.id.toString()
    const getCurrentDate = new Date().toISOString().split('T')[0];

    const handleGeneratePlan = async () => {
      if(!userId) return
      const planDetailsToSend = Object.values(mealPlans).join('. ');
      const res = await personalMealPlan({nutritionProfile:profile as any, planDetails: planDetailsToSend});
      populateStore([{
        date:getCurrentDate,
        userId:userId,
        categories:res
      }], userId)
      onClose()
    };

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Plan Your Meals</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.content}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            <View style={styles.inputSection}>
              <Text style={styles.label}>Describe your meal plan</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Describe your meal plan for the day. It will be curated to your profile."
                  value={planDetails}
                  multiline
                  onChangeText={setPlanDetails}
                  placeholderTextColor="#A0AEC0"
                />
                <Sandwich size={24} color="#666" style={styles.inputIcon} />
              </View>
            </View>
            {/* {Object.entries(mealPlans).map(([meal, plan]) => (
              <View key={meal} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  {meal === 'breakfast' && <Coffee size={24} color="#1db954" />}
                  {meal === 'lunch' && <Apple size={24} color="#1db954" />}
                  {meal === 'dinner' && <CookingPot size={24} color="#1db954" />}
                  {meal === 'snacks' && <Croissant size={24} color="#1db954" />}
                  <Text style={styles.mealTitle}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={`Describe your ${meal} plan`}
                  value={plan}
                  onChangeText={(text) => setMealPlans(prev => ({ ...prev, [meal]: text }))}
                  multiline
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            ))} */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleGeneratePlan}
          >
            {isLoading ? (
              <ActivityIndicator size={24} color="white" />
            ) : (
              <Text style={styles.buttonText}>Generate Meal Plan</Text>
            )}
          </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
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
    marginBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  inputIcon: {
    marginLeft: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#1db954',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MealPlannerSheet;

