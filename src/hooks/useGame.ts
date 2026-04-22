import { useGameStore } from "@/store/gameStore"
import { getEngine } from "@/lib/games"
import type { Card, GameAction, Player, GameState } from "@/types/game"

export function useGame() {
  const { state, setState } = useGameStore()

  function start(gameType: "kata" | "ak47", players: Player[], options?: { stakeValues?: string[] }) {
    const engine = getEngine(gameType)
    const newState = engine.createGame(players)
    if (options?.stakeValues) {
      newState.meta.stakeValues = options.stakeValues
    }
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

  function applyCardTheme(imageUrl: string) {
    if (!state) return

    const cardWithImage = (card: Card) => ({
      ...card,
      imageUrl
    })

    setState({
      ...state,
      deck: state.deck.map(cardWithImage),
      players: state.players.map((player) => ({
        ...player,
        hand: player.hand.map(cardWithImage)
      }))
    })
  }

  return { state, start, dispatch, reset, applyCardTheme, setState }
}
