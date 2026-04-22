import { supabase } from "@/lib/supabaseClient"
import { getEngine } from "@/lib/games"
import type { GameAction, GameState, GameType } from "@/types/game"
import type { RoomPlayer, RoomRecord, RoomInsert } from "@/types/multiplayer"

export function buildRoomCode() {
  return Array.from({ length: 6 }, () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return chars[Math.floor(Math.random() * chars.length)]
  }).join("")
}

export async function createRoom(roomName: string, gameType: GameType, host: RoomPlayer) {
  const roomCode = buildRoomCode()
  const { data, error } = await supabase
    .from("rooms")
    .insert([
      {
        room_code: roomCode,
        name: roomName,
        game_type: gameType,
        host_id: host.id,
        players: [host],
        state: null,
        status: "waiting"
      }
    ])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function fetchRoomByCode(roomCode: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("room_code", roomCode)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function fetchRoomById(roomId: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function joinRoomByCode(roomCode: string, player: RoomPlayer) {
  const room = await fetchRoomByCode(roomCode)
  if (!room) {
    throw new Error("Room not found")
  }

  if (room.players.some((member: RoomPlayer) => member.id === player.id)) {
    return room
  }

  const players = [...room.players, player]
  const { data, error } = await supabase
    .from("rooms")
    .update({ players, updated_at: new Date().toISOString() })
    .eq("id", room.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateRoomPlayers(roomId: string, players: RoomPlayer[]) {
  const { data, error } = await supabase
    .from("rooms")
    .update({ players, updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export function subscribeRoom(roomId: string, callback: (room: RoomRecord) => void) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
      (payload) => {
        if (payload.new) {
          callback(payload.new as RoomRecord)
        }
      }
    )
    .subscribe()

  return channel
}

export async function leaveRoom(roomId: string, playerId: string) {
  const room = await fetchRoomById(roomId)
  if (!room) {
    throw new Error("Room not found")
  }

  const players = room.players.filter((player: RoomPlayer) => player.id !== playerId)
  const status = players.length === 0 ? "finished" : room.status
  const { data, error } = await supabase
    .from("rooms")
    .update({ players, status, updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export function buildInitialPlayer(name: string, isHost = false): RoomPlayer {
  return {
    id: crypto.randomUUID(),
    name,
    joinedAt: new Date().toISOString(),
    isHost
  }
}
