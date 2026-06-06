#!/usr/bin/env node
// Starts the Vite dev server with dev mode enabled.
// Dev mode unlocks every authored level (including future-dated ones) in the
// archive and bypasses the "one play per day" lock.
//
// Usage:  npm run dev:unlock
import { spawn } from "node:child_process";

const child = spawn("vite", ["dev"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, VITE_DEV_MODE: "true" },
});

child.on("exit", (code) => process.exit(code ?? 0));
