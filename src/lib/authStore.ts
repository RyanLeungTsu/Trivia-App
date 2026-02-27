import { create } from "zustand";
import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
  waitForAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),

  waitForAuth: () => {
    return new Promise((resolve) => {
      const check = () => {
        if (!get().loading) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    // reload boards as a guest/using lcoalstorage after signing out
    const { useBoardStore } = await import("../store/editorStore");
    useBoardStore.getState().loadBoards();
  },

  init: () => {
    // Check existing session
    supabase.auth.getSession().then(({ data }) => {
      set({ user: data.session?.user ?? null, loading: false });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null });
      const { useBoardStore } = await import("../store/editorStore");
      useBoardStore.getState().loadBoards();
    });

    return () => subscription.unsubscribe();
  },
}));