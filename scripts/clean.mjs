import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const TARGETS = ["node_modules", "dist", ".next", ".turbo"];

const remove = (dir, name) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const full = join(dir, entry.name);

    if (entry.name === name) {
      rmSync(full, { recursive: true, force: true });
      console.log("removed", full);
    } else {
      remove(full, name);
    }
  }
};

for (const target of TARGETS) {
  remove(".", target);
}
