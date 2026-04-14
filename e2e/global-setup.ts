import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const IS_CI = !!process.env.CI;

const globalSetup = async () => {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.includes("test") && !dbUrl.includes("localhost")) {
    throw new Error(
      "DATABASE_URL does not look like a test database. Aborting E2E to prevent data loss.",
    );
  }

  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  if (IS_CI) {
    const root = path.resolve(__dirname, "..");
    execSync("pnpm --filter @repo/api-server db:push --skip-generate --accept-data-loss", {
      stdio: "inherit",
      cwd: root,
    });
    execSync("pnpm db:seed", { stdio: "inherit", cwd: root });
  }
};

export default globalSetup;
