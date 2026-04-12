"use client"

/**
 * ============================================
 * MVP TEST PAGE (IMPROVED UI, MOBILE RESPONSIVE)
 * ============================================
 *
 * PURPOSE:
 * - Provides a simple UI for testing the Kata game engine
 * - Allows starting a game, declaring a target card, cutting the deck,
 *   and redistributing cards
 * - Renders deck and player hands visually instead of raw JSON
 * - Mobile responsive using Tailwind CSS
 *
 * NOTES:
 * - Uses `useGame` hook to manage game state
 * - Deck cards are displayed with index + value
 * - Cut index can be entered manually
 */

import { useState } from "react"
import { useGame } from "@/hooks/useGame"

export default function Home() {
  const { state, start, dispatch } = useGame()
  const [cutIndex, setCutIndex] = useState(0)

  return (
    <div className="p-4 sm:p-10 bg-slate-900 text-white min-h-screen">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-yellow-400">
        Kata MVP 🎮
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          onClick={() =>
            start("kata", [
              { id: "1", name: "Player", hand: [] },
              { id: "2", name: "AI", hand: [], isAI: true }
            ])
          }
        >
          Start Game
        </button>

        <button
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          onClick={() =>
            dispatch({ type: "DECLARE_TARGET", payload: "7" })
          }
        >
          Declare 7
        </button>

        {/* Cut index input + button */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max={state.deck.length - 1}
            value={cutIndex}
            onChange={(e) => setCutIndex(Number(e.target.value))}
            className="px-2 py-1 text-black rounded w-20"
          />
          <button
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            onClick={() => dispatch({ type: "CUT", payload: cutIndex })}
          >
            Cut Deck
          </button>
        </div>

        <button
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
          onClick={() => dispatch({ type: "REDISTRIBUTE" })}
        >
          Redistribute
        </button>
      </div>

      {/* Deck display */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Deck</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {state.deck.map((card, i) => (
            <div
              key={card.id}
              className="p-2 bg-gray-700 rounded text-center text-sm"
            >
              {i}: {card.value}
            </div>
          ))}
        </div>
      </div>

      {/* Player hands */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Players</h2>
        {state.players.map((player) => (
          <div key={player.id} className="mb-4">
            <h3 className="font-bold">{player.name}</h3>
            <div className="flex flex-wrap gap-2">
              {player.hand.map((card) => (
                <div
                  key={card.id}
                  className="p-2 bg-blue-700 rounded text-center text-sm w-12"
                >
                  {card.value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Debug JSON (optional) */}
      <div className="bg-black p-4 rounded">
        <pre className="text-xs sm:text-sm overflow-auto">
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>
    </div>
  )
}
