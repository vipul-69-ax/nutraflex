import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { DayMeals } from '@/store/useMealStorage';

export type NutritionProfile = {
  userId: number;
  age: number;
  height: number;
  weight: number;
  gender: string;
  dietary_restrictions: boolean;
  selected_restrictions: string[];
  allergies: boolean;
  selected_allergies: string[];
  other_allergies: string;
  activity_level: string;
  goal: string;
} | null

export function useNutritionProfile() {
  const queryClient = useQueryClient();

  const setNutritionProfile = async (profile: NutritionProfile) => {
    await AsyncStorage.setItem('nutritionProfile', JSON.stringify(profile));
    queryClient.setQueryData(['nutritionProfile'], profile);
  };

  const clearNutritionProfile = async () => {
    await AsyncStorage.removeItem('nutritionProfile');
    queryClient.setQueryData(['nutritionProfile'], null);
  };

  const getNutritionProfileQuery = useQuery<NutritionProfile, Error>({
    queryKey: ['nutritionProfile'],
    queryFn: async () => {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) throw new Error('User ID not found');
      const response = await api.post<NutritionProfile>('/nutrition/profile', { userId: userId });
      if(!response.data) return null;
      return response.data;
    },
  });

  const updateNutritionProfileMutation = useMutation({
    mutationFn: async(data: NutritionProfile) => 
        api.post<NutritionProfile>('/nutrition/profile-update', data)
    ,
    onSuccess: async (data) => {
      const resp = await getSuggestedMacros.mutateAsync(data.data);
      await AsyncStorage.setItem("nutrition_profile_data", JSON.stringify({
        ...data.data,
        ...resp.data
      }));
      return data.data;
    },
    onError: (err) => {
      return err.message;
    }
  });

  const getSuggestedMacros = useMutation({
    mutationFn: (data: NutritionProfile) =>
      api.post<{
        carbs:number,
        protein:number,
        fat:number,
        calories:number,
        foodType:string
      }>('/nutrition/suggest-macros', {
        nutritionProfile: data
      }),
    onSuccess: (data) => {
      return data.data;
    },
    onError: (err) => {
      return err.message;
    }
  });

  const shouldIEatMutation = useMutation({
    mutationFn: (data: {nutritionProfile:any, foodInfo:any}) =>
      api.post<{suggestions:string}>('/nutrition/should-i-eat', {
        nutritionProfile:data.nutritionProfile,
        foodInfo:data.foodInfo
      }),
    onSuccess: (data) => {
      return data.data;
    },
    onError: (err) => {
      return err.message;
    }
  });
  
  const suggestedMealPlan = useMutation({
    mutationFn: (data: {nutritionProfile:any}) =>
      api.post<DayMeals>('/nutrition/suggest-meal-plan', {
        nutritionProfile:data.nutritionProfile,
      }),
    onSuccess: (data) => {
      return data.data;
    },
    onError: (err) => {
      return err.message;
    }
  });
  return {
    getNutritionProfile: getNutritionProfileQuery.data,
    updateNutritionProfile: updateNutritionProfileMutation.mutateAsync,
    setNutritionProfile,
    shouldIEat:shouldIEatMutation,
    clearNutritionProfile,
    suggestedMealPlan,
    isLoading:
      getNutritionProfileQuery.isLoading ||
      updateNutritionProfileMutation.isPending,
    error:
      getNutritionProfileQuery.error ||
      updateNutritionProfileMutation.error
  };
}

