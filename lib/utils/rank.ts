// ---------------------------------------------------------------------------
// Rank tier → colour mapping
// ---------------------------------------------------------------------------

const RANK_COLOURS: Record<string, string> = {
  // LoL / General
  IRON: "#ba7517",
  BRONZE: "#ba7517",
  SILVER: "#888799",
  GOLD: "#c9a227",
  PLATINUM: "#0f8a6a",
  EMERALD: "#1aad8a",
  DIAMOND: "#2a7fbf",
  MASTER: "#9d48e0",
  GRANDMASTER: "#c93030",
  CHALLENGER: "#d4af37",

  // Valorant
  IMMORTAL: "#9d48e0",
  RADIANT: "#e8b84b",
  ASCENDANT: "#1aad8a",

  // CS2 / Faceit
  "GLOBAL ELITE": "#d4af37",
  FACEIT_10: "#d4af37",
  FACEIT_9: "#c93030",
  FACEIT_8: "#9d48e0",
  FACEIT_7: "#2a7fbf",
  FACEIT_6: "#1aad8a",
  FACEIT_5: "#0f8a6a",
  FACEIT_4: "#c9a227",
  FACEIT_3: "#888799",
  FACEIT_2: "#ba7517",
  FACEIT_1: "#ba7517",
};

export function getRankColour(tier: string | null): string {
  if (!tier) return "#888799";
  const key = tier.toUpperCase().trim();
  return RANK_COLOURS[key] ?? "#888799";
}

/**
 * Format a rank display string.
 * e.g. "DIAMOND" + "II" → "Diamond II"
 *      "IMMORTAL" + null → "Immortal"
 */
export function formatRankDisplay(
  tier: string | null,
  division: string | null,
): string {
  if (!tier) return "Unranked";
  const formatted =
    tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  if (division) return `${formatted} ${division}`;
  return formatted;
}

/**
 * Format LP / RR / ELO with label.
 */
export function formatLpRr(
  value: number | null,
  game: string,
): string {
  if (value === null || value === undefined) return "";
  if (game === "lol") return `${value.toLocaleString()} LP`;
  if (game === "valorant") return `${value} RR`;
  if (game === "cs2") return `${value.toLocaleString()} ELO`;
  return `${value}`;
}

/**
 * Get Faceit level label.
 */
export function getFaceitLabel(skillLevel: number | null): string {
  if (!skillLevel) return "Unranked";
  return `Level ${skillLevel}`;
}

/**
 * Format "last refreshed" as relative time.
 */
export function formatLastRefreshed(timestamp: number | null): string {
  if (!timestamp) return "Never refreshed";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "Updated just now";
  if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Updated ${Math.floor(diff / 3600)}h ago`;
  return `Updated ${Math.floor(diff / 86400)}d ago`;
}
