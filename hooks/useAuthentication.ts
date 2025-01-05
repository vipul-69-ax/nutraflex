import { useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken, clearAuthToken } from '@/lib/api';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useNutritionProfile } from './useNutrition';
interface User {
  id: string;
  email: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const {getNutritionProfile:nutritionData} = useNutritionProfile()
  const setAuth = async (authResponse: AuthResponse) => {
    await AsyncStorage.setItem('auth', JSON.stringify(authResponse));
    setAuthToken(authResponse.token);
    await AsyncStorage.setItem('user_id', authResponse.user.id.toString())
    queryClient.setQueryData(['user'], authResponse.user);
  };

  const getUserId = async()=> {
    const userId = await AsyncStorage.getItem("user_id")
    return userId
  }

  const clearAuth = async () => {
    await AsyncStorage.removeItem('auth');
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
      setAuth(data.data);
      if(!nutritionData){
        router.replace("/auth/details")
        }else{
        router.replace("/food")
        }
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
    getUserId,
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

export function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const token = await AsyncStorage.getItem('auth');
        if(token == null){
        setIsAuthenticated(false);
        }
        else{
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthState();

  }, []);
    return isAuthenticated;
  }
