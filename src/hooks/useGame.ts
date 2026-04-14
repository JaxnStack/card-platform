import { useGameStore } from "@/store/gameStore"
import { getEngine } from "@/lib/games"
import type { GameAction, Player } from "@/types/game"

export function useGame() {
  const { state, setState } = useGameStore()

  function start(gameType: "kata" | "ak47", players: Player[]) {
    const engine = getEngine(gameType)
    const newState = engine.createGame(players)
    setState(newState)
  }

  function dispatch(action: GameAction) {
    if (!state) return
    const engine = getEngine(state.gameType)
    setState(engine.dispatch(state, action))
  }

  function reset() {
    setState(null)
  }

  return { state, start, dispatch, reset }
}
