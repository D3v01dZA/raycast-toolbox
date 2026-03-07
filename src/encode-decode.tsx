import { Action, ActionPanel, List } from "@raycast/api";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Base64
// ---------------------------------------------------------------------------

function isBase64(s: string): boolean {
  if (s.length === 0 || s.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(s);
}

function Base64View() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List
        navigationTitle="Base64"
        onSearchTextChange={setText}
        searchBarPlaceholder="Enter text to encode/decode..."
        throttle
      >
        <List.EmptyView title="Type text to encode or paste Base64 to decode" />
      </List>
    );
  }

  const encoded = Buffer.from(text, "utf-8").toString("base64");
  const results: { label: string; value: string }[] = [{ label: "Base64 Encoded", value: encoded }];

  if (isBase64(text)) {
    try {
      const decoded = Buffer.from(text, "base64").toString("utf-8");
      if (decoded && !/\ufffd/.test(decoded)) {
        results.push({ label: "Base64 Decoded", value: decoded });
      }
    } catch {
      // not valid base64
    }
  }

  return (
    <List
      navigationTitle="Base64"
      onSearchTextChange={setText}
      searchBarPlaceholder="Enter text to encode/decode..."
      throttle
    >
      {results.map((r) => (
        <List.Item
          key={r.label}
          title={r.label}
          accessories={[{ text: r.value.length > 80 ? r.value.slice(0, 80) + "..." : r.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={r.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// URL Encode/Decode
// ---------------------------------------------------------------------------

function URLEncodeView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List
        navigationTitle="URL Encode/Decode"
        onSearchTextChange={setText}
        searchBarPlaceholder="Enter text..."
        throttle
      >
        <List.EmptyView title="Type text to URL-encode or paste encoded text to decode" />
      </List>
    );
  }

  const encoded = encodeURIComponent(text);
  const results: { label: string; value: string }[] = [{ label: "URL Encoded", value: encoded }];

  if (/%[0-9A-Fa-f]{2}/.test(text)) {
    try {
      results.push({ label: "URL Decoded", value: decodeURIComponent(text) });
    } catch {
      // invalid encoding
    }
  }

  return (
    <List
      navigationTitle="URL Encode/Decode"
      onSearchTextChange={setText}
      searchBarPlaceholder="Enter text..."
      throttle
    >
      {results.map((r) => (
        <List.Item
          key={r.label}
          title={r.label}
          accessories={[{ text: r.value.length > 80 ? r.value.slice(0, 80) + "..." : r.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={r.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// HTML Entities
// ---------------------------------------------------------------------------

const HTML_ENCODE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function htmlEncode(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ENCODE_MAP[c]);
}

function htmlDecode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function HTMLEntitiesView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List navigationTitle="HTML Entities" onSearchTextChange={setText} searchBarPlaceholder="Enter text..." throttle>
        <List.EmptyView title="Type text to encode or paste HTML entities to decode" />
      </List>
    );
  }

  const results: { label: string; value: string }[] = [{ label: "HTML Encoded", value: htmlEncode(text) }];

  if (/&[#\w]+;/.test(text)) {
    results.push({ label: "HTML Decoded", value: htmlDecode(text) });
  }

  return (
    <List navigationTitle="HTML Entities" onSearchTextChange={setText} searchBarPlaceholder="Enter text..." throttle>
      {results.map((r) => (
        <List.Item
          key={r.label}
          title={r.label}
          accessories={[{ text: r.value.length > 80 ? r.value.slice(0, 80) + "..." : r.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={r.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// JWT Decoder
// ---------------------------------------------------------------------------

function decodeJWTPart(part: string): string | null {
  try {
    const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.stringify(JSON.parse(decoded), null, 2);
  } catch {
    return null;
  }
}

function JWTDecoderView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List
        navigationTitle="JWT Decoder"
        onSearchTextChange={setText}
        searchBarPlaceholder="Paste a JWT token..."
        throttle
      >
        <List.EmptyView title="Paste a JWT token to decode its header and payload" />
      </List>
    );
  }

  const parts = text.trim().split(".");
  const results: { label: string; value: string }[] = [];

  if (parts.length === 3) {
    const header = decodeJWTPart(parts[0]);
    const payload = decodeJWTPart(parts[1]);
    if (header) results.push({ label: "Header", value: header });
    if (payload) {
      results.push({ label: "Payload", value: payload });
      try {
        const parsed = JSON.parse(payload);
        if (parsed.exp) {
          const expDate = new Date(parsed.exp * 1000);
          const now = new Date();
          const expired = expDate < now;
          results.push({
            label: "Expiry",
            value: `${expDate.toISOString()} (${expired ? "expired" : "valid"})`,
          });
        }
        if (parsed.iat) {
          results.push({ label: "Issued At", value: new Date(parsed.iat * 1000).toISOString() });
        }
      } catch {
        // ignore
      }
    }
    results.push({ label: "Signature", value: parts[2] });
  } else {
    results.push({ label: "Error", value: "Not a valid JWT (expected 3 dot-separated parts)" });
  }

  return (
    <List
      navigationTitle="JWT Decoder"
      onSearchTextChange={setText}
      searchBarPlaceholder="Paste a JWT token..."
      throttle
    >
      {results.map((r) => (
        <List.Item
          key={r.label}
          title={r.label}
          accessories={[{ text: r.value.length > 80 ? r.value.slice(0, 80) + "..." : r.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={r.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Case Converter
// ---------------------------------------------------------------------------

function toWords(s: string): string[] {
  return s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function toCamelCase(s: string): string {
  const words = toWords(s);
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}

function toPascalCase(s: string): string {
  return toWords(s)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toSnakeCase(s: string): string {
  return toWords(s)
    .map((w) => w.toLowerCase())
    .join("_");
}

function toKebabCase(s: string): string {
  return toWords(s)
    .map((w) => w.toLowerCase())
    .join("-");
}

function toUpperCase(s: string): string {
  return toWords(s)
    .map((w) => w.toUpperCase())
    .join("_");
}

function toTitleCase(s: string): string {
  return toWords(s)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function CaseConverterView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List navigationTitle="Case Converter" onSearchTextChange={setText} searchBarPlaceholder="Enter text..." throttle>
        <List.EmptyView title="Type text to convert between cases" />
      </List>
    );
  }

  const cases = [
    { label: "camelCase", value: toCamelCase(text) },
    { label: "PascalCase", value: toPascalCase(text) },
    { label: "snake_case", value: toSnakeCase(text) },
    { label: "kebab-case", value: toKebabCase(text) },
    { label: "UPPER_CASE", value: toUpperCase(text) },
    { label: "Title Case", value: toTitleCase(text) },
  ];

  return (
    <List navigationTitle="Case Converter" onSearchTextChange={setText} searchBarPlaceholder="Enter text..." throttle>
      {cases.map((c) => (
        <List.Item
          key={c.label}
          title={c.label}
          accessories={[{ text: c.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={c.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Text Stats
// ---------------------------------------------------------------------------

function TextStatsView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List navigationTitle="Text Stats" onSearchTextChange={setText} searchBarPlaceholder="Enter text..." throttle>
        <List.EmptyView title="Type text to see statistics" />
      </List>
    );
  }

  const stats = [
    { label: "Characters", value: String(text.length) },
    { label: "Words", value: String(text.split(/\s+/).filter(Boolean).length) },
    { label: "Lines", value: String(text.split(/\n/).length) },
    { label: "Spaces", value: String((text.match(/ /g) || []).length) },
    { label: "Bytes (UTF-8)", value: String(Buffer.byteLength(text, "utf-8")) },
  ];

  return (
    <List navigationTitle="Text Stats" onSearchTextChange={setText} searchBarPlaceholder="Enter text..." throttle>
      {stats.map((s) => (
        <List.Item
          key={s.label}
          title={s.label}
          accessories={[{ text: s.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={s.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// JSON Format
// ---------------------------------------------------------------------------

function JSONFormatView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List navigationTitle="JSON Format" onSearchTextChange={setText} searchBarPlaceholder="Paste JSON..." throttle>
        <List.EmptyView title="Paste JSON to format and validate" />
      </List>
    );
  }

  let formatted: string;
  let minified: string;
  let error: string | null = null;

  try {
    const parsed = JSON.parse(text);
    formatted = JSON.stringify(parsed, null, 2);
    minified = JSON.stringify(parsed);
  } catch (e) {
    formatted = "";
    minified = "";
    error = e instanceof Error ? e.message : "Invalid JSON";
  }

  if (error) {
    return (
      <List navigationTitle="JSON Format" onSearchTextChange={setText} searchBarPlaceholder="Paste JSON..." throttle>
        <List.Item title="Invalid JSON" accessories={[{ text: error }]} />
      </List>
    );
  }

  return (
    <List navigationTitle="JSON Format" onSearchTextChange={setText} searchBarPlaceholder="Paste JSON..." throttle>
      <List.Item
        title="Formatted"
        subtitle={`${formatted.length} characters`}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy Formatted" content={formatted} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Minified"
        accessories={[{ text: minified.length > 80 ? minified.slice(0, 80) + "..." : minified }]}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy Minified" content={minified} />
          </ActionPanel>
        }
      />
    </List>
  );
}

// ---------------------------------------------------------------------------
// String Escape
// ---------------------------------------------------------------------------

function escapeJSON(s: string): string {
  return JSON.stringify(s).slice(1, -1);
}

function escapeHTML(s: string): string {
  return htmlEncode(s);
}

function escapeURL(s: string): string {
  return encodeURIComponent(s);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function StringEscapeView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List navigationTitle="String Escape" onSearchTextChange={setText} searchBarPlaceholder="Enter text..." throttle>
        <List.EmptyView title="Type text to see escaped versions" />
      </List>
    );
  }

  const escapes = [
    { label: "JSON", value: escapeJSON(text) },
    { label: "HTML", value: escapeHTML(text) },
    { label: "URL", value: escapeURL(text) },
    { label: "Regex", value: escapeRegex(text) },
  ];

  return (
    <List navigationTitle="String Escape" onSearchTextChange={setText} searchBarPlaceholder="Enter text..." throttle>
      {escapes.map((e) => (
        <List.Item
          key={e.label}
          title={e.label}
          accessories={[{ text: e.value.length > 80 ? e.value.slice(0, 80) + "..." : e.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={e.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Cron Parser
// ---------------------------------------------------------------------------

function describeCronField(value: string, fieldName: string, names?: string[]): string {
  if (value === "*") return `every ${fieldName}`;
  if (value.includes("/")) {
    const [base, step] = value.split("/");
    return `every ${step} ${fieldName}${parseInt(step) > 1 ? "s" : ""}${base !== "*" ? ` starting at ${base}` : ""}`;
  }
  if (value.includes(",")) {
    const parts = value.split(",").map((v) => (names ? names[parseInt(v)] || v : v));
    return `${fieldName} ${parts.join(", ")}`;
  }
  if (value.includes("-")) {
    const [start, end] = value.split("-").map((v) => (names ? names[parseInt(v)] || v : v));
    return `${fieldName} ${start} through ${end}`;
  }
  const display = names ? names[parseInt(value)] || value : value;
  return `at ${fieldName} ${display}`;
}

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CronParserView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List
        navigationTitle="Cron Parser"
        onSearchTextChange={setText}
        searchBarPlaceholder="Enter cron expression (e.g. */5 * * * *)..."
        throttle
      >
        <List.EmptyView title="Type a cron expression to see its description" />
      </List>
    );
  }

  const parts = text.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    return (
      <List
        navigationTitle="Cron Parser"
        onSearchTextChange={setText}
        searchBarPlaceholder="Enter cron expression (e.g. */5 * * * *)..."
        throttle
      >
        <List.Item title="Invalid" accessories={[{ text: "Expected 5 or 6 fields" }]} />
      </List>
    );
  }

  const fields = [
    { label: "Minute", value: describeCronField(parts[0], "minute") },
    { label: "Hour", value: describeCronField(parts[1], "hour") },
    { label: "Day of Month", value: describeCronField(parts[2], "day") },
    { label: "Month", value: describeCronField(parts[3], "month", MONTH_NAMES) },
    { label: "Day of Week", value: describeCronField(parts[4], "day", DAY_NAMES) },
  ];

  if (parts.length === 6) {
    fields.unshift({ label: "Second", value: describeCronField(parts[0], "second") });
    fields[1] = { label: "Minute", value: describeCronField(parts[1], "minute") };
    fields[2] = { label: "Hour", value: describeCronField(parts[2], "hour") };
    fields[3] = { label: "Day of Month", value: describeCronField(parts[3], "day") };
    fields[4] = { label: "Month", value: describeCronField(parts[4], "month", MONTH_NAMES) };
    fields[5] = { label: "Day of Week", value: describeCronField(parts[5], "day", DAY_NAMES) };
  }

  return (
    <List
      navigationTitle="Cron Parser"
      onSearchTextChange={setText}
      searchBarPlaceholder="Enter cron expression (e.g. */5 * * * *)..."
      throttle
    >
      {fields.map((f) => (
        <List.Item
          key={f.label}
          title={f.label}
          accessories={[{ text: f.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={f.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// cURL / fetch / wget Converter
// ---------------------------------------------------------------------------

interface ParsedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: string;
}

function parseCurl(input: string): ParsedRequest | null {
  const t = input.trim();
  if (!t.match(/^curl\s/i)) return null;

  const result: ParsedRequest = { method: "GET", url: "", headers: {} };

  // Remove line continuations
  const normalized = t.replace(/\\\n\s*/g, " ");

  // Extract URL (first bare argument or after curl)
  const urlMatch = normalized.match(/curl\s+(?:[^'"-]\S*|'[^']*'|"[^"]*")/);
  if (urlMatch) {
    let u = urlMatch[0].replace(/^curl\s+/, "").trim();
    u = u.replace(/^['"]|['"]$/g, "");
    // Only use if it looks like a URL and not a flag
    if (u.startsWith("http") || u.startsWith("//")) {
      result.url = u;
    }
  }

  // Find URL if not found yet (could be after flags)
  if (!result.url) {
    const parts = normalized.match(/(?:'[^']*'|"[^"]*"|\S)+/g) || [];
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i].replace(/^['"]|['"]$/g, "");
      if ((p.startsWith("http") || p.startsWith("//")) && !parts[i - 1]?.match(/^-/)) {
        result.url = p;
        break;
      }
      // URL after a flag that doesn't take a value
      if (!parts[i - 1]?.match(/^-[HXdoOu]$|^--(?:header|request|data|output|user)$/)) {
        if (p.startsWith("http") || p.startsWith("//")) {
          result.url = p;
          break;
        }
      }
    }
  }

  // If still no URL, look for any URL-like string
  if (!result.url) {
    const anyUrl = normalized.match(/(https?:\/\/\S+)/);
    if (anyUrl) result.url = anyUrl[1].replace(/^['"]|['"]$/g, "");
  }

  // Method
  const methodMatch = normalized.match(/-X\s+['"]?(\w+)['"]?/);
  if (methodMatch) result.method = methodMatch[1].toUpperCase();

  // Headers
  const headerRegex = /-H\s+['"]([^'"]+)['"]/g;
  let hMatch;
  while ((hMatch = headerRegex.exec(normalized)) !== null) {
    const colonIdx = hMatch[1].indexOf(":");
    if (colonIdx > 0) {
      result.headers[hMatch[1].slice(0, colonIdx).trim()] = hMatch[1].slice(colonIdx + 1).trim();
    }
  }

  // Data
  const dataMatch = normalized.match(/(?:-d|--data|--data-raw)\s+['"]([^'"]*)['"]/);
  if (dataMatch) {
    result.data = dataMatch[1];
    if (result.method === "GET") result.method = "POST";
  }

  return result.url ? result : null;
}

function parseFetch(input: string): ParsedRequest | null {
  const t = input.trim();
  if (!t.match(/^fetch\s*\(/)) return null;

  const result: ParsedRequest = { method: "GET", url: "", headers: {} };

  // Extract URL
  const urlMatch = t.match(/fetch\s*\(\s*['"]([^'"]+)['"]/);
  if (urlMatch) result.url = urlMatch[1];

  // Extract options object
  const optMatch = t.match(/fetch\s*\(\s*['"][^'"]+['"]\s*,\s*(\{[\s\S]*\})\s*\)/);
  if (optMatch) {
    try {
      // Rough parse — replace single quotes, handle unquoted keys
      const opts = optMatch[1]
        .replace(/'/g, '"')
        .replace(/(\w+)\s*:/g, '"$1":')
        .replace(/,\s*}/g, "}");
      const parsed = JSON.parse(opts);
      if (parsed.method) result.method = parsed.method.toUpperCase();
      if (parsed.headers) result.headers = parsed.headers;
      if (parsed.body) result.data = typeof parsed.body === "string" ? parsed.body : JSON.stringify(parsed.body);
    } catch {
      // best effort
    }
  }

  return result.url ? result : null;
}

function parseWget(input: string): ParsedRequest | null {
  const t = input.trim();
  if (!t.match(/^wget\s/i)) return null;

  const result: ParsedRequest = { method: "GET", url: "", headers: {} };

  // Extract URL
  const urlMatch = t.match(/(https?:\/\/\S+)/);
  if (urlMatch) result.url = urlMatch[1].replace(/^['"]|['"]$/g, "");

  // Method
  const methodMatch = t.match(/--method[=\s]+['"]?(\w+)['"]?/);
  if (methodMatch) result.method = methodMatch[1].toUpperCase();

  // Headers
  const headerRegex = /--header[=\s]+['"]([^'"]+)['"]/g;
  let hMatch;
  while ((hMatch = headerRegex.exec(t)) !== null) {
    const colonIdx = hMatch[1].indexOf(":");
    if (colonIdx > 0) {
      result.headers[hMatch[1].slice(0, colonIdx).trim()] = hMatch[1].slice(colonIdx + 1).trim();
    }
  }

  // Post data
  const dataMatch = t.match(/--(?:post-data|body-data)[=\s]+['"]([^'"]*)['"]/);
  if (dataMatch) {
    result.data = dataMatch[1];
    if (result.method === "GET") result.method = "POST";
  }

  return result.url ? result : null;
}

function toCurl(req: ParsedRequest): string {
  const parts = ["curl"];
  if (req.method !== "GET") parts.push(`-X ${req.method}`);
  for (const [k, v] of Object.entries(req.headers)) {
    parts.push(`-H '${k}: ${v}'`);
  }
  if (req.data) parts.push(`-d '${req.data}'`);
  parts.push(`'${req.url}'`);
  return parts.join(" ");
}

function toFetch(req: ParsedRequest): string {
  const hasOptions = req.method !== "GET" || Object.keys(req.headers).length > 0 || req.data;
  if (!hasOptions) return `fetch('${req.url}')`;

  const opts: string[] = [];
  if (req.method !== "GET") opts.push(`  method: '${req.method}'`);
  if (Object.keys(req.headers).length > 0) {
    const h = Object.entries(req.headers)
      .map(([k, v]) => `    '${k}': '${v}'`)
      .join(",\n");
    opts.push(`  headers: {\n${h}\n  }`);
  }
  if (req.data) opts.push(`  body: '${req.data}'`);
  return `fetch('${req.url}', {\n${opts.join(",\n")}\n})`;
}

function toWget(req: ParsedRequest): string {
  const parts = ["wget"];
  if (req.method !== "GET") parts.push(`--method='${req.method}'`);
  for (const [k, v] of Object.entries(req.headers)) {
    parts.push(`--header='${k}: ${v}'`);
  }
  if (req.data) parts.push(`--body-data='${req.data}'`);
  parts.push(`'${req.url}'`);
  return parts.join(" ");
}

function CurlConverterView() {
  const [text, setText] = useState("");
  if (!text) {
    return (
      <List
        navigationTitle="cURL / fetch / wget"
        onSearchTextChange={setText}
        searchBarPlaceholder="Paste a curl, fetch, or wget command..."
        throttle
      >
        <List.EmptyView title="Paste a curl, fetch(), or wget command to convert" />
      </List>
    );
  }

  const parsed = parseCurl(text) || parseFetch(text) || parseWget(text);

  if (!parsed) {
    return (
      <List
        navigationTitle="cURL / fetch / wget"
        onSearchTextChange={setText}
        searchBarPlaceholder="Paste a curl, fetch, or wget command..."
        throttle
      >
        <List.Item title="Could not parse" accessories={[{ text: "Paste a valid curl, fetch(), or wget command" }]} />
      </List>
    );
  }

  const results = [
    { label: "cURL", value: toCurl(parsed) },
    { label: "fetch()", value: toFetch(parsed) },
    { label: "wget", value: toWget(parsed) },
  ];

  return (
    <List
      navigationTitle="cURL / fetch / wget"
      onSearchTextChange={setText}
      searchBarPlaceholder="Paste a curl, fetch, or wget command..."
      throttle
    >
      {results.map((r) => (
        <List.Item
          key={r.label}
          title={r.label}
          accessories={[{ text: r.value.length > 80 ? r.value.slice(0, 80) + "..." : r.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={r.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Slug
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function SlugView() {
  const [text, setText] = useState("");
  const slug = text ? slugify(text) : "";

  return (
    <List navigationTitle="Slug" onSearchTextChange={setText} searchBarPlaceholder="Enter text to slugify..." throttle>
      {slug && (
        <List.Item
          title={slug}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={slug} />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default function Command() {
  return (
    <List searchBarPlaceholder="Pick a tool...">
      <List.Item
        title="Base64"
        subtitle="Encode and decode Base64 strings"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<Base64View />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="URL Encode/Decode"
        subtitle="Encode and decode URL components"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<URLEncodeView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="HTML Entities"
        subtitle="Encode and decode HTML entities"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<HTMLEntitiesView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="JWT Decoder"
        subtitle="Decode JWT tokens"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<JWTDecoderView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Case Converter"
        subtitle="camelCase, snake_case, kebab-case, PascalCase, and more"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<CaseConverterView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Slug"
        subtitle="Convert text to a URL-safe slug"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<SlugView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Text Stats"
        subtitle="Character, word, line, and byte counts"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<TextStatsView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="JSON Format"
        subtitle="Format and validate JSON"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<JSONFormatView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="String Escape"
        subtitle="Escape strings for JSON, HTML, URL, and regex"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<StringEscapeView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Cron Parser"
        subtitle="Describe cron expressions in plain English"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<CronParserView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="cURL / fetch / wget"
        subtitle="Convert between curl, fetch(), and wget commands"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<CurlConverterView />} />
          </ActionPanel>
        }
      />
    </List>
  );
}
