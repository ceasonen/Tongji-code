# Tongji Code Rust Workspace

`rust/` contains the production CLI/runtime workspace for `tongji-code-cli`.

It preserves the practical Claude-style harness flow while adding Tongji branding, multi-provider OAuth selection, and GPT/OpenAI-compatible API support.

## Workspace layout

```text
rust/
├── Cargo.toml
├── Cargo.lock
├── README.md
└── crates/
    ├── api/               # Anthropic + OpenAI-compatible HTTP clients
    ├── commands/          # Shared slash-command metadata/help
    ├── compat-harness/    # Upstream manifest extraction harness
    ├── runtime/           # Sessions, prompts, config, OAuth, MCP
    ├── tongji-code-cli/   # Main CLI binary
    └── tools/             # Built-in tools
```

## Build

```bash
cd rust
cargo build --release -p tongji-code-cli
```

Binary output:

```bash
./target/release/tongji-code-cli
```

## Test

Full workspace verification:

```bash
cd rust
cargo test --workspace --exclude compat-harness
```

Focused product crates:

```bash
cd rust
cargo test -p api
cargo test -p runtime
cargo test -p tongji-code-cli
cargo test -p tools
```

## Quick start

### Help and version

```bash
cd rust
cargo run -p tongji-code-cli -- --help
cargo run -p tongji-code-cli -- --version
```

### GitHub Releases binary

```bash
curl -L https://github.com/ceasonen/Tongji-code/releases/latest/download/tongji-code-darwin-arm64 -o tongji-code
chmod +x tongji-code
./tongji-code --help
```

Available assets:

- `tongji-code-darwin-arm64`
- `tongji-code-darwin-x64`
- `tongji-code-linux-x64-gnu`
- `tongji-code-win32-x64-msvc.exe`

### Interactive shell

```bash
cd rust
cargo run -p tongji-code-cli --
```

### Prompt mode

Claude-family request:

```bash
cd rust
ANTHROPIC_API_KEY=... cargo run -p tongji-code-cli -- --model claude-sonnet-4-20250514 prompt "Summarize this repository"
```

GPT-family request:

```bash
cd rust
OPENAI_API_KEY=... cargo run -p tongji-code-cli -- --model gpt-4.1 prompt "Summarize this repository"
```

### Resume a session

```bash
cd rust
cargo run -p tongji-code-cli -- --resume session.json /status /compact /cost
```

## Auth flows

### Direct API mode

- Claude path: `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN`
- GPT path: `OPENAI_API_KEY`
- Endpoint overrides: `ANTHROPIC_BASE_URL`, `OPENAI_BASE_URL`

### OAuth mode

The login flow is now provider-first:

```bash
cd rust
cargo run -p tongji-code-cli -- login
cargo run -p tongji-code-cli -- login anthropic
cargo run -p tongji-code-cli -- logout
```

Behavior:

- load configured OAuth providers from settings
- choose a provider by prompt or by `login <provider>`
- open the authorize URL in the browser
- listen on the configured localhost callback
- exchange the code for tokens
- store credentials together with the provider id

That saved provider id is later used to resolve the right backend again.

## OAuth config

Preferred multi-provider format:

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
        },
        "tokenParams": {
          "resource": "responses"
        }
      }
    }
  }
}
```

Config discovery order:

- `~/.claude/settings.json`
- `~/.tongji-code/settings.json`
- `.claude/settings.json`
- `.tongji/settings.json`
- `.claude/settings.local.json`
- `.tongji/settings.local.json`

Notes:

- `settings.oauth` is still supported as a legacy single-provider config.
- GPT/OpenAI-compatible OAuth providers must define `apiBaseUrl`.
- Direct OpenAI usage remains simplest with `OPENAI_API_KEY`.

## Runtime behavior

Provider detection:

- Claude-style model names go to the Anthropic client
- `gpt-*`, `o1*`, `o3*`, `o4*`, and `chatgpt*` go to the OpenAI-compatible client

Manual override:

```bash
export TONGJI_CODE_PROVIDER=anthropic
export TONGJI_CODE_PROVIDER=openai
```

## Instruction and config compatibility

Tongji-native files:

- `TONGJI.md`
- `TONGJI.local.md`
- `.tongji/TONGJI.md`
- `.tongji/settings.json`
- `.tongji/settings.local.json`

Legacy Claude-compatible files still load:

- `CLAUDE.md`
- `CLAUDE.local.md`
- `.claude/CLAUDE.md`
- `.claude/settings.json`
- `.claude/settings.local.json`

The `/init` command creates `TONGJI.md` and avoids clobbering either Tongji or legacy Claude instruction files.

## REPL commands

```text
/help
/status
/model [model]
/permissions [read-only|workspace-write|danger-full-access]
/clear --confirm
/cost
/resume <session-path>
/config [env|hooks|model]
/memory
/init
/diff
/version
/export [file]
/session [list|switch <session-id>]
/exit
```

## Environment variables

### Model/auth

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `ANTHROPIC_MODEL`

### Runtime/config

- `TONGJI_CODE_PROVIDER`
- `TONGJI_CODE_PERMISSION_MODE`
- `TONGJI_CODE_CONFIG_HOME`
- legacy `CLAUDE_CONFIG_HOME`
- `CLAUDE_CODE_REMOTE`
- `CLAUDE_CODE_REMOTE_SESSION_ID`
- `TONGJI_CODE_UPSTREAM`
- `CLAUDE_CODE_UPSTREAM`
- `CLAWD_WEB_SEARCH_BASE_URL`

## Notes

- `compat-harness` exists for extraction/comparison work and is intentionally excluded from the normal release test command.
- The OpenAI-compatible runtime currently provides basic text response execution. Anthropic remains the richer path for tool-use streaming in this workspace.
- The primary distribution path is GitHub Releases plus local source builds from `rust/`.
