/**
 * ============================================
 * BASIC AI ENGINE
 * ============================================
 *
 * PURPOSE:
 * Selects a random valid move.
 */

import { GameState } from "@/types/game"
import { getEngine } from "@/lib/games"

export function getAIMove(state: GameState) {
  const engine = getEngine(state.gameType)
  const actions = engine.getValidActions(state, "ai")

  return actions[Math.floor(Math.random() * actions.length)]
}