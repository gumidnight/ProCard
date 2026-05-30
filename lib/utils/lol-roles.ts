// ---------------------------------------------------------------------------
// Map a free-text team-history role to a canonical League of Legends position.
// Roles are entered by hand or imported from Leaguepedia ("Top", "Jungle", …),
// so we normalise loosely and tolerate synonyms.
// ---------------------------------------------------------------------------

export type LolPosition = "top" | "jungle" | "mid" | "bot" | "support";

export function lolPosition(role: string | null | undefined): LolPosition | null {
  if (!role) return null;
  const r = role.toLowerCase();

  // Order matters: check the more specific / collision-prone terms first.
  if (r.includes("jungl") || /\bjgl?\b/.test(r)) return "jungle";
  if (r.includes("support") || r.includes("sup") || r.includes("util")) return "support";
  if (
    r.includes("adc") ||
    r.includes("marksman") ||
    r.includes("ad carry") ||
    r.includes("bot") ||
    r.includes("bottom")
  )
    return "bot";
  if (r.includes("mid") || r.includes("middle")) return "mid";
  if (r.includes("top")) return "top";

  return null;
}
