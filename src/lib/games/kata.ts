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
const SUITS = ["hearts", "diamonds", "clubs", "spades"]

/**
 * Create a standard shuffled deck
 */
function createDeck(): Card[] {
  const deck: Card[] = []

  for (let i = 0; i < SUITS.length; i++) {
    for (const v of VALUES) {
      deck.push({
        id: `${v}-${SUITS[i]}-${Math.random()}`,
        value: v,
        suit: SUITS[i]
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

function nextPlayer(state: GameState): number {
  return (state.currentTurn + 1) % state.players.length
}

function getWinnerByTarget(state: GameState): string | undefined {
  return state.players.find((player) =>
    player.hand.some((card) => card.value === state.meta.targetCard)
  )?.id
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
      meta: {
        step: "waiting"
      }
    }
  },

  /**
   * Main dispatcher for game actions
   */
  dispatch(state: GameState, action: GameAction): GameState {
    if (state.status === "finished") {
      return state
    }

    switch (action.type) {
      case "DECLARE_TARGET": {
        if (state.meta.targetCard) {
          return state
        }

        return {
          ...state,
          meta: {
            ...state.meta,
            targetCard: action.payload,
            declaringPlayerIndex: state.currentTurn,
            step: "target-declared"
          }
        }
      }

      case "CUT": {
        if (!state.meta.targetCard || state.deck.length === 0) {
          return state
        }

        const maxCutIndex = Math.max(0, state.deck.length - 2)
        const index = Math.max(0, Math.min(action.payload, maxCutIndex))

        if (action.payload < 0 || action.payload >= state.deck.length - 1) {
          return {
            ...state,
            meta: {
              ...state.meta,
              step: "invalid-cut"
            }
          }
        }

        const topHalf = state.deck.slice(0, index)
        const bottomHalf = state.deck.slice(index)
        const cutCard = topHalf[topHalf.length - 1]

        if (cutCard?.value === state.meta.targetCard) {
          return {
            ...state,
            status: "finished",
            meta: {
              ...state.meta,
              winnerId: state.players[state.currentTurn]?.id,
              step: "cut-winner"
            }
          }
        }

        const deck = [...state.deck]
        if (deck.length > 1) {
          const temp = deck[0]
          deck[0] = deck[deck.length - 1]
          deck[deck.length - 1] = temp
        }

        return {
          ...state,
          deck,
          currentTurn: nextPlayer(state),
          meta: {
            ...state.meta,
            step: "cut-completed"
          }
        }
      }

      case "REDISTRIBUTE": {
        if (!state.meta.targetCard || state.deck.length === 0) {
          return state
        }

        const players: Player[] = state.players.map((player) => ({
          ...player,
          hand: []
        }))

        const deck = [...state.deck]
        let index = state.meta.declaringPlayerIndex ?? 0

        while (deck.length > 0) {
          const card = deck.shift()
          if (!card) {
            break
          }

          players[index % players.length].hand.push(card)

          if (card.value === state.meta.targetCard) {
            const winnerId = players[index % players.length].id
            return {
              ...state,
              players,
              deck: [],
              status: "finished",
              currentTurn: nextPlayer(state),
              meta: {
                ...state.meta,
                winnerId,
                step: "redistributed"
              }
            }
          }

          index += 1
        }

        return {
          ...state,
          players,
          deck: [],
          status: "playing",
          currentTurn: nextPlayer(state),
          meta: {
            ...state.meta,
            step: "redistributed"
          }
        }
      }

      default:
        return state
    }
  },

  /**
   * Returns possible actions for the current player.
   */
  getValidActions(state: GameState, playerId: string) {
    if (state.status !== "playing") {
      return []
    }

    const activePlayer = state.players[state.currentTurn]
    if (!activePlayer || activePlayer.id !== playerId) {
      return []
    }

    if (!state.meta.targetCard) {
      return [{ type: "DECLARE_TARGET", payload: "7" }]
    }

    if (state.meta.step !== "cut-completed") {
      return [{ type: "CUT", payload: Math.floor(state.deck.length / 2) }]
    }

    return [{ type: "REDISTRIBUTE" }]
  },

  /**
   * Check if game is over
   */
  isGameOver(state: GameState): boolean {
    return state.status === "finished"
  }
}
