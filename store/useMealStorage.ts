import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Meal {
  id: string | number
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
  tracked: boolean
}

type MealCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface DayMeals {
  [key: string]: {
    [K in MealCategory]: Meal[]
  }
}

interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MealStore {
  meals: DayMeals
  macroTotals: MacroTotals
  addMeal: (meal: Meal) => void
  removeMeal: (id: string | number) => void
  trackMeal: (id: string | number) => void
  isStoreEmpty: () => boolean
  updateMacroTotals: () => void
  populateStore: (meals: {}) => void
  clearStore: () => void,
  removeOldMeals:()=>void
}

const categorizeMeal = (): MealCategory => {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 14) return 'lunch'
  if (hour < 17) return 'snack'
  return 'dinner'
}

const getCurrentDate = () => new Date().toISOString().split('T')[0]

const calculateMacroTotals = (meals: DayMeals): MacroTotals => {
  const totals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  Object.values(meals).forEach(dayMeals => {
    Object.values(dayMeals).forEach(mealArray => {
      mealArray
        .filter(meal => meal.tracked) // Only include meals where tracked is true
        .forEach(meal => {
          totals.calories += meal.calories
          totals.protein += meal.protein
          totals.carbs += meal.carbs
          totals.fat += meal.fat
        })
    })
  })
  return totals
}

const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      meals: {},
      macroTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      addMeal: (meal) => {
        const currentDate = getCurrentDate()
        const category = categorizeMeal()
        const id = Date.now().toString()
        set((state) => {
          const updatedMeals = { ...state.meals }
          if (!updatedMeals[currentDate]) {
            updatedMeals[currentDate] = { breakfast: [], lunch: [], snack: [], dinner: [] }
          }
          updatedMeals[currentDate][category].push({ ...meal })
          const newMacroTotals = calculateMacroTotals(updatedMeals)
          return { meals: updatedMeals, macroTotals: newMacroTotals }
        })
      },
      removeMeal: (id) => {
        const currentDate = getCurrentDate()
        set((state) => {
          const updatedMeals = { ...state.meals }
          if (updatedMeals[currentDate]) {
            for (const category of ['breakfast', 'lunch', 'snack', 'dinner'] as MealCategory[]) {
              updatedMeals[currentDate][category] = updatedMeals[currentDate][category].filter(
                (meal) => meal.id !== id
              )
            }
          }
          const newMacroTotals = calculateMacroTotals(updatedMeals)
          return { meals: updatedMeals, macroTotals: newMacroTotals }
        })
      },
      trackMeal: (id) => {
        const currentDate = getCurrentDate()
        set((state) => {
          const updatedMeals = { ...state.meals }
          if (updatedMeals[currentDate]) {
            for (const category of ['breakfast', 'lunch', 'snack', 'dinner'] as MealCategory[]) {
              updatedMeals[currentDate][category] = updatedMeals[currentDate][category].map(meal => 
                meal.id === id ? { ...meal, tracked: true } : meal
              )
            }
          }
          const newMacroTotals = calculateMacroTotals(updatedMeals)
          return { meals: updatedMeals, macroTotals: newMacroTotals }
        })
      },
      isStoreEmpty: () => {
        const state = get()
        return Object.keys(state.meals).length === 0 || 
               Object.values(state.meals).every(dayMeals => 
                 Object.values(dayMeals).every(mealArray => mealArray.length === 0)
               )
      },
      updateMacroTotals: () => {
        set((state) => {
          const newMacroTotals = calculateMacroTotals(state.meals)
          return { macroTotals: newMacroTotals }
        })
      },
      populateStore: (meals) => {
        set(() => {
          const updatedMeals = { ...meals }
          const newMacroTotals = calculateMacroTotals(updatedMeals)
          return { meals: updatedMeals, macroTotals: newMacroTotals }
        })
      },
      clearStore: () => {
        set(() => ({
          meals: {},
          macroTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        }))
      },
      removeOldMeals: () => {
        
        const currentDate = getCurrentDate()

        set((state) => {
          const updatedMeals = Object.keys(state.meals)
            .filter(key => key === currentDate) // Keep only keys matching the current date
            .reduce((acc, key) => {
              acc[key] = state.meals[key]
              return acc
            }, {} as DayMeals)
          const newMacroTotals = calculateMacroTotals(updatedMeals)
          return { meals: updatedMeals, macroTotals: newMacroTotals }
        })
      },
    }),
    {
      name: 'meal-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const currentDate = getCurrentDate()
          state.meals = Object.keys(state.meals)
            .filter(key => key === currentDate)
            .reduce((acc, key) => {
              acc[key] = state.meals[key]
              return acc
            }, {} as DayMeals)
          state.macroTotals = calculateMacroTotals(state.meals)
        }
      },
    }
  )
)



export default useMealStore
