#!/usr/bin/env node
/**
 * Post-build patch for Cloudflare Workers compatibility.
 *
 * Problem: Next.js server code calls require() with computed filesystem paths
 * like require(path.join(cwd, '.next', 'server', 'middleware-manifest.json')).
 * esbuild can't resolve these at bundle time, and with nodejs_compat the native
 * require() is called first — which also can't find the file.
 *
 * Fix: patch the __require inner function in the final wrangler bundle to
 * return the inlined manifest content BEFORE falling through to native require().
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const DRY_RUN_DIR = ".wrangler-dry";
const DRY_RUN_WORKER = path.join(DRY_RUN_DIR, "worker.js");
const PATCHED_WORKER = ".open-next/worker-patched.js";

const MANIFESTS = [
  ".next/server/middleware-manifest.json",
  ".next/server/functions-config-manifest.json",
  ".next/server/pages-manifest.json",
  ".next/build-manifest.json",
  ".next/prerender-manifest.json",
  ".next/server/app-paths-manifest.json",
  ".next/server/next-font-manifest.json",
  ".next/server/server-reference-manifest.json",
];

// Step 1: Run wrangler dry-run to get the final bundle
console.log("Running wrangler dry-run...");
fs.rmSync(DRY_RUN_DIR, { recursive: true, force: true });
try {
  execSync(`npx wrangler deploy --env production --dry-run --outdir ${DRY_RUN_DIR}`, {
    stdio: "inherit",
    env: { ...process.env },
  });
} catch {
  // wrangler exits 1 on dry-run even on success
}

if (!fs.existsSync(DRY_RUN_WORKER)) {
  console.error(`✗ ${DRY_RUN_WORKER} not found after dry-run`);
  process.exit(1);
}

// Step 2: Build manifest inline cases
const cases = [];
for (const rel of MANIFESTS) {
  if (!fs.existsSync(rel)) continue;
  const absPath = "/" + rel.replace(/\\/g, "/");
  try {
    const parsed = JSON.parse(fs.readFileSync(rel, "utf8"));
    cases.push(`if(x===${JSON.stringify(absPath)})return ${JSON.stringify(parsed)};`);
  } catch {
    // skip non-JSON
  }
}

// Step 3: Patch the __require inner function in the bundled worker.
// The inner function always contains this pattern (pretty or minified):
//   if (typeof require !== "undefined") return require.apply(this, arguments);
//   throw Error('Dynamic require of "' + x + '" is not supported');
// We inject our cases BEFORE the native-require check so they always run first.
let content = fs.readFileSync(DRY_RUN_WORKER, "utf8");

// Strategy: prepend a global require interceptor at the top of the bundle.
// This wraps the native require (available via nodejs_compat) to return inlined
// manifest content before the call reaches the filesystem — works regardless of
// how many __require stubs are in the bundle or which scope they're in.
const interceptor =
  `(function(){` +
  `var _orig=typeof require!=="undefined"?require:null;` +
  `var _manifests={` +
  cases
    .map((c) => {
      // convert if(x==="PATH")return VALUE; → "PATH": VALUE
      const m = c.match(/if\(x===("([^"]+)")\)return ([\s\S]+?);$/);
      return m ? `${m[1]}:${m[3]}` : null;
    })
    .filter(Boolean)
    .join(",") +
  `};` +
  `globalThis.require=function(id){` +
  `if(Object.prototype.hasOwnProperty.call(_manifests,id))return _manifests[id];` +
  `if(_orig)return _orig.apply(this,arguments);` +
  `throw new Error('Dynamic require of "'+id+'" is not supported');` +
  `};` +
  `})();\n`;

content = interceptor + content;
let patched = 1;

if (patched === 0) {
  console.warn("⚠ No __require pattern matched — deploying unpatched bundle.");
}

fs.writeFileSync(PATCHED_WORKER, content, "utf8");
console.log(
  `✓ Patched bundled worker — inlined ${cases.length} manifest file(s) into ${PATCHED_WORKER}`,
);
