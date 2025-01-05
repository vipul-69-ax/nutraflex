import { AuthResponse } from "@/types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthStore {
  response: AuthResponse | null;
  setResponse: (response: AuthResponse) => void;
  clearResponse: () => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      response: null,
      setResponse: (resp) => set({ response:resp }),
      clearResponse: () => set({ response: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAuthStore;
