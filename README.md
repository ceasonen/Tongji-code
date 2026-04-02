# Tongji Code

<p align="center">
  <img src="assets/tongji-code-mark.svg" alt="Tongji Code" width="760" />
</p>

<p align="center">
  <strong>Tongji-flavored multi-provider coding runtime with Claude-compatible workflow logic and GPT-ready API support.</strong>
</p>

Tongji Code is the continued evolution of this repository: a Python workspace that documents the clean-room porting effort, plus a Rust CLI/runtime that is usable as a local coding agent shell today.

The project keeps the strong parts of the original Claude-style harness design:

- session persistence and resume
- structured slash commands
- instruction-memory loading from repo files
- local tool execution with permission modes
- merged config discovery across user and project scopes

On top of that, Tongji Code adds a cleaner auth story:

- direct API mode for Claude and GPT-family models
- multi-provider OAuth config with provider selection before browser login
- provider-aware runtime routing so later prompts reuse the provider you authenticated
- Tongji-native config and instruction paths with legacy Claude compatibility

## Workspace layout

```text
.
├── assets/                         # Branding and documentation assets
├── src/                            # Python analysis / porting workspace
├── tests/                          # Python verification
└── rust/                           # Rust CLI/runtime workspace
    ├── Cargo.toml
    ├── README.md
    └── crates/
        ├── api/                    # Anthropic + OpenAI-compatible clients
        ├── commands/               # Shared slash-command metadata
        ├── compat-harness/         # Upstream manifest extraction helpers
        ├── runtime/                # Config, prompts, sessions, OAuth, MCP
        ├── tongji-code-cli/        # Main CLI binary
        └── tools/                  # Built-in tools
```

## Core capabilities

- `Python workspace`: generates a structured summary of the mirrored source surface and porting state
- `Rust CLI`: interactive REPL, prompt mode, session inspection, config/memory reports, init scaffolding, diff/export helpers
- `Claude path`: Anthropic API key or OAuth-backed bearer auth
- `GPT path`: `OPENAI_API_KEY` for direct OpenAI usage, plus OAuth-backed OpenAI-compatible providers when `apiBaseUrl` is configured
- `Compatibility`: supports both `TONGJI.md` / `.tongji/settings*.json` and legacy `CLAUDE.md` / `.claude/settings*.json`

## Quickstart

### Python summary workspace

```bash
python3 -m src.main summary
python3 -m src.main manifest
python3 -m unittest discover -s tests -v
```

### Rust CLI

```bash
cd rust
cargo build -p tongji-code-cli
cargo run -p tongji-code-cli -- --help
```

### Download from GitHub Releases

```bash
curl -L https://github.com/ceasonen/Tongji-code/releases/latest/download/tongji-code-darwin-arm64 -o tongji-code
chmod +x tongji-code
./tongji-code --help
```

Swap the asset name to match your platform:

- `tongji-code-darwin-arm64`
- `tongji-code-darwin-x64`
- `tongji-code-linux-x64-gnu`
- `tongji-code-win32-x64-msvc.exe`

### One-shot prompt examples

Claude-family model:

```bash
cd rust
ANTHROPIC_API_KEY=... cargo run -p tongji-code-cli -- --model claude-sonnet-4-20250514 prompt "Summarize this repository"
```

GPT-family model:

```bash
cd rust
OPENAI_API_KEY=... cargo run -p tongji-code-cli -- --model gpt-4.1 prompt "Summarize this repository"
```

Interactive shell:

```bash
cd rust
cargo run -p tongji-code-cli --
```

## Auth model

Tongji Code now supports two auth modes.

### 1. Direct API credentials

- `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` for Claude-family models
- `OPENAI_API_KEY` for GPT-family models
- `ANTHROPIC_BASE_URL` and `OPENAI_BASE_URL` for API endpoint overrides

### 2. OAuth provider login

`tongji-code-cli login [provider]` loads configured OAuth providers, lets you choose one first, then opens the browser-based flow. The selected provider id is stored with the credential so future runs can resolve the right backend again.

Examples:

```bash
cd rust
cargo run -p tongji-code-cli -- login
cargo run -p tongji-code-cli -- login anthropic
cargo run -p tongji-code-cli -- logout
```

## Multi-provider OAuth config

Preferred format:

```json
{
  "auth": {
    "defaultProvider": "anthropic",
    "oauthProviders": {
      "anthropic": {
        "displayName": "Claude",
        "clientId": "anthropic-client-id",
        "authorizeUrl": "https://console.anthropic.com/oauth/authorize",
        "tokenUrl": "https://console.anthropic.com/oauth/token",
        "callbackPort": 4545,
        "scopes": ["org:read", "user:write"]
      },
      "gpt-gateway": {
        "displayName": "GPT Gateway",
        "clientId": "gateway-client-id",
        "authorizeUrl": "https://gateway.example.com/oauth/authorize",
        "tokenUrl": "https://gateway.example.com/oauth/token",
        "callbackPort": 4546,
        "apiBaseUrl": "https://gateway.example.com/v1",
        "scopes": ["responses:write"],
        "authorizeParams": {
          "audience": "tongji-code"
        }
      }
    }
  }
}
```

Where to place it:

- user scope: `~/.tongji-code/settings.json`
- project scope: `.tongji/settings.json`
- local override: `.tongji/settings.local.json`

Legacy Claude-compatible locations still load:

- `~/.claude/settings.json`
- `.claude/settings.json`
- `.claude/settings.local.json`

Notes:

- `settings.oauth` is still accepted as a legacy single-provider format.
- For GPT/OpenAI-compatible OAuth providers, set `apiBaseUrl`. Tongji Code uses that field to decide whether an OAuth credential can drive the GPT runtime.
- Direct OpenAI usage remains simplest with `OPENAI_API_KEY`.

## Instruction memory

Tongji Code loads repo guidance from these files while walking upward from the current directory:

- `TONGJI.md`
- `TONGJI.local.md`
- `.tongji/TONGJI.md`
- legacy `CLAUDE.md`
- legacy `CLAUDE.local.md`
- legacy `.claude/CLAUDE.md`

The `/init` command now creates a starter `TONGJI.md` and avoids overwriting an existing Tongji or legacy Claude instruction file.

## Runtime selection

The CLI automatically maps models to providers:

- Claude-style models default to the Anthropic path
- `gpt-*`, `o1*`, `o3*`, `o4*`, and `chatgpt*` models use the OpenAI-compatible path

You can override detection with:

```bash
export TONGJI_CODE_PROVIDER=anthropic
export TONGJI_CODE_PROVIDER=openai
```

## Useful commands

Inside the REPL:

```text
/help
/status
/model gpt-4.1
/permissions workspace-write
/memory
/config
/init
/diff
/export notes.md
/exit
```

## Verification

Python:

```bash
python3 -m unittest discover -s tests -v
```

Rust:

```bash
cd rust
cargo test --workspace --exclude compat-harness
```

If you only want the main product surface:

```bash
cd rust
cargo test -p tongji-code-cli
cargo test -p api
```

## Distribution

Tongji Code now ships as a GitHub-first CLI:

- download a prebuilt binary from GitHub Releases
- or build `tongji-code-cli` locally from `rust/`
- `.github/workflows/release.yml` builds and uploads release binaries for `v*` tags

## Disclaimer

- Tongji Code is an independent project and is not affiliated with Anthropic or OpenAI.
- Legacy Claude-compatible paths are kept for migration and interoperability, not for branding.
