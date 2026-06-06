#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let filePath = "";
try {
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  filePath = payload?.tool_input?.file_path ?? "";
} catch {
  process.exit(0);
}

if (!filePath) process.exit(0);

const isFormattable = /\.(ts|tsx|md|json)$/.test(filePath);
const isLintable = /\.(ts|tsx)$/.test(filePath);
if (!isFormattable && !isLintable) process.exit(0);

if (isFormattable) {
  try {
    execFileSync("pnpm", ["exec", "prettier", "--write", filePath], {
      stdio: ["ignore", "ignore", "ignore"],
    });
  } catch {}
}

if (isLintable) {
  try {
    execFileSync("pnpm", ["exec", "eslint", "--fix", "--max-warnings", "0", filePath], {
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const report = (error.stdout ? error.stdout.toString() : "").trim();
    if (report) {
      process.stderr.write(`format-lint-changed: eslint found issues in ${filePath}:\n${report}\n`);
      process.exit(2);
    }
  }
}

process.exit(0);
