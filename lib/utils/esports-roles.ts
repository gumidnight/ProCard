import type { EsportsRole } from "@/types/db";
import { ESPORTS_ROLES } from "@/lib/constants/esports-roles";

const VALID = new Set(ESPORTS_ROLES.map((r) => r.value));

/** Parse the comma-separated `esports_role` column into a list of role values. */
export function parseRoles(csv: string | null | undefined): EsportsRole[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is EsportsRole => VALID.has(s as EsportsRole));
}

/** Serialise a list of role values to a comma-separated string (or null if empty). */
export function formatRoles(roles: readonly string[]): string | null {
  const valid = roles.filter((r): r is EsportsRole => VALID.has(r as EsportsRole));
  return valid.length ? Array.from(new Set(valid)).join(",") : null;
}

export function getRoleLabel(value: string): string {
  return ESPORTS_ROLES.find((r) => r.value === value)?.label ?? value;
}
