#!/usr/bin/env node
// SessionStart hook: establish WHICH active initiative this session is working on, then load
// its board (the SSOT) — instead of dumping every active board and letting a fresh session
// guess. Worktree is deliberately NOT the mapping key: any initiative can be worked from any
// worktree. Instead:
//   - 0 active            -> silent.
//   - exactly 1 active    -> load it (no ambiguity).
//   - >=2 active:
//       * fresh start (source startup|clear), or resume with no remembered pick
//                         -> load NO board; inject a directive telling the model to ASK the
//                            owner (AskUserQuestion) which initiative is active, then record it
//                            in initiatives/CURRENT and load that board. (A hook is a shell
//                            script, not the model, so it cannot call AskUserQuestion itself —
//                            it delegates to the model's first turn.)
//       * continuation (source resume|compact) WITH a remembered pick (initiatives/CURRENT)
//                         -> silently restore that board (never interrogate mid-task).
//       * compact with no remembered pick -> silent (don't clobber ongoing work).
// initiatives/CURRENT is a gitignored, per-worktree one-line cache of the last chosen slug:
// it pre-selects the menu default and powers the silent compact/resume restore. Always exits 0.
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const FOOTER =
  "=== Resume order (per initiative): charter -> state -> decisions(OPEN) -> deferred(OPEN) -> plan -> design docs. Close-out: run /initiative-close — promote decisions/carry-forwards to durable docs, update board+journal+plan, one docs commit. Don't let load-bearing reasoning stay only in .feature-dev/ or an external chat. ===";

function readSource() {
  try {
    const j = JSON.parse(readFileSync(0, "utf8"));
    if (j && typeof j.source === "string") return j.source;
  } catch {
    /* no/garbled stdin — treat as a fresh start */
  }
  return "startup";
}

function updatedLine(text) {
  const m = text.match(/^\*\*Updated:\*\*\s*(.+)$/m);
  if (!m) return "";
  const s = m[1].replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return s.length > 160 ? `${s.slice(0, 157)}...` : s;
}

function loadBoard(item, note) {
  console.log(
    `=== ACTIVE INITIATIVE: ${item.slug} — board auto-loaded from initiatives/${item.slug}/state.md${note ? ` ${note}` : ""} ===`,
  );
  console.log(readFileSync(item.statePath, "utf8"));
  console.log(FOOTER);
}

try {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const activePath = resolve(root, "initiatives", "ACTIVE");
  if (!existsSync(activePath)) process.exit(0);

  const slugs = readFileSync(activePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const items = [];
  for (const slug of slugs) {
    const statePath = resolve(root, "initiatives", slug, "state.md");
    if (!existsSync(statePath)) continue;
    const text = readFileSync(statePath, "utf8");
    items.push({
      slug,
      statePath,
      status: updatedLine(text),
      mtime: statSync(statePath).mtimeMs,
    });
  }
  if (items.length === 0) process.exit(0);

  // Exactly one active initiative — no ambiguity, just load it.
  if (items.length === 1) {
    loadBoard(items[0]);
    process.exit(0);
  }

  const source = readSource();

  // Remembered pick for this worktree (gitignored, one slug). Valid only if still active.
  let current = null;
  try {
    const c = readFileSync(resolve(root, "initiatives", "CURRENT"), "utf8").trim();
    if (items.some((i) => i.slug === c)) current = c;
  } catch {
    /* no CURRENT yet */
  }

  const isContinuation = source === "resume" || source === "compact";
  if (isContinuation && current) {
    loadBoard(items.find((i) => i.slug === current), "(restored from initiatives/CURRENT)");
    process.exit(0);
  }
  if (source === "compact") process.exit(0); // never interrogate mid-task

  // Fresh start (or resume with nothing remembered) with >=2 active — ask, load no board yet.
  const ordered = [...items].sort((a, b) => {
    if (current) {
      if (a.slug === current) return -1;
      if (b.slug === current) return 1;
    }
    return b.mtime - a.mtime;
  });

  console.log(
    `=== MULTIPLE ACTIVE INITIATIVES (${items.length}) — confirm which one is active THIS session before doing anything else ===`,
  );
  for (const it of ordered) {
    const tag = current && it.slug === current ? "  [last used in this worktree]" : "";
    console.log(`- ${it.slug}${tag}`);
    if (it.status) console.log(`    ${it.status}`);
  }
  console.log("");
  console.log("ACTION (before anything else — do NOT assume an initiative or load a board yet):");
  console.log(
    '1. Call AskUserQuestion: "Which initiative are we working on this session?" — options = the initiatives above (AskUserQuestion allows max 4; if there are more, show the first 4 as ordered here and rely on the auto "Other" option — the owner types the slug). If one is tagged [last used in this worktree], put it first and label it "(Recommended)".',
  );
  console.log("2. Write the chosen slug (one line) to initiatives/CURRENT.");
  console.log(
    "3. Read initiatives/<slug>/state.md and follow initiative-resume: charter -> state -> decisions(OPEN) -> deferred(OPEN) -> plan.",
  );
  console.log(
    "The other initiatives listed above are active in parallel (typically other sessions/worktrees) — leave them untouched unless the owner switches.",
  );
  process.exit(0);
} catch {
  // never break session start
}
process.exit(0);
