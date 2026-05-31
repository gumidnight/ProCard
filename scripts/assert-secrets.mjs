#!/usr/bin/env node
/**
 * Deployment validation gate.
 *
 * Fails (exit 1) if any required secret/var is missing or still holds a
 * placeholder / CI-dummy value. Run in the production deploy job BEFORE
 * `wrangler deploy` so a misconfigured environment can never ship.
 *
 *   node scripts/assert-secrets.mjs
 *
 * In CI, the real values come from the GitHub Environment; locally it reads
 * the process env (e.g. sourced from .dev.vars).
 */

const REQUIRED = [
  "SESSION_SECRET",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_REDIRECT_URI",
  "RIOT_API_KEY",
  "APP_URL",
];

// Values that indicate a non-production placeholder slipped through.
const PLACEHOLDER = /(^$)|dummy|placeholder|changeme|example|local|test|xxxx?|your[-_]?/i;

const SECRET_MIN_LEN = { SESSION_SECRET: 32 };

const problems = [];

for (const key of REQUIRED) {
  const val = process.env[key];
  if (!val || !val.trim()) {
    problems.push(`${key}: missing`);
    continue;
  }
  if (PLACEHOLDER.test(val)) {
    problems.push(`${key}: looks like a placeholder/dummy value`);
  }
  const min = SECRET_MIN_LEN[key];
  if (min && val.length < min) {
    problems.push(`${key}: too short (need >= ${min} chars; got ${val.length})`);
  }
}

if (problems.length > 0) {
  console.error("✗ Deployment secret validation FAILED:");
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    "\nProvision real values via `wrangler secret put --env <env>` / GitHub Environment secrets.",
  );
  process.exit(1);
}

console.log(`✓ All ${REQUIRED.length} required secrets present and non-placeholder.`);
