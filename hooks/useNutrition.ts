import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import useUserProfileStore from '@/store/useProfileStore';
import { NutritionProfile, MacroSuggestion, ShouldIEatRequest, ShouldIEatResponse } from '@/types/nutrition';
import { DayMeals } from '@/store/useMealStore';

const NUTRITION_PROFILE_KEY = 'nutritionProfile';

export function useNutritionProfile() {
  const queryClient = useQueryClient();
  const { updateProfile } = useUserProfileStore();
  const getNutritionProfileMutation = useMutation<NutritionProfile | boolean, Error, number>({
    mutationFn: async (id:number) => {
      if (!id) throw new Error('User ID not found');
      console.log("id", id)
      const response = await api.post<NutritionProfile>('/nutrition/profile', { userId: id });
      if(response.status == 204){
        return false
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([NUTRITION_PROFILE_KEY], data);
      return data
    }
  });

  const updateNutritionProfileMutation = useMutation<NutritionProfile, Error, NutritionProfile>({
    mutationFn: async (data) => {
      const response = await api.post<NutritionProfile>('/nutrition/profile-update', data);
      return response.data;
    },
    onSuccess: async (data) => {
      updateProfile({ ...data } as any);
      queryClient.setQueryData([NUTRITION_PROFILE_KEY], data);
    },
  });

  const getSuggestedMacros = useMutation<MacroSuggestion, Error, NutritionProfile>({
    mutationFn: async (data) => {
      const response = await api.post<MacroSuggestion>('/nutrition/suggest-macros', { nutritionProfile: data });
      return response.data;
    },
  });

  const shouldIEatMutation = useMutation<ShouldIEatResponse, Error, ShouldIEatRequest>({
    mutationFn: async (data) => {
      const response = await api.post<ShouldIEatResponse>('/nutrition/should-i-eat', data);
      return response.data;
    },
  });
  
  const suggestedMealPlanMutation = useMutation<DayMeals, Error, { nutritionProfile: NutritionProfile }>({
    mutationFn: async (data) => {
      const response = await api.post<DayMeals>('/nutrition/suggest-meal-plan', data);
      return response.data;
    },
  });

  return {
    getNutritionProfile: getNutritionProfileMutation.mutateAsync,
    updateNutritionProfile: updateNutritionProfileMutation.mutateAsync,
    shouldIEat: shouldIEatMutation.mutateAsync,
    suggestedMealPlan: suggestedMealPlanMutation.mutateAsync,
    isLoading: getNutritionProfileMutation.isPending || updateNutritionProfileMutation.isPending,
    error: getNutritionProfileMutation.error || updateNutritionProfileMutation.error,
  };
}

