# Tools

Raycast private store extensions are limited to 5 commands. To maximise coverage, tools are
consolidated into umbrella commands that auto-detect input type — the same pattern the Convert
command already uses for 13 conversion types.

## Command budget (5 max)

| # | Command              | Status         |
|---|----------------------|----------------|
| 1 | Convert              | implemented    |
| 2 | Networking           | implemented |
| 3 | Encode/Decode        | to do          |
| 4 | Generate             | to do          |
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

## 2. Networking (partial — merge existing Subnet Calculator + HTTP Status Codes into one command)

Auto-detects input: IP/CIDR shows subnet results, numbers/text filter HTTP status codes.
When the search bar is empty, show the full HTTP status code reference.

- [x] IP/CIDR calculation — network, broadcast, host range, masks, IP class
- [x] HTTP status codes — searchable reference with descriptions

## 3. Encode/Decode (to do)

Single search bar, auto-detects input and shows all relevant transformations as sections.

- [ ] Base64 encode/decode
- [ ] URL encode/decode
- [ ] HTML entity encode/decode
- [ ] JWT decode (detect `eyJ...` tokens, show header + payload)
- [ ] Case conversion — camelCase, snake_case, kebab-case, PascalCase, UPPER_CASE, Title Case
- [ ] Text stats — character, word, line, and space counts
- [ ] JSON format/validate
- [ ] String escape/unescape — JSON, HTML, URL, regex
- [ ] Cron expression parser — plain English description
- [ ] URL parser — break down into scheme, host, path, query params, fragment

## 4. Generate (to do)

List of generators. Select one to produce output, copy to clipboard.

- [ ] UUID v4 / v7
- [ ] Secure password (configurable length/character sets)
- [ ] Lorem ipsum (words, sentences, paragraphs)
- [ ] Slug from text
- [ ] Hash from text — MD5, SHA-1, SHA-256, SHA-512
