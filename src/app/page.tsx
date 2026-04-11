"use client"

/**
 * MVP TEST PAGE
 */

import { useGame } from "@/hooks/useGame"

export default function Home() {
  const { state, start, dispatch } = useGame()

  return (
    <div className="p-10">
      <h1 className="text-2xl mb-4">Kata MVP</h1>

      <button onClick={() =>
        start("kata", [
          { id: "1", name: "Player", hand: [] },
          { id: "2", name: "AI", hand: [], isAI: true }
        ])
      }>
        Start Game
      </button>

      <button onClick={() => dispatch({ type: "DECLARE_TARGET", payload: "7" })}>
        Declare 7
      </button>

      <button onClick={() => dispatch({ type: "CUT", payload: 10 })}>
        Cut Deck
      </button>

      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  )
}