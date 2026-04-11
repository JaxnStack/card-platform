/**
 * ============================================
 * KATA GAME ENGINE
 * ============================================
 *
 * PURPOSE:
 * Implements Kata card game logic.
 *
 * NOTES:
 * - Suits are ignored
 * - Game is deterministic
 * - Uses action-based system (important for multiplayer later)
 *
 * ⚠️ DEV NOTES:
 * - Always ensure arrays are strongly typed (avoid "never[]" issues)
 * - Keep all functions PURE (no side effects)
 * - Do not mutate original state directly
 */

import { GameEngine } from "./engine"
import { GameState, Player, Card, GameAction } from "@/types/game"

const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]

/**
 * Create a standard shuffled deck
 */
function createDeck(): Card[] {
  const deck: Card[] = []

  for (let i = 0; i < 4; i++) {
    for (const v of VALUES) {
      deck.push({
        id: `${v}-${i}-${Math.random()}`,
        value: v,
        suit: "ignored"
      })
    }
  }

  return shuffle(deck)
}

/**
 * Fisher-Yates shuffle
 */
function shuffle(deck: Card[]): Card[] {
  const arr = [...deck]

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

export const kataEngine: GameEngine = {
  /**
   * Initialize game
   */
  createGame(players: Player[]): GameState {
    return {
      players,
      deck: createDeck(),
      discardPile: [],
      currentTurn: 0,
      status: "playing",
      gameType: "kata",
      meta: {}
    }
  },

  /**
   * Main dispatcher for game actions
   */
  dispatch(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      /**
       * Declare target card (e.g. "7")
       */
      case "DECLARE_TARGET":
        return {
          ...state,
          meta: { ...state.meta, targetCard: action.payload }
        }

      /**
       * Cut the deck at a given index
       */
      case "CUT": {
        const index = action.payload

        const topHalf = state.deck.slice(0, index)
        const bottomHalf = state.deck.slice(index)

        const topCard = topHalf[0]

        // Win condition
        if (topCard?.value === state.meta.targetCard) {
          return {
            ...state,
            status: "finished"
          }
        }

        // Rearranged deck
        return {
          ...state,
          deck: [...bottomHalf, ...topHalf]
        }
      }

      /**
       * Redistribute cards among players
       */
      case "REDISTRIBUTE": {
        // ✅ FIX: Proper typing to avoid "never[]" issue
        const players: Player[] = state.players.map(p => ({
          ...p,
          hand: []
        }))

        const deck = [...state.deck]

        let i = 0

        while (deck.length > 0) {
          const card = deck.shift()
          if (!card) break

          players[i % players.length].hand.push(card)
          i++
        }

        return {
          ...state,
          players,
          deck: []
        }
      }

      default:
        return state
    }
  },

  /**
   * Returns possible actions (basic for now)
   */
  getValidActions(): GameAction[] {
    return [
      { type: "CUT", payload: 10 },
      { type: "REDISTRIBUTE" }
    ]
  },

  /**
   * Check if game is over
   */
  isGameOver(state: GameState): boolean {
    return state.status === "finished"
  }
}