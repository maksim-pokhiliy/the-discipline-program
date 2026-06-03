#!/usr/bin/env node
// SessionStart hook: force-load the active initiative's board into context so a
// fresh session resumes from the SSOT instead of re-deriving (or being hand-fed)
// context. Reads initiatives/ACTIVE -> <slug>, prints initiatives/<slug>/state.md.
// Always exits 0; degrades silently if nothing is active.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

try {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const activePath = resolve(root, "initiatives", "ACTIVE");
  if (!existsSync(activePath)) process.exit(0);

  const slug = readFileSync(activePath, "utf8").trim();
  if (!slug) process.exit(0);

  const statePath = resolve(root, "initiatives", slug, "state.md");
  if (!existsSync(statePath)) {
    console.log(`Active initiative "${slug}" has no state.md (initiatives/${slug}/).`);
    process.exit(0);
  }

  const board = readFileSync(statePath, "utf8");
  console.log(`=== ACTIVE INITIATIVE: ${slug} — board auto-loaded from initiatives/${slug}/state.md ===`);
  console.log(board);
  console.log(`=== Resume: charter -> state -> decisions(OPEN) -> deferred(OPEN) -> plan. Close-out: run /initiative-close (promote decisions/carry-forwards to durable docs, update board+journal+plan, one docs commit). Do not let load-bearing reasoning stay only in .feature-dev/ or an external chat. ===`);
} catch {
  // never break session start
}
process.exit(0);
