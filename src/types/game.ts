/**
 * ============================================
 * GAME TYPES (GLOBAL SHARED TYPES)
 * ============================================
 *
 * PURPOSE:
 * Defines all core types used across the entire platform.
 *
 * NOTES:
 * - Keep this file PURE (no logic)
 * - Must support multiple games (Kata, AK47, future games)
 * - Avoid game-specific hardcoding
 */

export type Card = {
  id: string
  value: string
  suit?: string
  imageUrl?: string
}

export type Player = {
  id: string
  name: string
  hand: Card[]
  isAI?: boolean
}

export type GameStatus = "waiting" | "playing" | "finished"

export type GameType = "kata" | "ak47"

/**
 * GameMeta holds extra metadata for a running game.
 * Extendable for future engines.
 */
export type GameMeta = {
  targetCard?: string
  step?: string
  declaringPlayerIndex?: number
  winnerId?: string
}

export type GameState = {
  players: Player[]
  deck: Card[]
  discardPile: Card[]
  currentTurn: number
  status: GameStatus
  gameType: GameType
  meta: GameMeta
}

export type GameAction =
  | { type: "DECLARE_TARGET"; payload: string }
  | { type: "CUT"; payload: number }
  | { type: "REDISTRIBUTE" }
  | { type: "DRAW_CARD" }
  | { type: "DISCARD_CARD"; payload: string }
  | { type: "END_TURN" }
