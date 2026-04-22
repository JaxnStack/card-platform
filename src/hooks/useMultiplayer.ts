"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createRoom, fetchRoomByCode, fetchRoomById, joinRoomByCode, leaveRoom as leaveRoomAction, subscribeRoom, buildInitialPlayer } from "@/lib/multiplayer"
import { useGame } from "@/hooks/useGame"
import type { RoomRecord, RoomPlayer } from "@/types/multiplayer"
import type { GameAction, GameState, GameType } from "@/types/game"

export function useMultiplayer() {
  const [room, setRoom] = useState<RoomRecord | null>(null)
  const [player, setPlayer] = useState<RoomPlayer | null>(null)
  const [status, setStatus] = useState<"idle" | "connected" | "connecting" | "offline">("idle")
  const [error, setError] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState("")
  const [joinRoomCode, setJoinRoomCode] = useState("")
  const [createGameType, setCreateGameType] = useState<GameType>("kata")
  const [roomName, setRoomName] = useState("Friendly Match")
  const channelRef = useRef<any>(null)
  const { setState } = useGame()

  useEffect(() => {
    const storedPlayerId = window.localStorage.getItem("card-platform-player-id")
    const storedPlayerName = window.localStorage.getItem("card-platform-player-name")

    if (storedPlayerId && storedPlayerName) {
      setPlayer({
        id: storedPlayerId,
        name: storedPlayerName,
        joinedAt: new Date().toISOString(),
        isHost: false
      })
      return
    }

    const generated = buildInitialPlayer("Guest")
    window.localStorage.setItem("card-platform-player-id", generated.id)
    window.localStorage.setItem("card-platform-player-name", generated.name)
    setPlayer(generated)
  }, [])

  useEffect(() => {
    if (!room) {
      return
    }

    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    setStatus("connecting")
    const channel = subscribeRoom(room.id, (updatedRoom) => {
      setRoom(updatedRoom)
      setState(updatedRoom.state)
      setStatus("connected")
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [room?.id, setState])

  async function handleCreateRoom() {
    if (!player) {
      setError("Missing local player identity")
      return
    }

    try {
      setError(null)
      const host = { ...player, isHost: true }
      const createdRoom = await createRoom(roomName, createGameType, host)
      setRoom(createdRoom)
      setRoomCode(createdRoom.room_code)
      setPlayer(host)
      setStatus("connected")
    } catch (err) {
      setError((err as Error).message)
      setStatus("offline")
    }
  }

  async function handleJoinRoom() {
    if (!player) {
      setError("Missing local player identity")
      return
    }

    try {
      setError(null)
      const joinedRoom = await joinRoomByCode(joinRoomCode.toUpperCase(), { ...player, isHost: false })
      setRoom(joinedRoom)
      setRoomCode(joinedRoom.room_code)
      setStatus("connected")
      setPlayer((current) =>
        current ? { ...current, name: current.name, isHost: false } : { ...player, isHost: false }
      )
      setState(joinedRoom.state)
    } catch (err) {
      setError((err as Error).message)
      setStatus("offline")
    }
  }

  async function handleLeaveRoom() {
    if (!room || !player) {
      return
    }

    try {
      await leaveRoomAction(room.id, player.id)
      setRoom(null)
      setRoomCode("")
      setStatus("idle")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function startRoomGame() {
    if (!room || !player) {
      return
    }

    setStatus("connecting")
    const response = await fetch("/api/room/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: room.id,
        playerId: player.id,
        payload: { type: "START_GAME" }
      })
    })

    const result = await response.json()
    if (!response.ok) {
      setError(result.error || "Unable to start game")
      setStatus("offline")
      return
    }

    setRoom(result.room)
    setState(result.room.state)
    setStatus("connected")
  }

  async function performAction(action: GameAction) {
    if (!room || !player) {
      throw new Error("Not connected to a room")
    }

    const response = await fetch("/api/room/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: room.id,
        playerId: player.id,
        payload: {
          type: "GAME_ACTION",
          action
        }
      })
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || "Action failed")
    }

    setRoom(result.room)
    setState(result.room.state)
  }

  function updatePlayerName(name: string) {
    if (!player) {
      return
    }

    const updatedPlayer = { ...player, name }
    setPlayer(updatedPlayer)
    window.localStorage.setItem("card-platform-player-name", name)

    if (room) {
      setRoom({
        ...room,
        players: room.players.map((member) =>
          member.id === player.id ? { ...member, name } : member
        )
      })
    }
  }

  const connectedPlayers = useMemo(() => room?.players ?? [], [room])

  return {
    room,
    player,
    roomCode,
    roomName,
    createGameType,
    joinRoomCode,
    status,
    error,
    connectedPlayers,
    setRoomName,
    setCreateGameType,
    setJoinRoomCode,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
    startRoomGame,
    performAction,
    updatePlayerName
  }
}
