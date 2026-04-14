import { create } from "zustand"
import { GameState } from "@/types/game"

type Store = {
  state: GameState | null
  setState: (s: GameState | null) => void
}

export const useGameStore = create<Store>((set) => ({
  state: null,
  setState: (s) => set({ state: s })
}))