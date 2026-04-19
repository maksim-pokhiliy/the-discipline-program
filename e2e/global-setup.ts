import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { createEmptyDbAuthUsers } from "./empty-db/helpers/seed-auth";

const globalSetup = async () => {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set. Create e2e/.env with your test database URL.");
  }

  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const root = path.resolve(__dirname, "..");
  execSync("pnpm --filter @repo/api-server db:push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, DATABASE_URL: dbUrl, SKIP_ENV_VALIDATION: "1" },
  });

  if (process.env.EMPTY_DB === "1") {
    await createEmptyDbAuthUsers(dbUrl);
  } else if (process.env.BOOTSTRAP_DB === "1") {
    await createEmptyDbAuthUsers(dbUrl);
    execSync("pnpm --filter @repo/api-server db:seed:pages", {
      stdio: "inherit",
      cwd: root,
      env: { ...process.env, DATABASE_URL: dbUrl, SKIP_ENV_VALIDATION: "1" },
    });
  } else {
    execSync("pnpm db:seed", {
      stdio: "inherit",
      cwd: root,
      env: { ...process.env, DATABASE_URL: dbUrl, SKIP_ENV_VALIDATION: "1" },
    });
  }
};

export default globalSetup;
