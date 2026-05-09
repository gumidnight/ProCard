// Shared Riot region constants — safe to import from client components.
// (Kept in a separate file from lib/api/riot.ts so the client bundle
//  doesn't pull in server-only env config.)

export type RiotRegion =
  | "na1"
  | "euw1"
  | "eun1"
  | "kr"
  | "br1"
  | "jp1"
  | "la1"
  | "la2"
  | "oc1"
  | "tr1"
  | "ru";

export const RIOT_REGIONS: {
  value: RiotRegion;
  label: string;
  cluster: "americas" | "europe" | "asia" | "sea";
}[] = [
  { value: "euw1", label: "EUW", cluster: "europe" },
  { value: "eun1", label: "EUNE", cluster: "europe" },
  { value: "na1", label: "NA", cluster: "americas" },
  { value: "kr", label: "KR", cluster: "asia" },
  { value: "br1", label: "BR", cluster: "americas" },
  { value: "jp1", label: "JP", cluster: "asia" },
  { value: "la1", label: "LAN", cluster: "americas" },
  { value: "la2", label: "LAS", cluster: "americas" },
  { value: "oc1", label: "OCE", cluster: "sea" },
  { value: "tr1", label: "TR", cluster: "europe" },
  { value: "ru", label: "RU", cluster: "europe" },
];

export function getCluster(region: RiotRegion): string {
  return RIOT_REGIONS.find((r) => r.value === region)?.cluster ?? "americas";
}
