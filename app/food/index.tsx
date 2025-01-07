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
import { Scan, Sparkle } from 'lucide-react-native';
import useAuthStore from '@/store/useAuthStore';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import MealPlannerSheet, { MealPlannerSheetRef } from '@/components/MealPlannerSheet';

type Macro = {
  name: string;
  current: number;
  target?: number;
  color: string;
  unit: string;
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
      <Text style={styles.macroName}>{macro.name}</Text>
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, animatedStyles]} />
      </View>
      <Text style={styles.macroValue}>
        {macro.current}/{maxValue}{macro.unit}
      </Text>
    </View>
  );
};

export default function App() {
  const insets = useSafeAreaInsets();
  const { response } = useAuthStore();
  const userId = response?.user?.id?.toString() as string;
  const mealPlanSheetRef = useRef<MealPlannerSheetRef>(null);
  const {personalMealPlan} = useNutritionProfile()
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
  const todayMeals: DayMeal | undefined = !meals?undefined:meals.find(
    (dayMeal) => dayMeal.date === currentDate && dayMeal.userId === userId
  );

  const macros: Macro[] = [
    {
      name: 'Carbs',
      current: macroTotals[userId]?.carbs || 0,
      target: profile?.carbs,
      color: '#1db954',
      unit: 'g',
    },
    {
      name: 'Fat',
      current: macroTotals[userId]?.fat || 0,
      target: profile?.fat,
      color: '#FFB6C1',
      unit: 'g',
    },
    {
      name: 'Protein',
      current: macroTotals[userId]?.protein || 0,
      target: profile?.protein,
      color: '#FFE082',
      unit: 'g',
    },
    {
      name: 'Calories',
      current: macroTotals[userId]?.calories || 0,
      target: profile?.calories,
      color: '#4DB6AC',
      unit: '',
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
    if (!userId) return;
    trackMeal(meal.id, userId);
  };

  const handleRemoveMeal = (meal: Meal) => {
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
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.iconButton}>
              <AntDesign name="user" size={24} color="#2d3436" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/food/scan')} style={styles.iconButton}>
              <Scan size={24} color="#2d3436" />
            </TouchableOpacity>
          </View>
          <View style={styles.titleContainer}>
            <Text onPress={getSuggestedMeals} style={styles.title}>
              Today's Nutrition
            </Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
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
      <Pressable onPress={()=>{
        mealPlanSheetRef.current?.open()
      }} style={{opacity:0.6}} className='absolute bottom-12 right-12 bg-[#1db954] p-4 rounded-full'>
        <Sparkle
          size={28}
          color={"white"}
        />
      </Pressable>
      <MealPlannerSheet
            ref={mealPlanSheetRef}
            onSearch={()=>{}}
            onClose={()=>{
              mealPlanSheetRef.current?.close()
              Keyboard.dismiss()
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3436',
  },
  subtitle: {
    fontSize: 14,
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
    marginBottom: 15,
  },
  macroName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  barBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'right',
  },
  mealsContainer: {
    padding: 20,
  },
});

