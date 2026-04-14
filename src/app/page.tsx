"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useGame } from "@/hooks/useGame"
import { getEngine } from "@/lib/games"
import { getAIMove } from "@/lib/ai/basicAI"
import PlayingCard from "@/components/PlayingCard"
import type { Card, GameType } from "@/types/game"

const TARGET_OPTIONS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K"
]

const RULES: Record<GameType, string> = {
  kata:
    "Kata starts by declaring the target card. Players cut the deck and then redistribute cards from the declaring player. The first player to receive the target card wins.",
  ak47:
    "AK47 starts with four cards each. On your turn, draw from the deck or pick the top discard only if it can complete a four of a kind. Then discard one card so you end your turn with four cards. The first player to finish a turn holding four matching cards wins."
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`
}

function CardTile({
  card,
  onClick,
  disabled
}: {
  card: Card
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`w-[100px] ${onClick && !disabled ? "cursor-pointer" : ""} ${
        disabled ? "opacity-60" : ""
      }`}
      onClick={onClick}
    >
      <PlayingCard
        value={card.value}
        suit={card.suit ?? "♠"}
        imageUrl={card.imageUrl}
      />
    </motion.div>
  )
}

export default function Home() {
  const { state, start, dispatch, reset, applyCardTheme } = useGame()
  const [gameType, setGameType] = useState<GameType>("kata")
  const [playerName, setPlayerName] = useState("Player")
  const [targetCard, setTargetCard] = useState("7")
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [showRules, setShowRules] = useState(false)
  const [cutIndex, setCutIndex] = useState(0)
  const [turnSeconds, setTurnSeconds] = useState(0)
  const [statusMessage, setStatusMessage] = useState(
    "Configure the game and press Start to play."
  )
  const [customImageUrl, setCustomImageUrl] = useState("")
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/svg+xml"
    ]

    if (!allowedTypes.includes(file.type)) {
      setImageUploadError("Please upload a supported image type: PNG, JPG, WEBP, GIF, AVIF, SVG.")
      return
    }

    const url = URL.createObjectURL(file)
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl)
    }
    setFilePreviewUrl(url)
    setImageUploadError(null)
  }

  function handleApplyCardArt() {
    const imageUrl = filePreviewUrl ?? customImageUrl.trim()

    if (!imageUrl) {
      setImageUploadError("Enter an image URL or upload a supported file.")
      return
    }

    if (!state) {
      setImageUploadError("Start a game first before applying card art.")
      return
    }

    applyCardTheme(imageUrl)
    setToastMessage("Custom card art applied to all cards.")
    setImageUploadError(null)
  }

  const currentPlayer = state?.players[state.currentTurn]
  const validActions = useMemo(() => {
    if (!state || !currentPlayer) {
      return []
    }

    return getEngine(state.gameType).getValidActions(state, currentPlayer.id)
  }, [state, currentPlayer])

  const canDeclare = validActions.some((action) => action.type === "DECLARE_TARGET")
  const canCut = validActions.some((action) => action.type === "CUT")
  const canRedistribute = validActions.some((action) => action.type === "REDISTRIBUTE")
  const canDrawDeck = validActions.some(
    (action) => action.type === "DRAW_CARD" && action.payload !== "discard"
  )
  const canDrawDiscard = validActions.some(
    (action) => action.type === "DRAW_CARD" && action.payload === "discard"
  )
  const canDiscardCard = validActions.some((action) => action.type === "DISCARD_CARD")
  const hasState = Boolean(state)
  const deckSize = state?.deck.length ?? 0
  const currentHandLength = currentPlayer?.hand.length ?? 0
  const discardTop = state?.discardPile[state.discardPile.length - 1]
  const isHumanTurn = currentPlayer && !currentPlayer.isAI
  const gameTitle = gameType === "kata" ? "Kata" : "AK47"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    setTurnSeconds(0)
  }, [state?.currentTurn, state?.status])

  useEffect(() => {
    if (!state || state.status !== "playing") {
      return
    }

    if (currentPlayer?.isAI) {
      const move = getAIMove(state)
      if (!move) {
        return
      }
      const timer = setTimeout(() => dispatch(move), 700)
      return () => clearTimeout(timer)
    }
  }, [state, currentPlayer, dispatch])

  useEffect(() => {
    if (!state || state.status !== "playing") {
      return
    }

    const interval = setInterval(() => {
      setTurnSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [state?.currentTurn, state?.status])

  useEffect(() => {
    if (!state) {
      setStatusMessage("Configure the game and press Start to play.")
      return
    }

    if (state.status === "finished") {
      if (state.meta.winnerId) {
        const winner = state.players.find((player) => player.id === state.meta.winnerId)
        setStatusMessage(
          winner ? `${winner.name} wins!` : "Game finished with a winner."
        )
      } else {
        setStatusMessage("Game finished. No winner this round.")
      }
      return
    }

    setStatusMessage(
      `${currentPlayer?.name ?? "Player"}'s turn - ${gameTitle} (${formatTime(turnSeconds)})`
    )
  }, [state, currentPlayer, gameTitle, turnSeconds])

  function handleStart() {
    const players = [
      { id: "player-1", name: playerName || "Player", hand: [] },
      { id: "player-2", name: "AI", hand: [], isAI: true }
    ]

    start(gameType, players)
  }

  const safeCutIndex = deckSize > 0 ? Math.min(Math.max(cutIndex, 0), deckSize - 1) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-xl shadow-black/20 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-teal-300">Phase 2 · Game experience</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Card Platform</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Local game board with Kata and AK47 support, AI turn flow, rules modal, dark mode, and animated cards.
            </p>
          </div>

          <div className="grid gap-3 sm:auto-cols-min sm:grid-flow-col">
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:border-teal-300 hover:text-teal-300"
              onClick={() => setShowRules(true)}
            >
              Rules
            </button>
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </header>

        {toastMessage ? (
          <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100 shadow-sm">
            {toastMessage}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-lg shadow-black/20">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-slate-400">Game</label>
                <select
                  className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-300"
                  value={gameType}
                  onChange={(event) => setGameType(event.target.value as GameType)}
                  disabled={hasState}
                >
                  <option value="kata">Kata</option>
                  <option value="ak47">AK47</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Player name</label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-300"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Enter your name"
                  disabled={hasState}
                />
              </div>

              {gameType === "kata" && (
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Target card</label>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-300"
                    value={targetCard}
                    onChange={(event) => setTargetCard(event.target.value)}
                    disabled={hasState}
                  >
                    {TARGET_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleStart}
                disabled={hasState}
              >
                Start {gameTitle}
              </button>

              {hasState && (
                <button
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-5 py-3 text-sm text-slate-100 transition hover:border-rose-400"
                  onClick={() => {
                    reset()
                    setStatusMessage("Game reset. Configure a new match.")
                  }}
                >
                  Reset game
                </button>
              )}
            </div>

            <div className="rounded-3xl bg-slate-950/80 p-5">
              <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
                <span>Status</span>
                <span className="text-slate-200">{state?.status ?? "not started"}</span>
              </div>
              <p className="text-sm leading-6 text-slate-300">{statusMessage}</p>
            </div>

            <div className="rounded-3xl bg-slate-950/80 p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Turn details
              </h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-slate-100">Current player:</span>{" "}
                  {currentPlayer?.name ?? "—"}
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Turn timer:</span>{" "}
                  {formatTime(turnSeconds)}
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Deck size:</span>{" "}
                  {deckSize}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950/80 p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Card art theme
              </h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p className="text-slate-400">
                  Add a custom image URL or upload a supported image format for the current game cards.
                </p>
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(event) => setCustomImageUrl(event.target.value)}
                  placeholder="Image URL or paste external link"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-300"
                />
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/20 bg-slate-800 px-4 py-3 text-sm text-slate-100 transition hover:border-teal-300">
                  <span>Upload image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt="Card preview"
                    className="h-28 w-full rounded-3xl object-cover"
                  />
                ) : null}
                <button
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  onClick={handleApplyCardArt}
                  disabled={!state}
                >
                  Apply card art to all cards
                </button>
                {imageUploadError ? (
                  <p className="text-sm text-rose-300">{imageUploadError}</p>
                ) : null}
              </div>
            </div>
          </div>

          <main className="space-y-6">
            {hasState ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-lg shadow-black/20">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{gameTitle} Board</h2>
                    <p className="text-sm text-slate-400">{RULES[gameType]}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {gameType === "kata" ? (
                      <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
                        Kata mode
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200">
                        AK47 mode
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {gameType === "kata" ? (
                        <>
                          <div className="rounded-3xl bg-slate-950/80 p-5">
                            <p className="text-sm text-slate-400">Declare target</p>
                            <button
                              className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() => dispatch({ type: "DECLARE_TARGET", payload: targetCard })}
                              disabled={!canDeclare || !targetCard || !isHumanTurn}
                            >
                              Declare {targetCard}
                            </button>
                          </div>

                          <div className="rounded-3xl bg-slate-950/80 p-5">
                            <p className="text-sm text-slate-400">Cut deck</p>
                            <div className="mt-4 flex gap-3">
                              <input
                                type="number"
                                min={0}
                                max={Math.max(deckSize - 1, 0)}
                                value={safeCutIndex}
                                onChange={(event) => setCutIndex(Number(event.target.value))}
                                className="w-24 rounded-2xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                              />
                              <button
                                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => dispatch({ type: "CUT", payload: safeCutIndex })}
                                disabled={!canCut || !isHumanTurn}
                              >
                                Cut
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4 rounded-3xl bg-slate-950/80 p-5">
                          {currentHandLength === 4 ? (
                            <>
                              <p className="text-sm text-slate-400">Draw a card or pick the top discard</p>
                              <button
                                className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => dispatch({ type: "DRAW_CARD", payload: "deck" })}
                                disabled={!canDrawDeck || !isHumanTurn}
                              >
                                Draw from deck
                              </button>
                              <button
                                className="w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => dispatch({ type: "DRAW_CARD", payload: "discard" })}
                                disabled={!canDrawDiscard || !isHumanTurn}
                              >
                                Pick top discard
                              </button>
                            </>
                          ) : (
                            <div>
                              <p className="text-sm text-slate-400">Discard one card to complete your turn.</p>
                              <p className="mt-3 text-sm text-slate-200">
                                Click any card in your hand to discard it.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {gameType === "kata" && (
                      <div className="rounded-3xl bg-slate-950/80 p-5">
                        <p className="text-sm text-slate-400">Redistribute after cut</p>
                        <button
                          className="mt-4 w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => dispatch({ type: "REDISTRIBUTE" })}
                          disabled={!canRedistribute || !isHumanTurn}
                        >
                          Redistribute Deck
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-3xl bg-slate-950/80 p-5">
                    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Deck</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{deckSize}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Discard pile</p>
                      <p className="mt-3 text-base text-slate-200">
                        {discardTop ? `${discardTop.value} of ${discardTop.suit}` : "Empty"}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Valid action</p>
                      <p className="mt-3 text-base text-slate-200">
                        {validActions.length > 0
                          ? validActions.map((action) => action.type).join(", ")
                          : "Waiting for next turn..."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                  <h3 className="text-lg font-semibold text-white">Players</h3>
                  {state!.players.map((player) => (
                    <div key={player.id} className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{player.name}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {player.isAI ? "AI" : "Human"}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {player.hand.length} cards
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <AnimatePresence initial={false}>
                          {player.hand.map((card) => {
                            const isClickable =
                              player.id === currentPlayer?.id &&
                              canDiscardCard &&
                              isHumanTurn

                            return (
                              <CardTile
                                key={card.id}
                                card={card}
                                onClick={isClickable ? () => dispatch({ type: "DISCARD_CARD", payload: card.id }) : undefined}
                                disabled={!isClickable && player.id === currentPlayer?.id && currentHandLength === 5}
                              />
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-lg shadow-black/20">
                <h2 className="text-xl font-semibold text-white">Ready to play</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Choose a game, enter your name, and start a local match against the built-in AI.
                </p>
              </div>
            )}

            {hasState && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-lg shadow-black/20">
                <h2 className="text-xl font-semibold text-white">Deck</h2>
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {state!.deck.slice(0, 12).map((card) => (
                    <CardTile key={card.id} card={card} />
                  ))}
                </div>
              </div>
            )}
          </main>
        </section>
      </div>

      <AnimatePresence>
        {showRules && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl shadow-black/40"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Game rules</h2>
                  <p className="mt-2 text-sm text-slate-400">Quick guide for Kata and AK47.</p>
                </div>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:border-red-400"
                  onClick={() => setShowRules(false)}
                >
                  Close
                </button>
              </div>
              <div className="space-y-6 text-sm leading-7 text-slate-300">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Kata</h3>
                  <p>{RULES.kata}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">AK47</h3>
                  <p>{RULES.ak47}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
