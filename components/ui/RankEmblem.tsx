"use client";

import { useId } from "react";
import Image from "next/image";
import { getRankHex } from "@/lib/utils/rank";
import { withAlpha } from "@/lib/utils/color";

interface RankEmblemProps {
  tier: string | null;
  skillLevel?: number | null;
  game: string;
  size?: number;
  className?: string;
}

// Official Riot ranked emblems (CommunityDragon CDN, mirrored locally)
const LOL_EMBLEMS: Record<string, string> = {
  IRON: "/ranks/lol/iron.png",
  BRONZE: "/ranks/lol/bronze.png",
  SILVER: "/ranks/lol/silver.png",
  GOLD: "/ranks/lol/gold.png",
  PLATINUM: "/ranks/lol/platinum.png",
  EMERALD: "/ranks/lol/emerald.png",
  DIAMOND: "/ranks/lol/diamond.png",
  MASTER: "/ranks/lol/master.png",
  GRANDMASTER: "/ranks/lol/grandmaster.png",
  CHALLENGER: "/ranks/lol/challenger.png",
};

/**
 * Tier-specific rank emblem.
 * - League of Legends: uses official Riot ranked emblem PNGs
 * - Valorant / CS2: custom stylised SVG silhouettes
 * High tiers (Diamond+) get an animated pulsing halo.
 */
export function RankEmblem({
  tier,
  skillLevel,
  game,
  size = 56,
  className,
}: RankEmblemProps) {
  const reactId = useId().replace(/:/g, "");
  const uid = reactId;

  const key = game === "cs2" && skillLevel ? `FACEIT_${skillLevel}` : tier;
  const hex = getRankHex(key ?? null);
  const isElite = isEliteTier(key, skillLevel);

  // TFT uses the same rank names as LoL — reuse the same emblem PNGs
  const lolEmblem =
    (game === "lol" || game === "tft") && tier ? LOL_EMBLEMS[tier.toUpperCase()] : null;
  if (lolEmblem) {
    // PNGs are 16:9 with the emblem centered and a lot of empty
    // padding. Scale ~2.5x and let the wider sides be clipped so
    // the actual emblem fills the visible square.
    const renderWidth = Math.round(size * 3.2);
    const renderHeight = Math.round(renderWidth * (720 / 1280));
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          filter: isElite
            ? `drop-shadow(0 0 8px ${withAlpha(hex, 0.65)})`
            : `drop-shadow(0 0 4px ${withAlpha(hex, 0.35)})`,
        }}
      >
        <Image
          src={lolEmblem}
          alt={`${tier} rank emblem`}
          width={renderWidth}
          height={renderHeight}
          style={{ maxWidth: "none", objectFit: "contain" }}
          className={isElite ? "animate-pulse-slow" : ""}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        filter: isElite
          ? `drop-shadow(0 0 6px ${withAlpha(hex, 0.55)})`
          : `drop-shadow(0 0 3px ${withAlpha(hex, 0.25)})`,
      }}
    >
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        <defs>
          <linearGradient
            id={`grad-${uid}`}
            x1="0"
            y1="0"
            x2="0"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={lighten(hex, 0.35)} />
            <stop offset="0.5" stopColor={hex} />
            <stop offset="1" stopColor={darken(hex, 0.25)} />
          </linearGradient>
          <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient
            id={`glow-${uid}`}
            cx="32"
            cy="32"
            r="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={withAlpha(hex, 0.55)} />
            <stop offset="1" stopColor={withAlpha(hex, 0)} />
          </radialGradient>
        </defs>

        <circle cx="32" cy="32" r="26" fill={`url(#glow-${uid})`}>
          {isElite && (
            <animate
              attributeName="r"
              values="22;28;22"
              dur="2.6s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        <TierShape
          tierKey={key}
          skillLevel={skillLevel}
          gradUrl={`url(#grad-${uid})`}
          shineUrl={`url(#shine-${uid})`}
          hex={hex}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier shape selector
// ---------------------------------------------------------------------------

interface TierShapeProps {
  tierKey: string | null;
  skillLevel?: number | null;
  gradUrl: string;
  shineUrl: string;
  hex: string;
}

function TierShape({ tierKey, skillLevel, gradUrl, shineUrl, hex }: TierShapeProps) {
  const upper = (tierKey ?? "").toUpperCase();
  const darkHex = darken(hex, 0.5);
  const lightHex = lighten(hex, 0.5);

  // CS2 / Faceit hex badge
  if (upper.startsWith("FACEIT_")) {
    return (
      <g>
        <path
          d="M32 8 L52 20 V44 L32 56 L12 44 V20 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1.5"
        />
        <path d="M32 8 L52 20 V44 L32 56 L12 44 V20 Z" fill={shineUrl} opacity="0.6" />
        <text
          x="32"
          y="40"
          textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontWeight="900"
          fontSize="22"
          fill={lightHex}
        >
          {skillLevel ?? "?"}
        </text>
      </g>
    );
  }

  // Crown-style top tiers: Challenger / Radiant / Global Elite
  if (["CHALLENGER", "RADIANT", "GLOBAL ELITE"].includes(upper)) {
    return (
      <g>
        <path
          d="M14 38 Q 8 30 12 22 Q 18 24 20 30 Q 18 36 14 38 Z"
          fill={hex}
          opacity="0.55"
        />
        <path
          d="M50 38 Q 56 30 52 22 Q 46 24 44 30 Q 46 36 50 38 Z"
          fill={hex}
          opacity="0.55"
        />
        <path
          d="M16 28 L22 18 L26 26 L32 14 L38 26 L42 18 L48 28 L48 44 L16 44 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M16 28 L22 18 L26 26 L32 14 L38 26 L42 18 L48 28 L48 36 L16 36 Z"
          fill={shineUrl}
          opacity="0.7"
        />
        <circle cx="22" cy="22" r="2" fill={lightHex} />
        <circle cx="32" cy="20" r="2.5" fill={lightHex} />
        <circle cx="42" cy="22" r="2" fill={lightHex} />
        <rect x="16" y="44" width="32" height="6" rx="1" fill={darkHex} />
        <rect x="18" y="46" width="28" height="2" fill={lightHex} opacity="0.4" />
      </g>
    );
  }

  // Master / Grandmaster / Immortal — crowned diamond gem
  if (["MASTER", "GRANDMASTER", "IMMORTAL"].includes(upper)) {
    return (
      <g>
        <path
          d="M22 16 L26 10 L32 14 L38 10 L42 16 L42 22 L22 22 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1.2"
        />
        <circle cx="32" cy="13" r="1.5" fill={lightHex} />
        <path
          d="M32 22 L48 32 L32 54 L16 32 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1.5"
        />
        <path
          d="M32 22 L24 32 L32 54"
          fill="none"
          stroke={lightHex}
          strokeWidth="0.8"
          opacity="0.5"
        />
        <path
          d="M32 22 L40 32 L32 54"
          fill="none"
          stroke={lightHex}
          strokeWidth="0.8"
          opacity="0.5"
        />
        <path
          d="M16 32 L48 32"
          fill="none"
          stroke={darkHex}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <path d="M32 22 L40 32 L32 38 L24 32 Z" fill={shineUrl} opacity="0.7" />
      </g>
    );
  }

  // Diamond — clean angular gem
  if (upper === "DIAMOND") {
    return (
      <g>
        <path
          d="M32 10 L52 32 L32 54 L12 32 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1.5"
        />
        <path d="M32 10 L32 54" stroke={darkHex} strokeWidth="0.8" opacity="0.5" />
        <path d="M12 32 L52 32" stroke={darkHex} strokeWidth="0.8" opacity="0.5" />
        <path
          d="M32 10 L22 32 L32 54"
          fill="none"
          stroke={lightHex}
          strokeWidth="0.6"
          opacity="0.4"
        />
        <path
          d="M32 10 L42 32 L32 54"
          fill="none"
          stroke={lightHex}
          strokeWidth="0.6"
          opacity="0.4"
        />
        <path d="M32 10 L42 22 L32 30 L22 22 Z" fill={shineUrl} opacity="0.8" />
      </g>
    );
  }

  // Emerald / Ascendant — hexagonal cut gem
  if (upper === "EMERALD" || upper === "ASCENDANT") {
    return (
      <g>
        <path
          d="M22 12 L42 12 L54 32 L42 52 L22 52 L10 32 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1.5"
        />
        <path
          d="M26 18 L38 18 L46 32 L38 46 L26 46 L18 32 Z"
          fill="none"
          stroke={lightHex}
          strokeWidth="0.6"
          opacity="0.5"
        />
        <path
          d="M30 24 L34 24 L40 32 L34 40 L30 40 L24 32 Z"
          fill="none"
          stroke={lightHex}
          strokeWidth="0.6"
          opacity="0.4"
        />
        <path d="M22 12 L42 12 L46 18 L18 18 Z" fill={shineUrl} opacity="0.6" />
      </g>
    );
  }

  // Platinum — shield with double chevron + small crown notch
  if (upper === "PLATINUM") {
    return (
      <g>
        <path
          d="M32 8 L52 14 V32 C52 44 43 52 32 56 C21 52 12 44 12 32 V14 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1.5"
        />
        <path
          d="M32 8 L52 14 V28 C42 30 22 30 12 28 V14 Z"
          fill={shineUrl}
          opacity="0.7"
        />
        <path d="M26 14 L29 10 L32 14 L35 10 L38 14 Z" fill={lightHex} opacity="0.85" />
        <path d="M18 30 L32 40 L46 30 L32 34 Z" fill={lightHex} opacity="0.9" />
        <path d="M22 40 L32 47 L42 40 L32 43 Z" fill={lightHex} opacity="0.75" />
      </g>
    );
  }

  // Gold — shield with V-chevron + crown spikes
  if (upper === "GOLD") {
    return (
      <g>
        <path
          d="M32 8 L52 14 V32 C52 44 43 52 32 56 C21 52 12 44 12 32 V14 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1.5"
        />
        <path
          d="M20 12 L24 6 L28 12 L32 4 L36 12 L40 6 L44 12 Z"
          fill={gradUrl}
          stroke={darkHex}
          strokeWidth="1"
        />
        <path
          d="M32 8 L52 14 V26 C42 28 22 28 12 26 V14 Z"
          fill={shineUrl}
          opacity="0.7"
        />
        <path d="M20 28 L32 44 L44 28 L32 36 Z" fill={lightHex} opacity="0.9" />
        <circle cx="32" cy="24" r="2.5" fill={lightHex} />
      </g>
    );
  }

  // Iron / Bronze / Silver — simple shield with chevron
  return (
    <g>
      <path
        d="M32 10 L50 16 V32 C50 43 42 51 32 54 C22 51 14 43 14 32 V16 Z"
        fill={gradUrl}
        stroke={darkHex}
        strokeWidth="1.5"
      />
      <path
        d="M32 10 L50 16 V28 C40 30 24 30 14 28 V16 Z"
        fill={shineUrl}
        opacity="0.6"
      />
      <path d="M20 30 L32 42 L44 30 L32 35 Z" fill={lightHex} opacity="0.85" />
      <circle cx="18" cy="20" r="1.5" fill={darkHex} />
      <circle cx="46" cy="20" r="1.5" fill={darkHex} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isEliteTier(key: string | null, skillLevel?: number | null): boolean {
  if (skillLevel && skillLevel >= 8) return true;
  if (!key) return false;
  const upper = key.toUpperCase();
  return [
    "DIAMOND",
    "MASTER",
    "GRANDMASTER",
    "CHALLENGER",
    "IMMORTAL",
    "RADIANT",
    "ASCENDANT",
    "GLOBAL ELITE",
  ].includes(upper);
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function darken(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
