/**
 * ============================================
 * AK47 GAME ENGINE (BASIC STUB)
 * ============================================
 *
 * PURPOSE:
 * Placeholder for AK47 logic.
 *
 * NOTES:
 * - Expand rules later
 * - Must follow same interface
 */

import { GameEngine } from "./engine"
import { GameState, Player } from "@/types/game"

export const ak47Engine: GameEngine = {
  createGame(players: Player[]): GameState {
    return {
      players,
      deck: [],
      discardPile: [],
      currentTurn: 0,
      status: "playing",
      gameType: "ak47",
      meta: {}
    }
  },

  dispatch(state) {
    return state
  },

  getValidActions() {
    return []
  },

  isGameOver() {
    return false
  }
}