import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Coffee, ForkKnife } from 'lucide-react-native';
import { CircularProgress } from '@/components/CircularProgress';
import { router } from 'expo-router';
import useMealStore, { Meal } from '@/store/useMealStorage';
import { useNutritionProfile } from '@/hooks/useNutrition';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingOverlay } from '@/components/LoadingOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -75;



interface MealItemProps {
  item: Meal;
  onTrack: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
}

const MealItem: React.FC<MealItemProps> = ({ item, onTrack, onRemove }) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(70);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.min(0, Math.max(-SCREEN_WIDTH, event.translationX));
    })
    .onEnd((event) => {
      const shouldBeDismissed = translateX.value < SWIPE_THRESHOLD;
      if (shouldBeDismissed) {
        translateX.value = withSpring(-SCREEN_WIDTH);
        itemHeight.value = withSpring(0);
        opacity.value = withSpring(0, {}, (finished) => {
          if (finished) {
            runOnJS(onRemove)(item);
          }
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: opacity.value,
    marginBottom: itemHeight.value === 0 ? 0 : 10,
  }));

  const rIconContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-75, 0],
      [1, 0]
    );
    return { opacity };
  });

  return (
    <Animated.View style={[styles.mealItem, rContainerStyle]}>
      <View style={styles.deleteIconContainer}>
        <Animated.View style={rIconContainerStyle}>
          <AntDesign name="delete" size={24} color="white" />
        </Animated.View>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.mealItemContent, rStyle]}>
          <View style={styles.mealItemIcon}>
            <Coffee size={24} color="#1db954" />
          </View>
          <View style={styles.mealItemInfo}>
            <Text style={styles.mealItemName}>{item.name}</Text>
            <Text style={styles.mealItemMacros}>
              {item.calories} cal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
            </Text>
          </View>
          <TouchableOpacity style={styles.trackButton} onPress={() => {
            if(!item.tracked){
              onTrack(item);
            }
          }}>
            {item.tracked ? 
              <ForkKnife size={16} color="white" /> : 
              <AntDesign name="plus" size={16} color="white" />
            }
          </TouchableOpacity>
        </Animated.View>
          </GestureDetector>
    </Animated.View>
  );
};

interface MealSectionProps {
  title: string;
  items: Meal[];
  onTrack: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
}

const MealSection: React.FC<MealSectionProps> = ({ title, items, onTrack, onRemove }) => {
  return (
    <View style={styles.mealContainer}>
      <Text style={styles.mealTitle}>{title}</Text>
      {items.map((item) => (
        <MealItem key={item.id} item={item} onTrack={onTrack} onRemove={onRemove} />
      ))}
    </View>
  );
};

export default function App() {
  const insets = useSafeAreaInsets();
  const { meals, populateStore, isStoreEmpty, macroTotals, trackMeal, removeMeal, removeOldMeals } = useMealStore();
  const { suggestedMealPlan } = useNutritionProfile();
  const currentDate = new Date().toISOString().split('T')[0];
  const todayMeals = meals[currentDate] || { breakfast: [], lunch: [], snack: [], dinner: [] };
  const [maxMacros, setMaxMacros] = useState({
    carbs: 1,
    protein: 1,
    calories: 1,
    fat: 1
  });
  
  const getSuggestedMeals = async()=>{
    try {
      const profileData = await AsyncStorage.getItem("nutrition_profile_data");
      if (profileData) {
        const parsed = JSON.parse(profileData);
        setMaxMacros({
          carbs: parseInt(parsed.carbs),
          protein: parseInt(parsed.protein),
          calories: parseInt(parsed.calories),
          fat: parseInt(parsed.fat)
        });
      }
      
      if(isStoreEmpty()){
        const res = await suggestedMealPlan.mutateAsync({
          nutritionProfile: profileData
        });
        const formattedDate = new Date().toISOString().split('T')[0];
        
        removeOldMeals();
        populateStore({
          [formattedDate]: res.data
        });
      }
    } catch (error) {
      console.error('Error getting suggested meals:', error);
    }
  }
  
  const macros = [
    { 
      name: 'Carbs', 
      current: macroTotals.carbs, 
      target: maxMacros.carbs, 
      color: '#1db954', 
      unit: 'g' 
    },
    { 
      name: 'Fat', 
      current: macroTotals.fat, 
      target: maxMacros.fat, 
      color: '#FFB6C1', 
      unit: 'g' 
    },
    { 
      name: 'Protein', 
      current: macroTotals.protein, 
      target: maxMacros.protein, 
      color: '#FFE082', 
      unit: 'g' 
    },
    { 
      name: 'Calories', 
      current: macroTotals.calories, 
      target: maxMacros.calories, 
      color: '#4DB6AC', 
      unit: '' 
    },
  ];
  const handleTrackMeal = (meal: Meal) => {
    trackMeal(meal.id);
  }

  const handleRemoveMeal = (meal: Meal) => {
    removeMeal(meal.id);
  }

  useEffect(() => {
    getSuggestedMeals();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {suggestedMealPlan.isPending && <LoadingOverlay message='Loading...' />}
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconButton}>
              <AntDesign name='user' size={24} color="#2d3436" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/food/scan")} style={styles.iconButton}>
              <AntDesign name='scan1' size={24} color="#2d3436" />
            </TouchableOpacity>
          </View>
          <View style={styles.titleContainer}>
            <Text onPress={getSuggestedMeals} style={styles.title}>Today's Nutrition</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        {true && 
        <View style={styles.macroContainer}>
          {macros.map((macro) => (
            <CircularProgress
              key={macro.name}
              value={macro.current}
              maxValue={macro.target}
              size={80}
              strokeWidth={8}
              color={macro.color}
              label={macro.name}
              unit={macro.unit}
            />
          ))}
        </View>}

        <View style={styles.mealsContainer}>
          {todayMeals.breakfast.length > 0 && <MealSection title="Breakfast" items={todayMeals.breakfast} onTrack={handleTrackMeal} onRemove={handleRemoveMeal} />}
          {todayMeals.lunch.length > 0 && <MealSection title="Lunch" items={todayMeals.lunch} onTrack={handleTrackMeal} onRemove={handleRemoveMeal} />}
          {todayMeals.snack.length > 0 && <MealSection title="Snack" items={todayMeals.snack} onTrack={handleTrackMeal} onRemove={handleRemoveMeal} />}
          {todayMeals.dinner.length > 0 && <MealSection title="Dinner" items={todayMeals.dinner} onTrack={handleTrackMeal} onRemove={handleRemoveMeal} />}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    shadowColor: '#000',
    gap: 10,
    alignSelf: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mealsContainer: {
    padding: 20,
  },
  mealContainer: {
    marginBottom: 20,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2d3436',
  },
  mealItem: {
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  mealItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  mealItemIcon: {
    marginRight: 15,
    backgroundColor: 'rgba(77, 208, 225, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  mealItemMacros: {
    fontSize: 12,
    color: '#636e72',
  },
  trackButton: {
    backgroundColor: '#1db954',
    borderRadius: 20,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconContainer: {
    position: 'absolute',
    right: 0,
    height: '100%',
    width: 75,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    backgroundColor: 'red',
  },
});

