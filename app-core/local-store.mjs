import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
export function localStore(directory) {
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(path.join(directory, "northstar.sqlite"));
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  const run = (sql, params = []) => db.prepare(sql).run(...params);
  return {
    all: async (sql, params = []) => db.prepare(sql).all(...params),
    run: async (sql, params = []) => run(sql, params),
    batch: async (queries) => {
      db.exec("BEGIN IMMEDIATE");
      try {
        const results = queries.map(([sql, params]) => run(sql, params));
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    close: () => db.close(),
  };
}
