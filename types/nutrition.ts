import { AxiosResponse } from "axios";

export interface NutritionProfile {
    userId: number | string;
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
  }
  
  export interface MacroSuggestion {
    carbs: number;
    protein: number;
    fat: number;
    calories: number;
    foodType: string;
  }
  
  export interface ShouldIEatRequest {
    nutritionProfile: NutritionProfile;
    foodInfo: {
      name: string;
      nutritionalContent: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
      quantity: string;
    };
  }
  
  export interface ShouldIEatResponse {
    suggestions: string;
  }
  
  
  export type ApiResponse<T> = AxiosResponse<T>;
