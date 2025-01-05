import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { CircularProgress } from '@/components/CircularProgress';
import { router } from 'expo-router';
import useMealStore, { Meal } from '@/store/useMealStore';
import { useNutritionProfile } from '@/hooks/useNutrition';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { MealSection } from '@/components/MealComponents';
import useUserProfileStore from '@/store/useProfileStore';

export default function App() {
  const insets = useSafeAreaInsets();
  const { meals, populateStore, isStoreEmpty, macroTotals, trackMeal, removeMeal, removeOldMeals } = useMealStore();
  const { suggestedMealPlan } = useNutritionProfile();
  const currentDate = new Date().toISOString().split('T')[0];
  const {profile} = useUserProfileStore()
  const [macros] = useState([
    { 
      name: 'Carbs', 
      current: macroTotals.carbs, 
      target: profile?.carbs, 
      color: '#1db954', 
      unit: 'g' 
    },
    { 
      name: 'Fat', 
      current: macroTotals.fat, 
      target: profile?.fat, 
      color: '#FFB6C1', 
      unit: 'g' 
    },
    { 
      name: 'Protein', 
      current: macroTotals.protein, 
      target: profile?.protein, 
      color: '#FFE082', 
      unit: 'g' 
    },
    { 
      name: 'Calories', 
      current: macroTotals.calories, 
      target: profile?.calories, 
      color: '#4DB6AC', 
      unit: '' 
    },
  ])
  const todayMeals = meals[currentDate] || { breakfast: [], lunch: [], snack: [], dinner: [] };
  const getSuggestedMeals = async()=>{
    try {
      
      if(isStoreEmpty()){
        const res = await suggestedMealPlan({
          nutritionProfile: profile
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

        <View style={styles.macroContainer}>
          {macros.map((macro) => (
            <CircularProgress
              key={macro.name}
              value={macro.current}
              maxValue={macro.target as number}
              size={80}
              strokeWidth={8}
              color={macro.color}
              label={macro.name}
              unit={macro.unit}
            />
          ))}
        </View>

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

