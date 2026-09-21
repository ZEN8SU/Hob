"use client";

import { create } from "zustand";

export type UserRoleMode = "poster" | "worker";

export interface UserState {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  age: number;
  skills: string[];
  role: string;
  avatarUrl?: string | null;
  avgRating?: number;
  customerProfile?: {
    id: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    avgRating: number;
  } | null;
  workerProfile?: {
    id: string;
    skills: string;
    skillsList: string[];
    hourlyRate: number;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    isAvailable: boolean;
    avgRating: number;
  } | null;
  workerProfiles?: Array<any> | null;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface AppStore {
  token: string | null;
  user: UserState | null;
  mode: UserRoleMode;
  userLocation: UserLocation | null;
  walletBalance: number;
  escrowLocked: number;
  totalEarnings: number;
  unreadNotifications: number;
  setAuth: (token: string, user: UserState) => void;
  updateUser: (partialUser: Partial<UserState>) => void;
  logout: () => void;
  setMode: (mode: UserRoleMode) => void;
  toggleMode: () => void;
  setLocation: (loc: UserLocation) => void;
  updateWallet: (balance: number, escrow?: number, earnings?: number) => void;
  setUnreadNotifications: (count: number) => void;
}

export const useAppStore = create<AppStore>((set) => {
  const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const storedMode = typeof window !== "undefined" ? (localStorage.getItem("mode") as UserRoleMode) : "poster";

  let initialUser: UserState | null = null;
  if (storedUser) {
    try {
      initialUser = JSON.parse(storedUser);
    } catch {
      initialUser = null;
    }
  }

  return {
    token: storedToken,
    user: initialUser,
    mode: storedMode || "poster",
    userLocation: null,
    walletBalance: 2450.0,
    escrowLocked: 450.0,
    totalEarnings: 8940.0,
    unreadNotifications: 0,

    setAuth: (token, user) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      set({ token, user });
    },

    updateUser: (partialUser) =>
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...partialUser };
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updated));
        }
        return { user: updated };
      }),

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

    setLocation: (loc) => set({ userLocation: loc }),

    updateWallet: (balance, escrow, earnings) =>
      set((state) => ({
        walletBalance: balance,
        escrowLocked: escrow !== undefined ? escrow : state.escrowLocked,
        totalEarnings: earnings !== undefined ? earnings : state.totalEarnings,
      })),

    setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  };
});
