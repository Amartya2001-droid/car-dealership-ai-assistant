import { handleApi } from "./api.mjs";
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      const db = {
        all: async (sql, args = []) =>
          (
            await env.DB.prepare(sql)
              .bind(...args)
              .all()
          ).results,
        run: (sql, args = []) =>
          env.DB.prepare(sql)
            .bind(...args)
            .run(),
        batch: (queries) =>
          env.DB.batch(
            queries.map(([sql, args]) => env.DB.prepare(sql).bind(...args)),
          ),
      };
      return handleApi(request, env, db);
    }
    return env.ASSETS.fetch(request);
  },
};
