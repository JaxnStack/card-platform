/**
 * ============================================
 * KATA GAME ENGINE
 * ============================================
 *
 * PURPOSE:
 * Implements Kata card game logic with corrected rules.
 *
 * GAME RULES:
 * - Suits are ignored
 * - Deterministic, action-based system (important for multiplayer sync)
 * - Target card is declared at the start
 * - CUT compares the bottom card of the upper half
 * - If mismatch:
 *    1. Swap top and bottom cards
 *    2. Redistribute deck one card at a time
 *    3. Start dealing from the declaring player
 *    4. Game ends when target card appears in a player’s hand
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
   * Initialize game state
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
          meta: { 
            ...state.meta, 
            targetCard: action.payload,
            declaringPlayerIndex: state.currentTurn // track who declared
          }
        }

      /**
       * Cut the deck at a given index
       */
      case "CUT": {
        const index = action.payload

        const topHalf = state.deck.slice(0, index)
        const bottomHalf = state.deck.slice(index)

        // ✅ FIX: Compare bottom card of upper half
        const cutCard = topHalf[topHalf.length - 1]

        // Win condition: if cut card matches target
        if (cutCard?.value === state.meta.targetCard) {
          return {
            ...state,
            status: "finished"
          }
        }

        // Otherwise: swap top and bottom cards
        const deck = [...state.deck]
        if (deck.length > 1) {
          const temp = deck[0]
          deck[0] = deck[deck.length - 1]
          deck[deck.length - 1] = temp
        }

        // Redistribute cards one by one
        const players: Player[] = state.players.map(p => ({
          ...p,
          hand: []
        }))

        let i = state.meta.declaringPlayerIndex ?? 0

        while (deck.length > 0) {
          const card = deck.shift()
          if (!card) break

          players[i % players.length].hand.push(card)

          // Termination: target card found
          if (card.value === state.meta.targetCard) {
            return {
              ...state,
              players,
              deck: [],
              status: "finished"
            }
          }

          i++
        }

        // If no target card found, game continues
        return {
          ...state,
          players,
          deck: [],
          status: "playing"
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
      { type: "DECLARE_TARGET", payload: "7" }
    ]
  },

  /**
   * Check if game is over
   */
  isGameOver(state: GameState): boolean {
    return state.status === "finished"
  }
}
