/**
 * ============================================
 * GAME ENGINE INTERFACE
 * ============================================
 *
 * PURPOSE:
 * Standard contract for all game engines.
 *
 * NOTES:
 * - Every game must implement this
 * - Enables plug-and-play game system
 */

import { GameState, Player, GameAction } from "@/types/game"

export interface GameEngine {
  createGame(players: Player[]): GameState
  dispatch(state: GameState, action: GameAction): GameState
  getValidActions(state: GameState, playerId: string): GameAction[]
  isGameOver(state: GameState): boolean
}