import { execFileSync } from "node:child_process";
const origin = process.env.APP_BACKEND_URL;
if (!origin || !origin.startsWith("https://"))
  throw new Error(
    "Set APP_BACKEND_URL to the public HTTPS deployment before building Android.",
  );
execFileSync("npm", ["--prefix", "frontend", "run", "build"], {
  stdio: "inherit",
  env: { ...process.env, REACT_APP_BACKEND_URL: origin },
});
execFileSync(
  "node",
  ["node_modules/@capacitor/cli/bin/capacitor", "sync", "android"],
  { stdio: "inherit" },
);
console.log(
  "Android web assets are ready. Run android/gradlew assembleDebug or bundleRelease.",
);
