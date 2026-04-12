#!/usr/bin/env node
/**
 * Regenerate docs/DEPENDENCY-GRAPH.md from the current dep-cruiser config.
 *
 * Runs dep-cruiser with `--output-type mermaid` and collapses all files
 * under `packages/<name>/` and `apps/<name>/` to a single node, so the
 * resulting graph is a package-level overview (~15 nodes) instead of a
 * 785-module wall of text.
 *
 * Called via `pnpm dep:graph`. Commits the regenerated file — the goal is
 * a stable, human-readable artifact that shows up in PR diffs when the
 * dep graph changes.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const OUTPUT = resolve(REPO_ROOT, "docs/DEPENDENCY-GRAPH.md");

const COLLAPSE_PATTERN = "^(packages|apps)/[^/]+";

const mermaid = execSync(
  `pnpm exec depcruise --config .dependency-cruiser.cjs --output-type mermaid --collapse "${COLLAPSE_PATTERN}" --no-progress packages apps`,
  { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
).trim();

const markdown = `# Dependency graph

Auto-generated from [\`.dependency-cruiser.cjs\`](../.dependency-cruiser.cjs).
Refresh with \`pnpm dep:graph\`.

The graph is collapsed to package / app level (one node per directory under
\`packages/\` or \`apps/\`) so it stays readable. For the full file-level
view, run \`pnpm exec depcruise --output-type dot packages apps | dot -Tsvg\`.

This graph is enforced at the file-import level by the rule catalog in
[\`BIGTECH-AUDIT.md\` §1.3](./BIGTECH-AUDIT.md) and the dependency-direction
rules documented in [\`BOUNDED-CONTEXTS.md\` §8](./BOUNDED-CONTEXTS.md). Any
pull request that introduces a forbidden edge will fail \`pnpm dep:check\`
both locally (lefthook pre-push) and in CI (\`.github/workflows/ci.yml\`).

\`\`\`mermaid
${mermaid}
\`\`\`
`;

writeFileSync(OUTPUT, markdown);

console.log(`wrote ${OUTPUT}`);
