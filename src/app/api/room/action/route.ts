import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { getEngine } from "@/lib/games"
import type { GameAction } from "@/types/game"
import type { RoomActionPayload, RoomRecord } from "@/types/multiplayer"

export async function POST(request: Request) {
  const body = await request.json()
  const { roomId, playerId, payload }: { roomId: string; playerId: string; payload: RoomActionPayload } = body

  if (!roomId || !playerId || !payload) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data: room, error: fetchError } = await supabaseServer
    .from<RoomRecord>("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle()

  if (fetchError || !room) {
    return NextResponse.json({ error: fetchError?.message ?? "Room not found" }, { status: 404 })
  }

  const player = room.players.find((member) => member.id === playerId)
  if (!player) {
    return NextResponse.json({ error: "Player is not part of this room" }, { status: 403 })
  }

  if (payload.type === "START_GAME") {
    if (room.host_id !== playerId) {
      return NextResponse.json({ error: "Only the host can start the game" }, { status: 403 })
    }

    if (room.players.length < 2) {
      return NextResponse.json({ error: "At least two players are required to start" }, { status: 400 })
    }

    const engine = getEngine(room.game_type)
    const initialGameState = engine.createGame(
      room.players.map((member) => ({ id: member.id, name: member.name, hand: [] }))
    )

    const { data: updatedRoom, error: updateError } = await supabaseServer
      .from<RoomRecord>("rooms")
      .update({
        state: initialGameState,
        status: "playing",
        updated_at: new Date().toISOString()
      })
      .eq("id", room.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ room: updatedRoom })
  }

  if (!room.state) {
    return NextResponse.json({ error: "Game has not started yet" }, { status: 400 })
  }

  const engine = getEngine(room.game_type)
  const playerMatchesTurn = room.state.players[room.state.currentTurn]?.id === playerId
  if (!playerMatchesTurn) {
    return NextResponse.json({ error: "Not your turn" }, { status: 403 })
  }

  const validActions = engine.getValidActions(room.state, playerId)
  const action = payload.type === "GAME_ACTION" ? (payload.action as GameAction) : null

  if (!action || !validActions.some((valid) => valid.type === action.type && valid.payload === action.payload)) {
    return NextResponse.json({ error: "Invalid action for current game state" }, { status: 400 })
  }

  const nextState = engine.dispatch(room.state, action)
  if (nextState === room.state) {
    return NextResponse.json({ error: "Action did not change game state" }, { status: 400 })
  }

  const { data: updatedRoom, error: updateError } = await supabaseServer
    .from<RoomRecord>("rooms")
    .update({
      state: nextState,
      status: nextState.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", room.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ room: updatedRoom })
}
