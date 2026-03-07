import { Action, ActionPanel, List } from "@raycast/api";
import { useState, useCallback } from "react";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// UUID
// ---------------------------------------------------------------------------

function generateUUIDv1(): string {
  // v1: timestamp + node-based
  const now = Date.now();
  // UUID v1 timestamp is 100-nanosecond intervals since 1582-10-15
  const uuidEpoch = 122192928000000000n;
  const ts = uuidEpoch + BigInt(now) * 10000n;
  const timeLow = Number(ts & 0xffffffffn)
    .toString(16)
    .padStart(8, "0");
  const timeMid = Number((ts >> 32n) & 0xffffn)
    .toString(16)
    .padStart(4, "0");
  const timeHigh = Number((ts >> 48n) & 0x0fffn)
    .toString(16)
    .padStart(4, "0");
  const clockSeq = crypto.randomBytes(2);
  clockSeq[0] = (clockSeq[0] & 0x3f) | 0x80;
  const node = crypto.randomBytes(6);
  const clockHex = Buffer.from(clockSeq).toString("hex");
  const nodeHex = Buffer.from(node).toString("hex");
  return `${timeLow}-${timeMid}-1${timeHigh.slice(1)}-${clockHex}-${nodeHex}`;
}

function generateUUIDv7(): string {
  const now = Date.now();
  const bytes = crypto.randomBytes(16);
  // Set timestamp (48 bits)
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;
  // Set version 7
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // Set variant
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function UUIDView() {
  const [seed, setSeed] = useState(0);
  const regenerate = useCallback(() => setSeed((s) => s + 1), []);

  void seed;

  const v4 = crypto.randomUUID();
  const v1 = generateUUIDv1();
  const v7 = generateUUIDv7();

  const items = [
    { label: "UUID v4 (random)", value: v4 },
    { label: "UUID v7 (timestamp + random)", value: v7 },
    { label: "UUID v1 (timestamp)", value: v1 },
    { label: "Nil UUID", value: "00000000-0000-0000-0000-000000000000" },
  ];

  return (
    <List navigationTitle="UUID Generator">
      {items.map((item) => (
        <List.Item
          key={item.label}
          title={item.label}
          accessories={[{ text: item.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={item.value} />
              <Action title="Regenerate" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={regenerate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

const CHAR_SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?",
};

type CharSetKey = keyof typeof CHAR_SETS;

function PasswordView() {
  const [text, setText] = useState("");
  const [seed, setSeed] = useState(0);
  const [enabled, setEnabled] = useState<Record<CharSetKey, boolean>>({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: true,
  });

  const length = Math.max(1, Math.min(128, parseInt(text) || 20));
  const chars = (Object.keys(CHAR_SETS) as CharSetKey[])
    .filter((k) => enabled[k])
    .map((k) => CHAR_SETS[k])
    .join("");
  const pool = chars || Object.values(CHAR_SETS).join("");

  void seed;
  const password = Array.from(crypto.randomBytes(length), (b) => pool[b % pool.length]).join("");

  const toggleSet = (key: CharSetKey) => {
    setEnabled((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
    setSeed((s) => s + 1);
  };

  return (
    <List
      navigationTitle="Password Generator"
      onSearchTextChange={setText}
      searchBarPlaceholder="Length (default 20)..."
      throttle
    >
      <List.Item
        title={password}
        subtitle={`${length} characters`}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy to Clipboard" content={password} />
            <Action
              title="Regenerate"
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={() => setSeed((s) => s + 1)}
            />
            <Action
              title={`Lowercase (${enabled.lowercase ? "On" : "Off"})`}
              shortcut={{ modifiers: ["cmd"], key: "1" }}
              onAction={() => toggleSet("lowercase")}
            />
            <Action
              title={`Uppercase (${enabled.uppercase ? "On" : "Off"})`}
              shortcut={{ modifiers: ["cmd"], key: "2" }}
              onAction={() => toggleSet("uppercase")}
            />
            <Action
              title={`Digits (${enabled.digits ? "On" : "Off"})`}
              shortcut={{ modifiers: ["cmd"], key: "3" }}
              onAction={() => toggleSet("digits")}
            />
            <Action
              title={`Symbols (${enabled.symbols ? "On" : "Off"})`}
              shortcut={{ modifiers: ["cmd"], key: "4" }}
              onAction={() => toggleSet("symbols")}
            />
          </ActionPanel>
        }
      />
    </List>
  );
}

// ---------------------------------------------------------------------------
// Lorem Ipsum
// ---------------------------------------------------------------------------

const LOREM_WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
  "at",
  "vero",
  "eos",
  "accusamus",
  "iusto",
  "odio",
  "dignissimos",
  "ducimus",
  "blanditiis",
  "praesentium",
  "voluptatum",
  "deleniti",
  "atque",
  "corrupti",
  "quos",
  "dolores",
  "quas",
  "molestias",
  "recusandae",
  "itaque",
  "earum",
  "rerum",
  "hic",
  "tenetur",
  "sapiente",
  "delectus",
  "aut",
  "reiciendis",
  "voluptatibus",
  "maiores",
  "alias",
  "perferendis",
  "doloribus",
  "asperiores",
  "repellat",
];

function randomWords(count: number): string {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  }
  return result.join(" ");
}

function generateSentence(): string {
  const length = 8 + Math.floor(Math.random() * 10);
  const words = randomWords(length);
  return words.charAt(0).toUpperCase() + words.slice(1) + ".";
}

function generateParagraph(): string {
  const count = 3 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, generateSentence).join(" ");
}

function LoremIpsumView() {
  const [text, setText] = useState("");
  const [seed, setSeed] = useState(0);
  const regenerate = useCallback(() => setSeed((s) => s + 1), []);

  const count = Math.max(1, Math.min(20, parseInt(text) || 3));

  void seed;

  const sentence = generateSentence();
  const paragraphs = Array.from({ length: count }, generateParagraph);
  const allText = paragraphs.join("\n\n");

  return (
    <List
      navigationTitle="Lorem Ipsum Generator"
      onSearchTextChange={setText}
      searchBarPlaceholder="Number of paragraphs (default 3)..."
      throttle
    >
      <List.Section title="Sentence">
        <List.Item
          title={sentence}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={sentence} />
              <Action title="Regenerate" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={regenerate} />
            </ActionPanel>
          }
        />
      </List.Section>
      <List.Section title={`${count} Paragraph${count > 1 ? "s" : ""}`}>
        <List.Item
          title={allText.slice(0, 100) + "..."}
          subtitle={`${allText.length} characters`}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={allText} />
              <Action title="Regenerate" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={regenerate} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

// ---------------------------------------------------------------------------
// Hash
// ---------------------------------------------------------------------------

const HASH_ALGORITHMS = ["md5", "sha1", "sha256", "sha512"] as const;

const HASH_LABELS: Record<string, string> = {
  md5: "MD5",
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha512: "SHA-512",
};

function HashView() {
  const [text, setText] = useState("");

  const hashes = text
    ? HASH_ALGORITHMS.map((alg) => ({
        label: HASH_LABELS[alg],
        value: crypto.createHash(alg).update(text).digest("hex"),
      }))
    : [];

  return (
    <List
      navigationTitle="Hash Generator"
      onSearchTextChange={setText}
      searchBarPlaceholder="Enter text to hash..."
      throttle
    >
      {hashes.map((hash) => (
        <List.Item
          key={hash.label}
          title={hash.label}
          accessories={[{ text: hash.value }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy to Clipboard" content={hash.value} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default function Command() {
  return (
    <List searchBarPlaceholder="Pick a generator...">
      <List.Item
        title="UUID"
        subtitle="Generate a random UUID v4"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<UUIDView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Password"
        subtitle="Generate a secure random password"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<PasswordView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Lorem Ipsum"
        subtitle="Generate placeholder text"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<LoremIpsumView />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Hash"
        subtitle="Generate MD5, SHA-1, SHA-256, SHA-512 hashes"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<HashView />} />
          </ActionPanel>
        }
      />
    </List>
  );
}
