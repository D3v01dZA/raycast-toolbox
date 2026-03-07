# Tools

Raycast private store extensions are limited to 5 commands. To maximise coverage, tools are
consolidated into umbrella commands that auto-detect input type — the same pattern the Convert
command already uses for 13 conversion types.

## Command budget (5 max)

| # | Command              | Status         |
|---|----------------------|----------------|
| 1 | Convert              | implemented    |
| 2 | Networking           | implemented |
| 3 | Encode/Decode/Format | implemented    |
| 4 | Generate             | implemented    |
| 5 | (free slot)          |                |

## 1. Convert (implemented)

- [x] Distance — km, m, cm, mm, mi, ft, in, yd
- [x] Weight — kg, g, mg, lb, oz, metric tons
- [x] Area — m², km², cm², ft², in², acres, hectares
- [x] Volume — L, mL, gal, qt, pt, fl oz, cups
- [x] Temperature — Celsius, Fahrenheit, Kelvin
- [x] Duration — ms, s, min, h, d, wk, mo, yr
- [x] Angle — degrees, radians, gradians, turns
- [x] Energy — J, kJ, cal, kcal, Wh, kWh, eV, BTU
- [x] Frequency — Hz, kHz, MHz, GHz, RPM
- [x] Power — W, kW, MW, hp, BTU/hr
- [x] Speed — m/s, km/h, mph, knots, ft/s
- [x] Number Base — decimal, binary, octal, hexadecimal
- [x] Date & Time — timestamps, ISO 8601, relative differences
- [x] Color — HEX, RGB, HSL, HSV (e.g. type `#ff5533` or `rgb(255,85,51)`)

## 2. Networking (implemented)

Auto-detects input: IP/CIDR shows subnet results, numbers/text filter HTTP status codes.
When the search bar is empty, shows the full HTTP status code reference.

- [x] IP/CIDR calculation — network, broadcast, host range, masks, IP class
- [x] URL parser — scheme, host, port, path, query params, fragment
- [x] HTTP status codes — searchable reference with descriptions

## 3. Encode/Decode/Format (implemented)

Pick a tool, then type in the search bar.

- [x] Base64 encode/decode
- [x] URL encode/decode
- [x] HTML entity encode/decode
- [x] JWT decode (header, payload, expiry, issued at)
- [x] Case conversion — camelCase, snake_case, kebab-case, PascalCase, UPPER_CASE, Title Case
- [x] Text stats — character, word, line, space, byte counts
- [x] JSON format/validate (formatted + minified output)
- [x] String escape — JSON, HTML, URL, regex
- [x] Slug — convert text to URL-safe slug
- [x] Cron expression parser — plain English description per field
- [x] cURL/fetch/wget converter — paste a curl command, get fetch/wget equivalents and vice versa

## 4. Generate (implemented)

List of generators. Select one to produce output, copy to clipboard.

- [x] UUID v4
- [x] Secure password
- [x] Lorem ipsum (sentence, paragraph, 3 paragraphs)
- [x] Hash from text — MD5, SHA-1, SHA-256, SHA-512
