"use client";

import { useState } from "react";
import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
} from "@/types/db";

export interface DashboardDataInit {
  profile: ProfileRow;
  gameConnections: GameConnectionRow[];
  socialLinks: SocialLinkRow[];
  teamHistory: TeamHistoryRow[];
  rolesPlayed: RolePlayedRow[];
  /** Discord avatar URL — fallback when no custom avatar is uploaded. */
  discordAvatarUrl: string | null;
}

/**
 * Holds the editable card data behind the dashboard tabs so that edits made on
 * any tab flow straight into the shared live preview. Read-only tabs (e.g.
 * analytics) can simply ignore the setters.
 */
export function useDashboardData(init: DashboardDataInit) {
  const [profile, setProfile] = useState(init.profile);
  const [gameConnections, setGameConnections] = useState(init.gameConnections);
  const [socialLinks, setSocialLinks] = useState(init.socialLinks);
  const [teamHistory, setTeamHistory] = useState(init.teamHistory);
  const [rolesPlayed] = useState(init.rolesPlayed);

  // Prefer a custom uploaded avatar over the Discord default.
  const avatarUrl = profile.avatar_key
    ? `/api/profile/avatar?key=${encodeURIComponent(profile.avatar_key)}`
    : init.discordAvatarUrl;

  return {
    profile,
    setProfile,
    gameConnections,
    setGameConnections,
    socialLinks,
    setSocialLinks,
    teamHistory,
    setTeamHistory,
    rolesPlayed,
    avatarUrl,
  };
}
