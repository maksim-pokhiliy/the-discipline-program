#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";

const KNOWN_PLACEHOLDERS = [
  /postgres(?:ql)?:\/\/postgres:postgres@/,
  /postgres(?:ql)?:\/\/user:password@/,
  /postgres(?:ql)?:\/\/your_user:your_password@/,
  /\$2a\$10\$xGFVeUFmZ9fBD3ihEPQZt\.bl85fgMvCX0kdxA71xYpPDT4f72oiAy/,
  /\$2a\$12\$S36pNti6wcybeTTi3sB46ek1KmB7Vk0U0gXqTEJRx3D8xI\/TRRjGi/,
  /\$2a\$10\$abcdefghijklmnopqrstuuMz3Zk1H4bY9xW2vC5nQ8fT7sR6pL0dG/,
];

const isPlaceholder = (sample) => KNOWN_PLACEHOLDERS.some((rx) => rx.test(sample));

const PATTERNS = [
  { name: "Neon Postgres password", regex: /npg_[A-Za-z0-9]{16,}/ },
  { name: "bcrypt password hash", regex: /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/ },
  { name: "Postgres URL with credentials", regex: /postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@/ },
  {
    name: "OpenAI / Anthropic-style API key",
    regex: /\b(?:sk-(?:proj-)?[A-Za-z0-9_\-]{20,}|sk-ant-[A-Za-z0-9_\-]{20,})/,
  },
  { name: "GitHub token", regex: /\bghp_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}/ },
  { name: "AWS access key id", regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/ },
  {
    name: "JWT-shaped token",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  { name: "Private key block", regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "Resend API key", regex: /\bre_[A-Za-z0-9]{20,}/ },
  { name: "Slack token", regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
];

const ALLOWED_FILES = new Set([
  ".env.example",
  "scripts/check-secrets.mjs",
  ".husky/pre-commit",
]);

const SKIP_DIRS = new Set(["node_modules", ".next", ".turbo", "dist", "build", ".git"]);
const MAX_FILE_BYTES = 1_000_000;

const isAllowed = (file) => {
  if (ALLOWED_FILES.has(file)) return true;
  if (file.startsWith(".audit/") || file.startsWith(".feature-dev/")) return true;
  if (file.startsWith("docs/adr/")) return true;
  return false;
};

const shouldSkipPath = (file) => {
  const parts = file.split("/");
  return parts.some((segment) => SKIP_DIRS.has(segment));
};

const getStaged = () => {
  try {
    const out = execSync("git diff --cached --name-only --diff-filter=ACMRTUXB", {
      encoding: "utf8",
    });
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
};

const findings = [];

for (const file of getStaged()) {
  if (isAllowed(file) || shouldSkipPath(file) || !existsSync(file)) continue;

  let stats;
  try {
    stats = statSync(file);
  } catch {
    continue;
  }
  if (!stats.isFile() || stats.size > MAX_FILE_BYTES) continue;

  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const { name, regex } of PATTERNS) {
    const everyMatch = new RegExp(regex.source, regex.flags.replace("g", "") + "g");
    for (const match of content.matchAll(everyMatch)) {
      if (!isPlaceholder(match[0])) {
        findings.push({ file, name, snippet: match[0].slice(0, 60) });
        break;
      }
    }
  }
}

if (findings.length > 0) {
  process.stderr.write("\nSECRET SCANNER: refused to commit. Findings:\n\n");
  for (const { file, name, snippet } of findings) {
    process.stderr.write(`  - ${file}: ${name}\n    sample: ${snippet}...\n`);
  }
  process.stderr.write(
    "\nRotate the secret if it was published, then remove it from staged files.\n" +
      "If the match is a false positive, add the file to ALLOWED_FILES in scripts/check-secrets.mjs.\n",
  );
  process.exit(1);
}
