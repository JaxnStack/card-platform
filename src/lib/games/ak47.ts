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

function canPickDiscardForWin(hand: Card[], discardPile: Card[]) {
  const topCard = discardPile[discardPile.length - 1]
  if (!topCard) {
    return false
  }

  // Players may only pick the top discard if it completes a four-of-a-kind.
  // This enforces the rule that the discard stack can be used only to win.
  return hasFourOfKind([...hand, topCard])
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
      player.hand = cardDeck.splice(0, 4)
    }

    const winner = playersWithHands.find((player) => hasFourOfKind(player.hand))

    return {
      players: playersWithHands,
      deck: cardDeck,
      discardPile: [],
      currentTurn: 0,
      status: winner ? "finished" : "playing",
      gameType: "ak47",
      meta: {
        step: winner ? "win" : "dealt",
        winnerId: winner?.id
      }
    }
  },

  dispatch(state: GameState, action: GameAction): GameState {
    if (state.status === "finished") {
      return state
    }

    const currentPlayer = state.players[state.currentTurn]
    if (!currentPlayer) {
      return state
    }

    switch (action.type) {
      case "DRAW_CARD": {
        if (currentPlayer.hand.length !== 4) {
          return state
        }

        if (action.payload === "discard") {
          const discardTop = state.discardPile[state.discardPile.length - 1]
          if (!discardTop) {
            return state
          }

          const players = state.players.map((player, index) =>
            index === state.currentTurn
              ? { ...player, hand: [...player.hand, discardTop] }
              : player
          )

          return {
            ...state,
            players,
            discardPile: state.discardPile.slice(0, -1),
            meta: {
              ...state.meta,
              step: "picked-discard"
            }
          }
        }

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

        return {
          ...state,
          players,
          deck,
          meta: {
            ...state.meta,
            step: "drew-deck"
          }
        }
      }

      case "DISCARD_CARD": {
        if (currentPlayer.hand.length !== 5) {
          return state
        }

        const cardIndex = currentPlayer.hand.findIndex((card) => card.id === action.payload)
        if (cardIndex === -1) {
          return state
        }

        const cardToDiscard = currentPlayer.hand[cardIndex]
        const remainingHand = currentPlayer.hand.filter((card) => card.id !== action.payload)
        const players = state.players.map((player, index) =>
          index === state.currentTurn
            ? { ...player, hand: remainingHand }
            : player
        )

        const winnerId = hasFourOfKind(remainingHand) ? currentPlayer.id : undefined
        const nextTurn = winnerId ? state.currentTurn : nextPlayer(state)

        return {
          ...state,
          players,
          discardPile: [...state.discardPile, cardToDiscard],
          currentTurn: nextTurn,
          status: winnerId ? "finished" : "playing",
          meta: {
            ...state.meta,
            winnerId,
            step: winnerId ? "win" : "discarded"
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

    if (activePlayer.hand.length === 5) {
      return activePlayer.hand.map((card) => ({
        type: "DISCARD_CARD",
        payload: card.id
      }))
    }

    if (activePlayer.hand.length === 4) {
      const actions: GameAction[] = []

      if (state.deck.length > 0) {
        actions.push({ type: "DRAW_CARD", payload: "deck" })
      }

      if (canPickDiscardForWin(activePlayer.hand, state.discardPile)) {
        actions.push({ type: "DRAW_CARD", payload: "discard" })
      }

      return actions
    }

    return []
  },

  isGameOver(state: GameState): boolean {
    return state.status === "finished"
  }
}
