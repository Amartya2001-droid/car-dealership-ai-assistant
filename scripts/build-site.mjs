import { build } from "esbuild";
import { mkdir, cp, writeFile, rm } from "node:fs/promises";
await rm("dist", {recursive:true,force:true});
await mkdir("dist/server", { recursive: true });
await build({
  entryPoints: ["app-core/worker.mjs"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
});
await cp("frontend/build", "dist/client", { recursive: true });
await cp(".openai", "dist/.openai", { recursive: true });
await writeFile("dist/package.json", '{"type":"module"}');
console.log("Worker and web assets are ready.");
