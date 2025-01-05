import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  activity_level?: string;
  age?: number;
  allergies?: boolean;
  calories?: number;
  carbs?: number;
  dietary_restrictions?: boolean;
  fat?: number;
  foodtype?: string;
  gender?: string;
  goal?: string;
  height?: string;
  other_allergies?: string;
  protein?: number;
  selected_allergies?: string[];
  selected_restrictions?: string[];
  weight?: string;
}

interface UserProfileStore {
  profile: UserProfile | null;
  clearProfile:()=>void;
  updateProfile: (newData: Partial<UserProfile>) => void;
  deleteProfileField: (key: keyof UserProfile) => void;
  getProfileField: <K extends keyof UserProfile>(key: K) => UserProfile[K] | undefined;
}

const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      profile: null, // Initialize with an empty state
      clearProfile:()=>{
        set(()=>({profile:null}))
      },
      // Update profile with validation
      updateProfile: (newData) => {
        const validKeys = Object.keys(newData) as (keyof UserProfile)[];
        const filteredData = validKeys.reduce((acc, key) => {
          acc[key] = newData[key];
          return acc;
        }, {} as Partial<UserProfile>);

        set(() => {
          const updatedProfile = {...filteredData };
          return { profile: updatedProfile };
        });
      },

      // Delete a specific profile field
      deleteProfileField: (key) => {
        set((state) => {
          if (!state.profile) return state; // No-op if the profile is null
          const updatedProfile = { ...state.profile };
          delete updatedProfile[key];
          return { profile: updatedProfile };
        });
      },

      // Get a specific profile field
      getProfileField: (key) => {
        const res = get().profile
        if (!res) return undefined;
        return res[key];
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserProfileStore;
