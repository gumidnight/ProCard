// ---------------------------------------------------------------------------
// Rank tier → colour mapping
// ---------------------------------------------------------------------------

const RANK_COLOURS: Record<string, string> = {
  // LoL / General
  IRON: "var(--rank-iron)",
  BRONZE: "var(--rank-bronze)",
  SILVER: "var(--rank-silver)",
  GOLD: "var(--rank-gold)",
  PLATINUM: "var(--rank-platinum)",
  EMERALD: "var(--rank-emerald)",
  DIAMOND: "var(--rank-diamond)",
  MASTER: "var(--rank-master)",
  GRANDMASTER: "var(--rank-grandmaster)",
  CHALLENGER: "var(--rank-challenger)",

  // Valorant
  IMMORTAL: "var(--rank-immortal)",
  RADIANT: "var(--rank-radiant)",
  ASCENDANT: "var(--rank-emerald)",

  // CS2 / Faceit
  "GLOBAL ELITE": "var(--rank-global)",
  FACEIT_10: "var(--rank-challenger)",
  FACEIT_9: "var(--rank-grandmaster)",
  FACEIT_8: "var(--rank-master)",
  FACEIT_7: "var(--rank-diamond)",
  FACEIT_6: "var(--rank-emerald)",
  FACEIT_5: "var(--rank-platinum)",
  FACEIT_4: "var(--rank-gold)",
  FACEIT_3: "var(--rank-silver)",
  FACEIT_2: "var(--rank-bronze)",
  FACEIT_1: "var(--rank-bronze)",
};

export function getRankColour(tier: string | null): string {
  if (!tier) return "var(--rank-silver)";
  const key = tier.toUpperCase().trim();
  return RANK_COLOURS[key] ?? "var(--rank-silver)";
}

// Raw hex values for inline styles that need alpha manipulation (e.g. tinting)
const RANK_HEX: Record<string, string> = {
  IRON: "#8a8a8a",
  BRONZE: "#BA7517",
  SILVER: "#888799",
  GOLD: "#C9A227",
  PLATINUM: "#0F8A6A",
  EMERALD: "#1AAD8A",
  DIAMOND: "#2A7FBF",
  MASTER: "#9D48E0",
  GRANDMASTER: "#C93030",
  CHALLENGER: "#E8B84B",
  IMMORTAL: "#9D48E0",
  RADIANT: "#E8B84B",
  ASCENDANT: "#1AAD8A",
  "GLOBAL ELITE": "#E8B84B",
};

export function getRankHex(tier: string | null): string {
  if (!tier) return "#888799";
  const key = tier.toUpperCase().trim();
  // Handle FACEIT_ levels
  if (key.startsWith("FACEIT_")) {
    const level = parseInt(key.replace("FACEIT_", ""), 10);
    if (level >= 10) return RANK_HEX.CHALLENGER;
    if (level >= 9) return RANK_HEX.GRANDMASTER;
    if (level >= 8) return RANK_HEX.MASTER;
    if (level >= 7) return RANK_HEX.DIAMOND;
    if (level >= 6) return RANK_HEX.EMERALD;
    if (level >= 5) return RANK_HEX.PLATINUM;
    if (level >= 4) return RANK_HEX.GOLD;
    if (level >= 3) return RANK_HEX.SILVER;
    return RANK_HEX.BRONZE;
  }
  return RANK_HEX[key] ?? "#888799";
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
