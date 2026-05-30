import type { LolPosition } from "@/lib/utils/lol-roles";

interface RoleIconProps {
  position: LolPosition;
  size?: number;
  className?: string;
}

/**
 * League of Legends position icons (top / jungle / mid / bot / support).
 * Lanes use the minimap convention — a bold path hugging the top-left corner
 * (top), the diagonal (mid), or the bottom-right corner (bot). Jungle and
 * support get their own glyphs. Everything is currentColor so the icon inherits
 * the surrounding text colour.
 */
export function RoleIcon({ position, size = 14, className }: RoleIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };

  switch (position) {
    case "top":
      // L-bend hugging the top-left (left edge → top edge)
      return (
        <svg {...common}>
          <path d="M6 18 L6 6 L18 6" />
        </svg>
      );
    case "bot":
      // L-bend hugging the bottom-right (bottom edge → right edge)
      return (
        <svg {...common}>
          <path d="M6 18 L18 18 L18 6" />
        </svg>
      );
    case "mid":
      // bold diagonal, corner to corner
      return (
        <svg {...common}>
          <path d="M5 19 L19 5" />
        </svg>
      );
    case "jungle":
      // tree: dominant triangular canopy + short trunk
      return (
        <svg {...common} strokeWidth={1.5}>
          <path d="M12 3 L19 15 H5 Z" fill="currentColor" />
          <path d="M12 15 V20" strokeWidth={2.5} />
        </svg>
      );
    case "support":
      // bold cross / plus
      return (
        <svg {...common} strokeWidth={3}>
          <path d="M12 5 V19" />
          <path d="M5 12 H19" />
        </svg>
      );
  }
}
