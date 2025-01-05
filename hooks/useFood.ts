import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface NutritionalContent {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DetectFromTextInput {
    name:string,
    quantity:string
}

export interface FoodDetectionResult {
  name: string;
  quantity: string;
  description: string;
  nutritionalContent: NutritionalContent;
}

interface ApiError {
  error: string;
  details?: any;
}

export const useDetectFood = () => {
  return useMutation<FoodDetectionResult, ApiError, string>({
    mutationFn: async (imageUrl: string) => {
      const response = await api.post<FoodDetectionResult>(
        '/food/detectFood',
        { image_url: imageUrl },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    retry: 10,
    retryDelay:1000
  });
};


export const useDetectFoodFromText = () => {
    return useMutation<FoodDetectionResult, ApiError, DetectFromTextInput>({
      mutationFn: async (input: DetectFromTextInput) => {
        const response = await api.post<FoodDetectionResult>(
          '/food/detectFoodFromText',
          { text: input },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        return response.data;
      },
      retry:5,
      retryDelay:1000
    });
  };
  