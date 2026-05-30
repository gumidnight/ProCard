import Image from "next/image";

interface GameLogoProps {
  game: string;
  size?: number;
  className?: string;
}

const LOGO_SRC: Record<string, string> = {
  lol: "/games/lol.svg",
  valorant: "/games/valorant.svg",
  cs2: "/games/cs2.svg",
};

const TEXT_BADGE: Record<string, string> = {
  tft: "TFT",
};

export function GameLogo({ game, size = 36, className }: GameLogoProps) {
  const src = LOGO_SRC[game];
  if (!src) {
    const label = TEXT_BADGE[game];
    return (
      <div
        className={`flex items-center justify-center rounded font-mono font-bold uppercase tracking-tight text-text-secondary bg-surface-2 ${className ?? ""}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(7, Math.round(size * 0.35)),
        }}
      >
        {label ?? game.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={`${game} logo`}
      width={size}
      height={size}
      className={className}
      priority={false}
    />
  );
}
