# tongji-code

Install Tongji Code from npm:

```bash
npm install -g tongji-code
tongji-code --help
```

What this package does:

- installs a small Node launcher
- downloads the matching prebuilt `tongji-code-cli` binary from GitHub Releases
- exposes `tongji-code` and `tongji-code-cli` commands

Supported release assets:

- `darwin-arm64`
- `darwin-x64`
- `linux-x64-gnu`
- `win32-x64-msvc`

Environment variables:

- `TONGJI_CODE_BIN` to point the launcher at an existing local binary
- `TONGJI_CODE_SKIP_DOWNLOAD=1` to skip the postinstall download step

Repository:

- https://github.com/ceasonen/Tongji-code
