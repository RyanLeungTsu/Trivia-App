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

    const { useBoardStore } = await import("../store/editorStore");

    // clear boards from memory so Supabase boards don't persist once signed out
    useBoardStore.setState({
      boards: [],
      activeBoard: null,
      activeBoardId: null,
    });

    // reloads as local when signing out
    useBoardStore.getState().loadBoards();
  },

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ user: data.session?.user ?? null, loading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      set({ user, loading: false });

      if (event === "SIGNED_OUT") {
        const { useBoardStore } = await import("../store/editorStore");
        useBoardStore.getState().loadBoards();
      }
    });

    return () => subscription.unsubscribe();
  },
}));
