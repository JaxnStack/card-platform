import type { GameState, GameType } from "@/types/game"

export type RoomPlayer = {
  id: string
  name: string
  joinedAt: string
  isHost: boolean
}

export type RoomStatus = "waiting" | "playing" | "finished"

export type RoomRecord = {
  id: string
  room_code: string
  name: string
  host_id: string
  game_type: GameType
  players: RoomPlayer[]
  state: GameState | null
  status: RoomStatus
  created_at: string
  updated_at: string
}

export type RoomInsert = Omit<RoomRecord, 'id' | 'created_at' | 'updated_at'>

export type RoomActionPayload =
  | {
      type: "START_GAME"
    }
  | {
      type: "GAME_ACTION"
      action: {
        type: string
        payload?: string | number
      }
    }
