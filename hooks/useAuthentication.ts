import { useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken, clearAuthToken } from '@/lib/api';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useNutritionProfile } from './useNutrition';
import { AuthResponse } from '@/types/auth';
import useAuthStore from '@/store/useAuthStore';
import useUserProfileStore from '@/store/useProfileStore';

export function useAuth() {
  const queryClient = useQueryClient();
  const {getNutritionProfile:nutritionData} = useNutritionProfile()
  const {clearProfile} = useUserProfileStore()
  const {setResponse, clearResponse} = useAuthStore()
  const {getNutritionProfile} = useNutritionProfile()
  const setAuth = async (authResponse: AuthResponse) => {
    setResponse(authResponse)
    setAuthToken(authResponse.token);
    queryClient.setQueryData(['user'], authResponse.user);
  };

  const clearAuth = async () => {
    clearResponse()
    clearProfile()
    clearAuthToken();
    router.replace("/auth")
    queryClient.setQueryData(['user'], null);
  };

  const signupMutation = useMutation({
    mutationFn: (data: { email: string; password: string; fullName: string }) =>
      api.post<{ message: string; email: string }>('/auth/signup', data),
    onSuccess: (data) => {
      // We don't set auth here because signup requires email verification
      return data.data;
    },
    onError:(err)=>{
        return err.message
    }
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      api.post<AuthResponse>('/auth/verify-email', data),
    onSuccess: (data) => {
      setAuth(data.data);
      if(!nutritionData){
      router.replace("/auth/details")
      }else{
      router.replace("/food")
      }
      return data.data;
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', data),
    onSuccess: (data) => {
      console.log("here")
      setAuth(data.data);
      return data.data;
    },
    onError:(e)=>e.message
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) =>
      api.post<{ message: string }>('/auth/forgot-password', data),
    onSuccess: (data) => data.data,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      api.post<{ message: string }>('/auth/reset-password', data),
    onSuccess: (data) => data.data,
  });

  const logoutMutation = ()=> {
    clearAuth()
  };

  return {
    signup: signupMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    logout: logoutMutation,
    isLoading:
      signupMutation.isPending ||
      verifyEmailMutation.isPending ||
      loginMutation.isPending ||
      forgotPasswordMutation.isPending ||
      resetPasswordMutation.isPending
  };
}

