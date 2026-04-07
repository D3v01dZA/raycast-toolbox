# Shell Tools (`ms-` prefix)

Shell-script equivalents of the Raycast toolbox commands, installed in `~/Setup/bin`
and managed via yadm. All scripts are prefixed with `ms-` to group them alongside
the existing `ms-help`, `ms-directory-sync`, `ms-macos-login-startup-items`.

## Conventions

- **Names** — `ms-<verb>` or `ms-<noun>-<verb>`, kebab-case.
- **Languages** — POSIX `sh` for thin wrappers; `python3` (preinstalled on macOS)
  for anything involving parsing, math, or non-trivial string manipulation.
- **Input** — accept positional args; if none, read from stdin where it makes sense.
- **Output** — pipeable: one result per line, no decoration, no colors. Multi-field
  results use `key: value` lines (matches `http-status` style).
- **Exit codes** — `0` on success, `1` on parse/usage error.
- **`--help` / `-h`** — every script supports a one-line usage banner.
- **Discoverability** — every script gets an entry in `ms-help`.

## Tool list

Source-of-truth logic lives in this repo under `src/`; the shell scripts are
hand-ported (not generated). Where logic is non-trivial, the script links back to
the TS source in a header comment.

### Convert (umbrella) — `ms-convert`

Single tool that auto-detects category (mirrors the Raycast `Convert` command).

```
ms-convert 5km mi          # 3.10686
ms-convert 32f c           # 0
ms-convert 1h s            # 3600
ms-convert "#ff5533"       # hex/rgb/hsl/hsv table
ms-convert 255 hex         # number-base
ms-convert 1700000000      # unix timestamp → ISO + relative
```

Ports the 14 converters from `src/converters/*.ts`. Single python3 script.

### Networking

| Script         | Purpose                                                |
|----------------|--------------------------------------------------------|
| `ms-ip-calc`   | CIDR/subnet calculator. `ms-ip-calc 10.0.0.0/22`       |
| `ms-url-parse` | Break a URL into scheme/host/port/path/query/fragment. |
| `ms-http-status` | Rename of existing `http-status` for prefix consistency. |

### Encode/Decode/Format

| Script           | Purpose                                                       |
|------------------|---------------------------------------------------------------|
| `ms-b64`         | Base64 encode (stdin or arg).                                 |
| `ms-b64d`        | Base64 decode.                                                |
| `ms-url-encode`  | Percent-encode.                                               |
| `ms-url-decode`  | Percent-decode.                                               |
| `ms-html-encode` | HTML entity encode.                                           |
| `ms-html-decode` | HTML entity decode.                                           |
| `ms-jwt-decode`  | Print JWT header + payload + computed expiry/issued-at.       |
| `ms-case`        | Case conversion. `ms-case camel "hello world"` etc.           |
| `ms-text-stats`  | Char / word / line / space / byte counts.                     |
| `ms-json-fmt`    | Pretty-print JSON (`jq .` wrapper, falls back to python).     |
| `ms-json-min`    | Minify JSON.                                                  |
| `ms-str-escape`  | Escape for JSON / HTML / URL / regex.                         |
| `ms-slug`        | Text → URL-safe slug. `--sep` flag for separator.             |
| `ms-cron-explain`| Plain-English description of a cron expression.               |
| `ms-curl-convert`| curl ↔ fetch/wget converter.                                  |

### Generate

| Script        | Purpose                                                         |
|---------------|-----------------------------------------------------------------|
| `ms-uuid`     | UUID v4 (default), `--v1`, `--v7`, `--nil`.                     |
| `ms-passwd`   | Secure password. `--length N`, `--no-symbols`.                  |
| `ms-lorem`    | Lorem ipsum. `ms-lorem sentence|paragraph|3`.                   |
| `ms-hash`     | Hash text. `ms-hash sha256 "..."` (md5, sha1, sha256, sha512).  |

## Out of scope

- Color picker UI, JWT signing, anything that needs interactive selection.
- Existing native tools the user already uses directly (`uuidgen`, `jq`,
  `openssl`, `base64`) are *wrapped* rather than replaced — the wrappers exist
  so `ms-help` lists them and the API is consistent.

## Status

Tracked in the task list during the implementation session. Once complete, this
file is the canonical reference; check it before adding new shell helpers.
