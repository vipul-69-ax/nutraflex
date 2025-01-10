import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import useMealStore, { Meal, DayMeal } from '@/store/useMealStore';
import { useNutritionProfile } from '@/hooks/useNutrition';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { MealSection } from '@/components/MealComponents';
import useUserProfileStore from '@/store/useProfileStore';
import { Apple, Beef, Flame, Heart, Scan, Sparkle } from 'lucide-react-native';
import useAuthStore from '@/store/useAuthStore';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import MealPlannerSheet, { MealPlannerSheetRef } from '@/components/MealPlannerSheet';
import * as Haptics from 'expo-haptics'

type Macro = {
  name: string;
  current: number;
  target?: number;
  color: string;
  unit: string;
  icon: React.ReactNode;
};

const AnimatedMacroBar = ({ macro, maxValue, color }: { macro: Macro; maxValue: number; color: string }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(macro.current / maxValue, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
  }, [macro.current, maxValue]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
      backgroundColor: color,
    };
  });

  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroHeaderContainer}>
        <View style={[styles.macroIcon, { backgroundColor: `${color}20` }]}>
          {macro.icon}
        </View>
        <Text style={styles.macroName}>{macro.name}</Text>
        <Text style={styles.macroValue}>
          {macro.current}/{maxValue}{macro.unit}
        </Text>
      </View>
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, animatedStyles]} />
      </View>
    </View>
  );
};

export default function App() {
  const insets = useSafeAreaInsets();
  const { response } = useAuthStore();
  const userId = response?.user?.id?.toString() as string;
  const mealPlanSheetRef = useRef<MealPlannerSheetRef>(null);
  const { personalMealPlan } = useNutritionProfile();
  const {
    meals,
    populateStore,
    isStoreEmpty,
    macroTotals,
    trackMeal,
    removeMeal,
    removeOldMeals,
    clearStore
  } = useMealStore();

  const { suggestedMealPlan, isLoading } = useNutritionProfile();
  const { profile } = useUserProfileStore();

  const currentDate = new Date().toISOString().split('T')[0];
  const todayMeals: DayMeal | undefined = !meals ? undefined : meals.find(
    (dayMeal) => dayMeal.date === currentDate && dayMeal.userId === userId
  );

  const macros: Macro[] = [
    {
      name: 'Carbs',
      current: macroTotals[userId]?.carbs || 0,
      target: profile?.carbs,
      color: '#1db954',
      unit: 'g',
      icon: <Apple size={16} color="#1db954" />,
    },
    {
      name: 'Fat',
      current: macroTotals[userId]?.fat || 0,
      target: profile?.fat,
      color: '#FFB6C1',
      unit: 'g',
      icon: <Heart size={16} color="#FFB6C1" />,
    },
    {
      name: 'Protein',
      current: macroTotals[userId]?.protein || 0,
      target: profile?.protein,
      color: '#FFE082',
      unit: 'g',
      icon: <Beef size={16} color="#FFE082" />,
    },
    {
      name: 'Calories',
      current: macroTotals[userId]?.calories || 0,
      target: profile?.calories,
      color: '#4DB6AC',
      unit: '',
      icon: <Flame size={16} color="#4DB6AC" />,
    },
  ];

  const getSuggestedMeals = async () => {
    try {
      if (!profile || !userId) return;
      if (isStoreEmpty(userId)) {
        const res = await suggestedMealPlan({
          nutritionProfile: profile,
        });

        removeOldMeals();
        populateStore(
          [
            {
              date: currentDate,
              userId,
              categories: res,
            },
          ],
          userId
        );
      }
    } catch (error) {
      console.error('Error getting suggested meals:', error);
    }
  };

  const handleTrackMeal = (meal: Meal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
    if (!userId) return;
    trackMeal(meal.id, userId);
  };

  const handleRemoveMeal = (meal: Meal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
    if (!userId) return;
    removeMeal(meal.id, userId);
  };

  useEffect(() => {
    getSuggestedMeals();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>      
      {isLoading && <LoadingOverlay message="Searching food..." />}
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Today's Nutrition</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        

        <View style={styles.macroContainer}>
          {macros.map((macro) => (
            <AnimatedMacroBar
              key={macro.name}
              macro={macro}
              maxValue={macro.target || 1}
              color={macro.color}
            />
          ))}
        </View>

        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.iconButton}>
            <AntDesign name="user" size={24} color="#2d3436" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/food/scan')} style={styles.iconButton}>
            <Scan size={24} color="#2d3436" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              mealPlanSheetRef.current?.open()
            }} 
            style={styles.iconButton}
          >
            <Sparkle size={24} color="#2d3436" />
          </TouchableOpacity>
        </View>

        <View style={styles.mealsContainer}>
          {todayMeals &&
            Object.entries(todayMeals.categories).map(([category, items]) => (
              items.length > 0 && <MealSection
                key={category}
                title={category}
                items={items}
                onTrack={handleTrackMeal}
                onRemove={handleRemoveMeal}
              />
            ))}
        </View>
      </ScrollView>
      <MealPlannerSheet
        ref={mealPlanSheetRef}
        onClose={() => {
          Keyboard.dismiss()
          mealPlanSheetRef.current?.close()
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f2f2f2',
    borderRadius: 30,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3436',
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    fontWeight: '500',
  },
  macroContainer: {
    padding: 20,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  macroBarContainer: {
    marginBottom: 20,
  },
  macroHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  macroName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  mealsContainer: {
    paddingHorizontal: 20,
  },
});

