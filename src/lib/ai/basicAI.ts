/**
 * ============================================
 * BASIC AI ENGINE
 * ============================================
 *
 * PURPOSE:
 * Selects a random valid move.
 */

import type { GameAction, GameState } from "@/types/game"
import { getEngine } from "@/lib/games"

export function getAIMove(state: GameState): GameAction | null {
  const engine = getEngine(state.gameType)
  const currentPlayer = state.players[state.currentTurn]
  const actions = currentPlayer
    ? engine.getValidActions(state, currentPlayer.id)
    : []

  if (actions.length === 0) {
    return null
  }

  return actions[Math.floor(Math.random() * actions.length)]
}
