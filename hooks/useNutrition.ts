import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import useUserProfileStore from '@/store/useProfileStore';
import { NutritionProfile, MacroSuggestion, ShouldIEatRequest, ShouldIEatResponse } from '@/types/nutrition';
import { DayMeals } from '@/store/useMealStore';
import { UserProfile } from '@/types/profile';

const NUTRITION_PROFILE_KEY = 'nutritionProfile';

export function useNutritionProfile() {
  const queryClient = useQueryClient();
  const { updateProfile } = useUserProfileStore();
  const getNutritionProfileMutation = useMutation<NutritionProfile | boolean, Error, number>({
    mutationFn: async (id:number) => {
      if (!id) throw new Error('User ID not found');
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

  const shouldIEatMutation = useMutation<ShouldIEatResponse, Error, ShouldIEatRequest>({
    mutationFn: async (data) => {
      const response = await api.post<ShouldIEatResponse>('/nutrition/should-i-eat', data);
      return response.data;
    },
  });
  
  const suggestedMealPlanMutation = useMutation<any, Error, { nutritionProfile: UserProfile }>({
    mutationFn: async (data) => {
      const response = await api.post<any>('/nutrition/suggest-meal-plan', data);
      return response.data;
    },
    retry:3,
    retryDelay:0
  });

  const personalMealPlanMutation = useMutation<any, Error, { nutritionProfile: UserProfile, planDetails: string }>({
    mutationFn: async (data) => {
      const response = await api.post<any>('/nutrition/personal-meal-plan', data);
      return response.data;
    }
  });

  return {
    getNutritionProfile: getNutritionProfileMutation.mutateAsync,
    updateNutritionProfile: updateNutritionProfileMutation.mutateAsync,
    shouldIEat: shouldIEatMutation.mutateAsync,
    suggestedMealPlan: suggestedMealPlanMutation.mutateAsync,
    personalMealPlan:personalMealPlanMutation.mutateAsync,
    isLoading: getNutritionProfileMutation.isPending || updateNutritionProfileMutation.isPending || personalMealPlanMutation.isPending,
    error: getNutritionProfileMutation.error || updateNutritionProfileMutation.error,
  };
}

