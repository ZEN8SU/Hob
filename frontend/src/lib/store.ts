"use client";

import { create } from "zustand";

export type UserRoleMode = "poster" | "worker";

export interface UserState {
  id: string;
  name: string;
  phone: string;
  email: string;
  age?: number | null;
  customerProfile?: {
    id: string;
    address: string;
    avgRating: number;
  } | null;
  workerProfiles?: Array<{
    id: string;
    skills: string;
    hourlyRate: number;
    isAvailable: boolean;
    avgRating: number;
  }> | null;
}

interface AppStore {
  token: string | null;
  user: UserState | null;
  mode: UserRoleMode;
  walletBalance: number;
  escrowLocked: number;
  setAuth: (token: string, user: UserState) => void;
  logout: () => void;
  setMode: (mode: UserRoleMode) => void;
  toggleMode: () => void;
  updateWallet: (balance: number, escrow?: number) => void;
}

export const useAppStore = create<AppStore>((set) => {
  // Initial sync with localStorage if in browser
  const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const storedMode = typeof window !== "undefined" ? (localStorage.getItem("mode") as UserRoleMode) : "poster";

  return {
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
    mode: storedMode || "poster",
    walletBalance: 2450.0,
    escrowLocked: 750.0,

    setAuth: (token, user) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      set({ token, user });
    },

    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      set({ token: null, user: null });
    },

    setMode: (mode) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("mode", mode);
      }
      set({ mode });
    },

    toggleMode: () =>
      set((state) => {
        const nextMode = state.mode === "poster" ? "worker" : "poster";
        if (typeof window !== "undefined") {
          localStorage.setItem("mode", nextMode);
        }
        return { mode: nextMode };
      }),

    updateWallet: (balance, escrow = 0) =>
      set((state) => ({
        walletBalance: balance,
        escrowLocked: escrow !== undefined ? escrow : state.escrowLocked,
      })),
  };
});

