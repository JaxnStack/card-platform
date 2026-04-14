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
      <div className="relative h-full">
        <div className={`absolute top-0 left-0 flex flex-col items-start gap-[2px] text-[16px] leading-[1] ${accentColor}`}>
          <span className="font-semibold">{value}</span>
          <span className="text-[14px]">{symbol}</span>
        </div>

        <div className="absolute bottom-0 right-0 rotate-180 flex flex-col items-start gap-[2px] text-[16px] leading-[1] ${accentColor}">
          <span className="font-semibold">{value}</span>
          <span className="text-[14px]">{symbol}</span>
        </div>

        <div className="absolute inset-x-0 top-[28px] bottom-[28px] flex items-center justify-center">
          <div className="h-full w-full overflow-hidden rounded-[10px] bg-slate-100 p-1">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={label}
                className="h-full w-full rounded-[8px] object-cover"
              />
            ) : (
              <span className={`text-[34px] ${accentColor}`}>{symbol}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
