import { spawn } from "node:child_process";
import { syncContent } from "./sync-content.mjs";

await syncContent({ silent: false });

const syncWatcher = spawn("node", ["scripts/sync-content.mjs", "--watch"], {
  stdio: "inherit",
  shell: true,
});

const astroDev = spawn("pnpm", ["exec", "astro", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
});

const cleanup = () => {
  try {
    syncWatcher.kill();
    astroDev.kill();
  } catch {}
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
