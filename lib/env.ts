// ---------------------------------------------------------------------------
// Environment variable access — works in both local dev and Cloudflare Workers
// ---------------------------------------------------------------------------

function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  if (key === "SESSION_SECRET" && val.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters. Generate with: openssl rand -hex 32",
    );
  }
  return val;
}

function envOptional(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const config = {
  discord: {
    get clientId() {
      return env("DISCORD_CLIENT_ID");
    },
    get clientSecret() {
      return env("DISCORD_CLIENT_SECRET");
    },
    get redirectUri() {
      return env("DISCORD_REDIRECT_URI");
    },
  },
  riot: {
    get apiKey() {
      return env("RIOT_API_KEY");
    },
    get clientId() {
      return envOptional("RIOT_CLIENT_ID") ?? "";
    },
    get clientSecret() {
      return envOptional("RIOT_CLIENT_SECRET") ?? "";
    },
    get redirectUri() {
      return envOptional("RIOT_REDIRECT_URI") ?? "";
    },
  },
  faceit: {
    get apiKey() {
      return envOptional("FACEIT_API_KEY") ?? "";
    },
  },
  session: {
    get secret() {
      return env("SESSION_SECRET");
    },
  },
  app: {
    get url() {
      return envOptional("APP_URL") ?? "http://localhost:3000";
    },
    get assetBaseUrl() {
      return envOptional("ASSET_BASE_URL") ?? "/api/assets";
    },
  },
  leaguepedia: {
    get botUser() {
      return envOptional("LEAGUEPEDIA_BOT_USER");
    },
    get botPass() {
      return envOptional("LEAGUEPEDIA_BOT_PASS");
    },
  },
} as const;
