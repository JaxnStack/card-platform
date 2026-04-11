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
 */

import { GameEngine } from "./engine"
import { GameState, Player, Card, GameAction } from "@/types/game"

const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]

function createDeck(): Card[] {
  const deck: Card[] = []
  for (let i = 0; i < 4; i++) {
    for (const v of VALUES) {
      deck.push({ id: `${v}-${i}-${Math.random()}`, value: v })
    }
  }
  return shuffle(deck)
}

function shuffle(deck: Card[]): Card[] {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const kataEngine: GameEngine = {
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

  dispatch(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case "DECLARE_TARGET":
        return {
          ...state,
          meta: { ...state.meta, targetCard: action.payload }
        }

      case "CUT": {
        const index = action.payload
        const top = state.deck.slice(0, index)
        const bottom = state.deck.slice(index)

        if (top[0]?.value === state.meta.targetCard) {
          return { ...state, status: "finished" }
        }

        return {
          ...state,
          deck: [...bottom, ...top]
        }
      }

      case "REDISTRIBUTE": {
        const players = state.players.map(p => ({ ...p, hand: [] }))
        const deck = [...state.deck]

        let i = 0
        while (deck.length) {
          players[i % players.length].hand.push(deck.shift()!)
          i++
        }

        return { ...state, players, deck: [] }
      }

      default:
        return state
    }
  },

  getValidActions(): GameAction[] {
    return [
      { type: "CUT", payload: 1 },
      { type: "REDISTRIBUTE" }
    ]
  },

  isGameOver(state: GameState) {
    return state.status === "finished"
  }
}