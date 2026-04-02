import fs from "node:fs";
import fsp from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { releaseAssetUrl, resolvePlatformSpec, vendorBinaryPath } from "./platform.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  if (process.env.TONGJI_CODE_SKIP_DOWNLOAD === "1") {
    console.log("[tongji-code] skipping binary download because TONGJI_CODE_SKIP_DOWNLOAD=1");
    return;
  }

  const spec = resolvePlatformSpec();
  const binaryPath = vendorBinaryPath(packageRoot, spec);
  if (fs.existsSync(binaryPath)) {
    return;
  }

  const packageJson = JSON.parse(
    await fsp.readFile(path.join(packageRoot, "package.json"), "utf8")
  );
  const url = releaseAssetUrl(packageJson.version, spec);

  await fsp.mkdir(path.dirname(binaryPath), { recursive: true });
  await downloadFile(url, binaryPath);
  if (process.platform !== "win32") {
    await fsp.chmod(binaryPath, 0o755);
  }

  console.log(`[tongji-code] installed ${spec.releaseAsset}`);
}

async function downloadFile(url, destination) {
  await new Promise((resolve, reject) => {
    request(url, 0, (response) => {
      const file = fs.createWriteStream(destination, { mode: 0o755 });
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
      file.on("error", reject);
    }, reject);
  });
}

function request(url, redirectCount, onSuccess, onError) {
  const req = https.get(url, (response) => {
    if (
      response.statusCode &&
      [301, 302, 307, 308].includes(response.statusCode) &&
      response.headers.location
    ) {
      if (redirectCount >= 5) {
        onError(new Error("too many redirects while downloading Tongji Code"));
        return;
      }
      request(response.headers.location, redirectCount + 1, onSuccess, onError);
      return;
    }

    if (response.statusCode !== 200) {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        onError(
          new Error(
            `download failed with status ${response.statusCode}: ${body.slice(0, 200).trim()}`
          )
        );
      });
      return;
    }

    onSuccess(response);
  });

  req.on("error", onError);
}

main().catch((error) => {
  console.error(`[tongji-code] install failed: ${error.message}`);
  process.exit(1);
});
