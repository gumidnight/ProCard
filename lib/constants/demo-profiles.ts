import type {
  GameConnectionRow,
  ProfileRow,
  ProfileStatus,
  RolePlayedRow,
  SocialLinkRow,
  TeamHistoryRow,
} from "@/types/db";

export interface DemoProfileBundle {
  profile: ProfileRow;
  connections: GameConnectionRow[];
  socials: SocialLinkRow[];
  teamHistory: TeamHistoryRow[];
  rolesPlayed: RolePlayedRow[];
  avatarUrl: string | null;
}

const NOW = Math.floor(Date.now() / 1000);
const RECENT = NOW - 240; // 4 minutes ago

function makeProfile(p: {
  id: string;
  slug: string;
  display_name: string;
  country: string | null;
  tagline: string | null;
  bio: string | null;
  esports_role: ProfileRow["esports_role"];
  status: ProfileStatus;
  current_team_name?: string | null;
  current_team_logo_url?: string | null;
  current_league?: string | null;
  current_role?: string | null;
  current_game?: string | null;
  is_verified?: number;
  banner_key?: string | null;
  background_type?: ProfileRow["background_type"];
  background_preset?: string | null;
}): ProfileRow {
  return {
    id: p.id,
    user_id: p.id,
    slug: p.slug,
    display_name: p.display_name,
    country: p.country,
    tagline: p.tagline,
    bio: p.bio,
    avatar_key: null,
    status: p.status,
    status_note: null,
    current_team_name: p.current_team_name ?? null,
    current_team_logo_url: p.current_team_logo_url ?? null,
    current_league: p.current_league ?? null,
    current_role: p.current_role ?? null,
    current_game: p.current_game ?? null,
    esports_role: p.esports_role,
    is_verified: p.is_verified ?? 0,
    is_pro: 0,
    banner_key: p.banner_key ?? null,
    background_type: p.background_type ?? "default",
    background_preset: p.background_preset ?? null,
    background_key: null,
    region: null,
    is_published: 1,
    published_at: NOW,
    created_at: NOW,
    updated_at: NOW,
  };
}

function makeRiotConnection(c: {
  id: string;
  profile_id: string;
  game: "lol" | "valorant";
  account_name: string;
  rank_tier: string;
  rank_division: string | null;
  lp_rr: number | null;
  region: string;
}): GameConnectionRow {
  return {
    id: c.id,
    profile_id: c.profile_id,
    game: c.game,
    puuid: null,
    account_name: c.account_name,
    summoner_id: null,
    riot_access_token: null,
    riot_refresh_token: null,
    riot_token_expires_at: null,
    faceit_player_id: null,
    faceit_nickname: null,
    rank_tier: c.rank_tier,
    rank_division: c.rank_division,
    lp_rr: c.lp_rr,
    skill_level: null,
    peak_rank_tier: null,
    peak_rank_division: null,
    region: c.region,
    queue_type: c.game === "lol" ? "RANKED_SOLO_5x5" : "competitive",
    is_visible: 1,
    last_refreshed_at: RECENT,
    created_at: NOW,
    updated_at: NOW,
  };
}

function makeFaceitConnection(c: {
  id: string;
  profile_id: string;
  faceit_nickname: string;
  skill_level: number;
  region: string;
}): GameConnectionRow {
  return {
    id: c.id,
    profile_id: c.profile_id,
    game: "cs2",
    puuid: null,
    account_name: null,
    summoner_id: null,
    riot_access_token: null,
    riot_refresh_token: null,
    riot_token_expires_at: null,
    faceit_player_id: null,
    faceit_nickname: c.faceit_nickname,
    rank_tier: null,
    rank_division: null,
    lp_rr: null,
    skill_level: c.skill_level,
    peak_rank_tier: null,
    peak_rank_division: null,
    region: c.region,
    queue_type: "premier",
    is_visible: 1,
    last_refreshed_at: RECENT,
    created_at: NOW,
    updated_at: NOW,
  };
}

function makeSocial(s: {
  id: string;
  profile_id: string;
  platform: SocialLinkRow["platform"];
  handle_or_url: string;
  display_order: number;
}): SocialLinkRow {
  return { ...s, created_at: NOW };
}

function makeTeamHistory(t: {
  id: string;
  profile_id: string;
  org_name: string;
  tournament_name: string | null;
  org_logo_url: string | null;
  role: string | null;
  game: string;
  start_date: string | null;
  end_date: string | null;
  result_note: string | null;
  display_order: number;
}): TeamHistoryRow {
  return { ...t, created_at: NOW };
}

function makeRole(r: {
  profile_id: string;
  game: string;
  role: string;
  is_main?: number;
  display_order?: number;
}): RolePlayedRow {
  return {
    id: `${r.profile_id}-${r.game}-${r.role}`,
    profile_id: r.profile_id,
    game: r.game,
    role: r.role,
    is_main: r.is_main ?? 1,
    display_order: r.display_order ?? 0,
  };
}

// ---------------------------------------------------------------
// Hero demo profile
// ---------------------------------------------------------------
export const HERO_DEMO: DemoProfileBundle = {
  profile: makeProfile({
    id: "demo-hero",
    slug: "faker",
    display_name: "FAKER",
    country: "KR",
    tagline: "Hide on bush#KR1",
    bio: "Mid laner for T1. World champion.",
    esports_role: "player",
    status: "on_team",
    current_team_name: "T1",
    current_team_logo_url:
      "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/38786c61-a739-4de6-bf76-da0b1ada05d7/T1+red.png?format=1500w",
    current_league: "LCK",
    current_role: "Mid",
    current_game: "lol",
    is_verified: 1,
    banner_key: "/brand/backgrounds/banner-demo.svg",
    background_type: "preset",
    background_preset: "branded-grid",
  }),
  connections: [
    makeRiotConnection({
      id: "demo-hero-c1",
      profile_id: "demo-hero",
      game: "lol",
      account_name: "Hide on bush#KR1",
      rank_tier: "CHALLENGER",
      rank_division: null,
      lp_rr: 1247,
      region: "kr",
    }),
  ],
  socials: [
    makeSocial({
      id: "demo-hero-s1",
      profile_id: "demo-hero",
      platform: "twitch",
      handle_or_url: "faker",
      display_order: 0,
    }),
    makeSocial({
      id: "demo-hero-s2",
      profile_id: "demo-hero",
      platform: "twitter",
      handle_or_url: "@faker",
      display_order: 1,
    }),
  ],
  teamHistory: [
    makeTeamHistory({
      id: "demo-hero-th1",
      profile_id: "demo-hero",
      org_name: "T1",
      tournament_name: "Worlds 2023 — Champion",
      org_logo_url:
        "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/38786c61-a739-4de6-bf76-da0b1ada05d7/T1+red.png?format=1500w",
      role: "Mid",
      game: "lol",
      start_date: "2013",
      end_date: null,
      result_note: "4× World Champion · 2× MSI Champion · 10× LCK Champion",
      display_order: 0,
    }),
    makeTeamHistory({
      id: "demo-hero-th2",
      profile_id: "demo-hero",
      org_name: "T1",
      tournament_name: "LCK Spring 2024 — Champion",
      org_logo_url:
        "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/38786c61-a739-4de6-bf76-da0b1ada05d7/T1+red.png?format=1500w",
      role: "Mid",
      game: "lol",
      start_date: "2024-01",
      end_date: "2024-04",
      result_note: "1st place · MVP candidate",
      display_order: 1,
    }),
    makeTeamHistory({
      id: "demo-hero-th3",
      profile_id: "demo-hero",
      org_name: "T1",
      tournament_name: "Worlds 2016 — Champion",
      org_logo_url:
        "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/38786c61-a739-4de6-bf76-da0b1ada05d7/T1+red.png?format=1500w",
      role: "Mid",
      game: "lol",
      start_date: "2016",
      end_date: "2016",
      result_note: "Finals MVP",
      display_order: 2,
    }),
  ],
  rolesPlayed: [makeRole({ profile_id: "demo-hero", game: "lol", role: "Mid" })],
  avatarUrl:
    "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/6631.jpg",
};

// ---------------------------------------------------------------
// Gallery — six varied profiles
// ---------------------------------------------------------------
export const GALLERY_DEMOS: DemoProfileBundle[] = [
  // 1. LoL player, Diamond, open
  {
    profile: makeProfile({
      id: "demo-g1",
      slug: "kairos",
      display_name: "KAIROS",
      country: "DE",
      tagline: "kairos#EUW",
      bio: null,
      esports_role: "player",
      status: "open",
      background_type: "preset",
      background_preset: "grid",
    }),
    connections: [
      makeRiotConnection({
        id: "demo-g1-c1",
        profile_id: "demo-g1",
        game: "lol",
        account_name: "Kairos#EUW",
        rank_tier: "DIAMOND",
        rank_division: "I",
        lp_rr: 22,
        region: "euw1",
      }),
    ],
    socials: [],
    teamHistory: [],
    rolesPlayed: [makeRole({ profile_id: "demo-g1", game: "lol", role: "Jungle" })],
    avatarUrl: null,
  },
  // 2. Valorant player, Radiant, on team
  {
    profile: makeProfile({
      id: "demo-g2",
      slug: "lunaire",
      display_name: "LUNAIRE",
      country: "FR",
      tagline: "Lunaire#000",
      bio: null,
      esports_role: "player",
      status: "on_team",
      is_verified: 1,
      banner_key: "/brand/backgrounds/banner-demo.svg",
      background_type: "preset",
      background_preset: "branded-deep",
    }),
    connections: [
      makeRiotConnection({
        id: "demo-g2-c1",
        profile_id: "demo-g2",
        game: "valorant",
        account_name: "Lunaire#000",
        rank_tier: "RADIANT",
        rank_division: null,
        lp_rr: 412,
        region: "eu",
      }),
    ],
    socials: [],
    teamHistory: [],
    rolesPlayed: [makeRole({ profile_id: "demo-g2", game: "valorant", role: "Duelist" })],
    avatarUrl: null,
  },
  // 3. CS2 player, Faceit 10, open
  {
    profile: makeProfile({
      id: "demo-g3",
      slug: "ashen",
      display_name: "ASHEN",
      country: "PL",
      tagline: "ashen-cs",
      bio: null,
      esports_role: "player",
      status: "open",
    }),
    connections: [
      makeFaceitConnection({
        id: "demo-g3-c1",
        profile_id: "demo-g3",
        faceit_nickname: "ashen-cs",
        skill_level: 10,
        region: "eu",
      }),
    ],
    socials: [],
    teamHistory: [],
    rolesPlayed: [makeRole({ profile_id: "demo-g3", game: "cs2", role: "AWP" })],
    avatarUrl: null,
  },
  // 4. Coach, multi-game, not looking
  {
    profile: makeProfile({
      id: "demo-g4",
      slug: "verdan",
      display_name: "VERDAN",
      country: "DK",
      tagline: "Head Coach",
      bio: null,
      esports_role: "coach",
      status: "not_looking",
    }),
    connections: [
      makeRiotConnection({
        id: "demo-g4-c1",
        profile_id: "demo-g4",
        game: "lol",
        account_name: "Verdan#EUW",
        rank_tier: "MASTER",
        rank_division: null,
        lp_rr: 184,
        region: "euw1",
      }),
    ],
    socials: [],
    teamHistory: [],
    rolesPlayed: [],
    avatarUrl: null,
  },
  // 5. Caster, on team
  {
    profile: makeProfile({
      id: "demo-g5",
      slug: "harlow",
      display_name: "HARLOW",
      country: "GB",
      tagline: "Play-by-play",
      bio: null,
      esports_role: "caster",
      status: "on_team",
    }),
    connections: [
      makeRiotConnection({
        id: "demo-g5-c1",
        profile_id: "demo-g5",
        game: "lol",
        account_name: "Harlow#EUW",
        rank_tier: "PLATINUM",
        rank_division: "III",
        lp_rr: 48,
        region: "euw1",
      }),
    ],
    socials: [],
    teamHistory: [],
    rolesPlayed: [],
    avatarUrl: null,
  },
  // 6. Analyst, on roster
  {
    profile: makeProfile({
      id: "demo-g6",
      slug: "nyra",
      display_name: "NYRA",
      country: "ES",
      tagline: "VOD review · drafting",
      bio: null,
      esports_role: "analyst",
      status: "on_team",
    }),
    connections: [
      makeRiotConnection({
        id: "demo-g6-c1",
        profile_id: "demo-g6",
        game: "valorant",
        account_name: "Nyra#EUW",
        rank_tier: "IMMORTAL",
        rank_division: "II",
        lp_rr: 88,
        region: "eu",
      }),
    ],
    socials: [],
    teamHistory: [],
    rolesPlayed: [],
    avatarUrl: null,
  },
];
