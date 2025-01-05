import { IconProps } from '@expo/vector-icons/build/createIconSet';
import { Ionicons, } from '@expo/vector-icons';
export interface FoodData {
  name: string;
  imageUrl: string;
  quantity: string;
  description: string;
  isFood: boolean;
  nutritionalContent: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface NutritionItemProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap
  percentage: number;
}