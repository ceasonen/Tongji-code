#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { devBinaryCandidates, resolvePlatformSpec, vendorBinaryPath } from "../lib/platform.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveBinaryPath() {
  const override = process.env.TONGJI_CODE_BIN;
  if (override) {
    return override;
  }

  const spec = resolvePlatformSpec();
  const installedBinary = vendorBinaryPath(packageRoot, spec);
  if (fs.existsSync(installedBinary)) {
    return installedBinary;
  }

  for (const candidate of devBinaryCandidates(packageRoot, spec)) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Tongji Code binary is not installed for ${process.platform}/${process.arch}. ` +
      "Reinstall the package, publish the matching GitHub release asset, or set TONGJI_CODE_BIN."
  );
}

try {
  const binaryPath = resolveBinaryPath();
  const child = spawn(binaryPath, process.argv.slice(2), {
    stdio: "inherit",
    env: process.env
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error(`[tongji-code] failed to launch binary: ${error.message}`);
    process.exit(1);
  });
} catch (error) {
  console.error(`[tongji-code] ${error.message}`);
  process.exit(1);
}
