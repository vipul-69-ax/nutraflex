import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Meal {
  id: string | number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  tracked: boolean;
}

type MealCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface DayMeal {
  date: string; // ISO date format (YYYY-MM-DD)
  userId: string; // User ID for identifying meals
  categories: {
    [K in MealCategory]: Meal[];
  };
}

export interface DayMeals {
  categories: {
    [K in MealCategory]: Meal[];
  };
}

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealStore {
  meals: DayMeal[];
  macroTotals: Record<string, MacroTotals>; // Macro totals per userId
  addMeal: (meal: Meal, userId: string) => void;
  removeMeal: (id: string | number, userId: string) => void;
  trackMeal: (id: string | number, userId: string) => void;
  getMacroTotals: (userId: string) => MacroTotals | undefined;
  updateMacroTotals: (userId: string) => void;
  populateStore: (meals: DayMeal[], userId:string) => void;
  isStoreEmpty: (userId:string) => boolean;
  clearStore: () => void;
  removeOldMeals: () => void;
}

const categorizeMeal = (): MealCategory => {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 14) return 'lunch';
  if (hour < 17) return 'snack';
  return 'dinner';
};

const getCurrentDate = () => new Date().toISOString().split('T')[0];

const calculateMacroTotals = (meals: DayMeal[], userId: string): MacroTotals => {
  const totals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  meals
    .filter((dayMeal) => dayMeal.userId === userId)
    .forEach((dayMeal) => {
      Object.values(dayMeal.categories).forEach((mealArray) => {
        mealArray
          .filter((meal) => meal.tracked)
          .forEach((meal) => {
            totals.calories += meal.calories;
            totals.protein += meal.protein;
            totals.carbs += meal.carbs;
            totals.fat += meal.fat;
          });
      });
    });
  return totals;
};

const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      meals: [],
      macroTotals: {},

      addMeal: (meal, userId) => {
        const currentDate = getCurrentDate();
        const category = categorizeMeal();
        const id = Date.now().toString();

        set((state) => {
          const existingDayMeal = state.meals.find(
            (dayMeal) => dayMeal.date === currentDate && dayMeal.userId === userId
          );

          let updatedMeals = [...state.meals];
          if (existingDayMeal) {
            existingDayMeal.categories[category].push({ ...meal, id });
          } else {
            const newDayMeal: DayMeal = {
              date: currentDate,
              userId,
              categories: { breakfast: [], lunch: [], snack: [], dinner: [] },
            };
            newDayMeal.categories[category].push({ ...meal, id });
            updatedMeals.push(newDayMeal);
          }

          const newMacroTotals = calculateMacroTotals(updatedMeals, userId);
          return {
            meals: updatedMeals,
            macroTotals: { ...state.macroTotals, [userId]: newMacroTotals },
          };
        });
      },

      removeMeal: (id, userId) => {
        const currentDate = getCurrentDate();

        set((state) => {
          const updatedMeals = state.meals.map((dayMeal) => {
            if (dayMeal.date === currentDate && dayMeal.userId === userId) {
              const updatedCategories = { ...dayMeal.categories };
              for (const category of ['breakfast', 'lunch', 'snack', 'dinner'] as MealCategory[]) {
                updatedCategories[category] = updatedCategories[category].filter(
                  (meal) => meal.id !== id
                );
              }
              return { ...dayMeal, categories: updatedCategories };
            }
            return dayMeal;
          });

          const newMacroTotals = calculateMacroTotals(updatedMeals, userId);
          return {
            meals: updatedMeals,
            macroTotals: { ...state.macroTotals, [userId]: newMacroTotals },
          };
        });
      },

      trackMeal: (id, userId) => {
        const currentDate = getCurrentDate();

        set((state) => {
          const updatedMeals = state.meals.map((dayMeal) => {
            if (dayMeal.date === currentDate && dayMeal.userId === userId) {
              const updatedCategories = { ...dayMeal.categories };
              for (const category of ['breakfast', 'lunch', 'snack', 'dinner'] as MealCategory[]) {
                updatedCategories[category] = updatedCategories[category].map((meal) =>
                  meal.id === id ? { ...meal, tracked: true } : meal
                );
              }
              return { ...dayMeal, categories: updatedCategories };
            }
            return dayMeal;
          });

          const newMacroTotals = calculateMacroTotals(updatedMeals, userId);
          return {
            meals: updatedMeals,
            macroTotals: { ...state.macroTotals, [userId]: newMacroTotals },
          };
        });
      },

      getMacroTotals: (userId) => {
        return get().macroTotals[userId];
      },

      isStoreEmpty: (userId) => {
        const currentDate = getCurrentDate()
        const userMeals = get().meals.filter((dayMeal) => dayMeal.userId === userId && dayMeal.date === currentDate);
        return (
          userMeals.length === 0 ||
          userMeals.every((dayMeal) =>
            Object.values(dayMeal.categories).every((mealArray) => mealArray.length === 0)
          )
        );
      },

      updateMacroTotals: (userId) => {
        set((state) => {
          const newMacroTotals = calculateMacroTotals(state.meals, userId);
          return { macroTotals: { ...state.macroTotals, [userId]: newMacroTotals } };
        });
      },

      populateStore: (meals, userId) => {
        set((state) => {
          const filteredMeals = meals.filter((dayMeal) => dayMeal.userId === userId);
          const newMacroTotals = calculateMacroTotals(filteredMeals, userId);
          const updatedMeals = [
            ...state.meals.filter((dayMeal) => dayMeal.userId !== userId),
            ...filteredMeals,
          ];

          return {
            meals: updatedMeals,
            macroTotals: { ...state.macroTotals, [userId]: newMacroTotals },
          };
        });
      },

      clearStore: () => {
        set(() => ({
          meals: [],
          macroTotals: {},
        }));
      },

      removeOldMeals: () => {
        const currentDate = getCurrentDate();

        set((state) => {
          const updatedMeals = state.meals.filter((dayMeal) => dayMeal.date === currentDate);

          const macroTotals = updatedMeals.reduce<Record<string, MacroTotals>>((totals, dayMeal) => {
            totals[dayMeal.userId] = calculateMacroTotals(updatedMeals, dayMeal.userId);
            return totals;
          }, {});

          return { meals: updatedMeals, macroTotals };
        });
      },
    }),
    {
      name: 'meal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useMealStore;


