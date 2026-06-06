#!/usr/bin/env node
const GUARDED_PATHS = [
  /(^|\/)prisma\/migrations\//,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)\.github\/workflows\//,
  /(^|\/)\.gitignore$/,
];

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

if (GUARDED_PATHS.some((pattern) => pattern.test(filePath))) {
  process.stderr.write(
    `PROD-GUARD: "${filePath}" is a protected path (Prisma migrations, lock files, CI workflows, .gitignore). CLAUDE.md requires explicit user confirmation before changing it. Stop and ask the user.\n`,
  );
  process.exit(2);
}

process.exit(0);
