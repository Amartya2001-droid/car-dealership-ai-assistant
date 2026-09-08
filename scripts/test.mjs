import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const dir = mkdtempSync(join(tmpdir(), "northstar-suite-"));
try {
  const result = spawnSync(process.execPath, ["--test"], {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "test", DATA_DIR: dir },
  });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
