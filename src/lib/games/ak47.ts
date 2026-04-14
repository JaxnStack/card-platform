/**
 * ============================================
 * AK47 GAME ENGINE
 * ============================================
 *
 * PURPOSE:
 * Implements a basic AK47-style draw-based game for local play.
 *
 * NOTES:
 * - This engine is intentionally simple for Phase 2.
 * - A player wins by collecting four cards of the same value.
 */

import { GameEngine } from "./engine"
import { GameState, Player, Card, GameAction } from "@/types/game"

const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
const SUITS = ["hearts", "diamonds", "clubs", "spades"]

function createDeck(): Card[] {
  const deck: Card[] = []

  for (let suitIndex = 0; suitIndex < SUITS.length; suitIndex++) {
    for (const value of VALUES) {
      deck.push({
        id: `${value}-${suitIndex}-${Math.random()}`,
        value,
        suit: SUITS[suitIndex]
      })
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

function hasFourOfKind(hand: Card[]) {
  const counts: Record<string, number> = {}

  for (const card of hand) {
    counts[card.value] = (counts[card.value] ?? 0) + 1
    if (counts[card.value] === 4) {
      return true
    }
  }

  return false
}

function nextPlayer(state: GameState) {
  return (state.currentTurn + 1) % state.players.length
}

export const ak47Engine: GameEngine = {
  createGame(players: Player[]): GameState {
    const deck = createDeck()
    const playersWithHands: Player[] = players.map((player) => ({
      ...player,
      hand: [] as Card[]
    }))

    const cardDeck = [...deck]
    for (const player of playersWithHands) {
      player.hand = cardDeck.splice(0, 5)
    }

    return {
      players: playersWithHands,
      deck: cardDeck,
      discardPile: [],
      currentTurn: 0,
      status: "playing",
      gameType: "ak47",
      meta: {
        step: "dealt"
      }
    }
  },

  dispatch(state: GameState, action: GameAction): GameState {
    if (state.status === "finished") {
      return state
    }

    switch (action.type) {
      case "DRAW_CARD": {
        if (state.deck.length === 0) {
          return {
            ...state,
            status: "finished",
            meta: {
              ...state.meta,
              step: "deck-empty"
            }
          }
        }

        const deck = [...state.deck]
        const drawnCard = deck.shift()!

        const players = state.players.map((player, index) =>
          index === state.currentTurn
            ? { ...player, hand: [...player.hand, drawnCard] }
            : player
        )

        const currentPlayer = players[state.currentTurn]
        const winnerId = hasFourOfKind(currentPlayer.hand)
          ? currentPlayer.id
          : undefined

        return {
          ...state,
          players,
          deck,
          currentTurn: winnerId ? state.currentTurn : nextPlayer(state),
          status: winnerId ? "finished" : deck.length === 0 ? "finished" : "playing",
          meta: {
            ...state.meta,
            winnerId,
            step: winnerId ? "win" : deck.length === 0 ? "deck-empty" : "drawn"
          }
        }
      }

      case "END_TURN": {
        return {
          ...state,
          currentTurn: nextPlayer(state),
          meta: {
            ...state.meta,
            step: "ended-turn"
          }
        }
      }

      default:
        return state
    }
  },

  getValidActions(state: GameState, playerId: string) {
    if (state.status !== "playing") {
      return []
    }

    const activePlayer = state.players[state.currentTurn]
    if (!activePlayer || activePlayer.id !== playerId) {
      return []
    }

    if (state.deck.length > 0) {
      return [{ type: "DRAW_CARD" }]
    }

    return []
  },

  isGameOver(state: GameState): boolean {
    return state.status === "finished"
  }
}
