type PlayingCardProps = {
  value: string
  suit: string
  imageUrl?: string
  className?: string
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
  "♥": "♥",
  "♦": "♦",
  "♣": "♣",
  "♠": "♠"
}

const isRedSuit = (suit: string) => {
  return suit === "♥" || suit === "♦" || suit === "hearts" || suit === "diamonds"
}

export default function PlayingCard({ value, suit, imageUrl, className = "" }: PlayingCardProps) {
  const symbol = SUIT_SYMBOLS[suit] ?? "♠"
  const accentColor = isRedSuit(suit) ? "text-rose-600" : "text-slate-950"
  const label = `${value} of ${symbol}`

  return (
    <div
      className={`relative overflow-hidden rounded-[12px] border border-slate-200/20 bg-white shadow-[0_18px_45px_-22px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] ${className}`}
      style={{ width: "100px", aspectRatio: "2.5 / 3.5", padding: "10px" }}
    >
      <div className="relative flex h-full flex-col">
        <div className="absolute top-[8px] left-[8px] flex flex-col items-start gap-[2px] text-[16px] leading-[1]">
          <span className={`font-semibold ${accentColor}`}>{value}</span>
          <span className={`text-[14px] ${accentColor}`}>{symbol}</span>
        </div>

        <div className="absolute bottom-[8px] right-[8px] rotate-180 flex flex-col items-start gap-[2px] text-[16px] leading-[1]">
          <span className={`font-semibold ${accentColor}`}>{value}</span>
          <span className={`text-[14px] ${accentColor}`}>{symbol}</span>
        </div>

        <div className="mt-auto mb-auto flex h-[80%] w-full items-center justify-center overflow-hidden rounded-[10px] bg-slate-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className={`text-[34px] ${accentColor}`}>{symbol}</span>
          )}
        </div>
      </div>
    </div>
  )
}
