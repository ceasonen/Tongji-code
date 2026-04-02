import path from "node:path";

const PLATFORM_SPECS = {
  "darwin-arm64": {
    assetId: "darwin-arm64",
    binaryFile: "tongji-code",
    releaseAsset: "tongji-code-darwin-arm64"
  },
  "darwin-x64": {
    assetId: "darwin-x64",
    binaryFile: "tongji-code",
    releaseAsset: "tongji-code-darwin-x64"
  },
  "linux-x64": {
    assetId: "linux-x64-gnu",
    binaryFile: "tongji-code",
    releaseAsset: "tongji-code-linux-x64-gnu"
  },
  "win32-x64": {
    assetId: "win32-x64-msvc",
    binaryFile: "tongji-code.exe",
    releaseAsset: "tongji-code-win32-x64-msvc.exe"
  }
};

export function resolvePlatformSpec(platform = process.platform, arch = process.arch) {
  const key = `${platform}-${arch}`;
  const spec = PLATFORM_SPECS[key];
  if (!spec) {
    throw new Error(
      `Unsupported platform ${platform}/${arch}. ` +
        "Publish a matching release asset or use TONGJI_CODE_BIN to point at a local binary."
    );
  }
  return spec;
}

export function vendorBinaryPath(packageRoot, spec) {
  return path.join(packageRoot, "vendor", spec.assetId, spec.binaryFile);
}

export function releaseAssetUrl(version, spec) {
  return `https://github.com/ceasonen/Tongji-code/releases/download/v${version}/${spec.releaseAsset}`;
}

export function devBinaryCandidates(packageRoot, spec) {
  const suffix = spec.binaryFile.endsWith(".exe") ? ".exe" : "";
  return [
    path.join(packageRoot, "..", "rust", "target", "debug", `tongji-code-cli${suffix}`),
    path.join(packageRoot, "..", "rust", "target", "release", `tongji-code-cli${suffix}`)
  ];
}
