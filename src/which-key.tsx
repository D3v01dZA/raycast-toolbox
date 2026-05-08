import { Action, ActionPanel, List } from "@raycast/api";
import { readFileSync } from "fs";
import { homedir } from "os";
import path from "path";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Shortcut {
  keys: string;
  description: string;
}

interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

interface App {
  name: string;
  categories: ShortcutCategory[];
}

// ---------------------------------------------------------------------------
// AeroSpace config parser
// ---------------------------------------------------------------------------

const AERO_KEY_SYMBOLS: Record<string, string> = {
  alt: "⌥",
  cmd: "⌘",
  ctrl: "⌃",
  shift: "⇧",
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
  enter: "↩",
  space: "Space",
  tab: "⇥",
  backspace: "⌫",
  esc: "Esc",
  minus: "-",
  equal: "=",
  period: ".",
  comma: ",",
  slash: "/",
  backslash: "\\",
  quote: "'",
  semicolon: ";",
  backtick: "`",
  leftSquareBracket: "[",
  rightSquareBracket: "]",
};

function formatAeroKey(raw: string): string {
  const parts = raw.split("-");
  const modifiers: string[] = [];
  const keys: string[] = [];
  for (const p of parts) {
    if (p === "alt" || p === "cmd" || p === "ctrl" || p === "shift") {
      modifiers.push(AERO_KEY_SYMBOLS[p]);
    } else {
      keys.push(AERO_KEY_SYMBOLS[p] ?? p.toUpperCase());
    }
  }
  return modifiers.join("") + keys.join("");
}

function formatAeroCommand(raw: string): string {
  const cmd = raw.replace(/^'|'$/g, "").trim();
  return cmd;
}

function loadAeroSpace(): App | null {
  let content: string;
  try {
    content = readFileSync(path.join(homedir(), ".aerospace.toml"), "utf-8");
  } catch {
    return null;
  }

  // Parse workspace app assignments: [[on-window-detected]] blocks
  const workspaceApps: Record<string, string[]> = {};
  const appIdNames: Record<string, string> = {
    "com.github.wez.wezterm": "WezTerm",
    "com.jetbrains.intellij.ce": "IntelliJ CE",
    "com.jetbrains.intellij": "IntelliJ",
    "com.jetbrains.cwm.guest": "JetBrains Gateway",
    "dev.zed.Zed": "Zed",
    "com.apple.dt.Xcode": "Xcode",
    "com.apple.Safari": "Safari",
    "org.mozilla.firefox": "Firefox",
    "com.brave.Browser": "Brave",
    "com.google.Chrome": "Chrome",
    "com.ranchero.NetNewsWire-Evergreen": "NetNewsWire",
    "com.amazon.Amazon-Chime": "Chime",
    "us.zoom.xos": "Zoom",
    "com.apple.iCal": "Calendar",
    "com.apple.reminders": "Reminders",
    "com.apple.Notes": "Notes",
    "com.hahainteractive.GoodTask3Mac": "GoodTask",
    "com.apple.mail": "Mail",
    "com.microsoft.Outlook": "Outlook",
    "com.tinyspeck.slackmacgap": "Slack",
    "net.whatsapp.WhatsApp": "WhatsApp",
    "com.apple.MobileSMS": "Messages",
    "com.apple.finder": "Finder",
    "com.markmcguill.strongbox.pro": "Strongbox",
    "eu.exelban.Stats": "Stats",
    "com.apple.systempreferences": "System Settings",
    "com.raycast.macos": "Raycast",
    "com.cisco.secureclient.gui": "Cisco Secure Client",
    "com.nextcloud.desktopclient": "Nextcloud",
  };

  // Parse [[on-window-detected]] blocks for workspace assignments
  const blocks = content.split("[[on-window-detected]]").slice(1);
  for (const block of blocks) {
    const appMatch = block.match(/if\.app-id\s*=\s*'([^']+)'/);
    const wsMatch = block.match(/move-node-to-workspace\s+(\S+)/);
    if (appMatch && wsMatch) {
      const appName = appIdNames[appMatch[1]] ?? appMatch[1].split(".").pop() ?? appMatch[1];
      const ws = wsMatch[1].replace(/['"]/g, "");
      if (!workspaceApps[ws]) workspaceApps[ws] = [];
      workspaceApps[ws].push(appName);
    }
  }

  // Parse binding modes
  const modes: Record<string, Shortcut[]> = {};
  const modeRegex = /\[mode\.(\w+)\.binding\]/g;
  let modeMatch;
  const modeStarts: { name: string; index: number }[] = [];
  while ((modeMatch = modeRegex.exec(content))) {
    modeStarts.push({ name: modeMatch[1], index: modeMatch.index });
  }

  for (let i = 0; i < modeStarts.length; i++) {
    const start = modeStarts[i].index;
    const end = i + 1 < modeStarts.length ? modeStarts[i + 1].index : content.indexOf("[[on-window-detected]]");
    const section = content.slice(start, end === -1 ? undefined : end);
    const shortcuts: Shortcut[] = [];

    for (const line of section.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || trimmed.startsWith("[") || !trimmed.includes("=")) continue;
      const eqIdx = trimmed.indexOf("=");
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();

      if (!key || key.includes(".")) continue;

      const formatted = formatAeroKey(key);
      let description: string;
      if (val.startsWith("[")) {
        const cmds = val
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((c) => formatAeroCommand(c.trim()));
        description = cmds.join(", ");
      } else {
        description = formatAeroCommand(val);
      }

      // Annotate workspace commands with assigned apps
      const wsMatch = description.match(/^workspace (\S+)$/);
      if (wsMatch && workspaceApps[wsMatch[1]]) {
        description += ` (${workspaceApps[wsMatch[1]].join(", ")})`;
      }

      shortcuts.push({ keys: formatted, description });
    }

    modes[modeStarts[i].name] = shortcuts;
  }

  const categories: ShortcutCategory[] = [];
  for (const [mode, shortcuts] of Object.entries(modes)) {
    if (shortcuts.length > 0) {
      const prefix = mode === "main" ? "" : `[${mode}] `;
      categories.push({ name: `${prefix}${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`, shortcuts });
    }
  }

  return categories.length > 0 ? { name: "AeroSpace", categories } : null;
}

// ---------------------------------------------------------------------------
// tmux config parser
// ---------------------------------------------------------------------------

const TMUX_KEY_NAMES: Record<string, string> = {
  Space: "Space",
  Enter: "↩",
  Escape: "Esc",
  Tab: "⇥",
  BSpace: "⌫",
  Up: "↑",
  Down: "↓",
  Left: "←",
  Right: "→",
  NPage: "PgDn",
  PPage: "PgUp",
};

function formatTmuxKey(prefix: string, key: string): string {
  return `${prefix} ${TMUX_KEY_NAMES[key] ?? key}`;
}

interface TmuxBinding {
  key: string;
  command: string;
  description: string;
}

const TMUX_DEFAULTS: TmuxBinding[] = [
  // Session
  { key: "d", command: "detach-client", description: "Detach from session" },
  { key: "s", command: "choose-tree -s", description: "List sessions" },
  { key: "$", command: "command-prompt -I rename-session", description: "Rename session" },
  { key: "(", command: "switch-client -p", description: "Previous session" },
  { key: ")", command: "switch-client -n", description: "Next session" },
  { key: "L", command: "switch-client -l", description: "Last session" },
  // Window
  { key: "c", command: "new-window", description: "New window" },
  { key: ",", command: "command-prompt -I rename-window", description: "Rename window" },
  { key: "w", command: "choose-tree -w", description: "List windows" },
  { key: "n", command: "next-window", description: "Next window" },
  { key: "p", command: "previous-window", description: "Previous window" },
  { key: "l", command: "last-window", description: "Last window" },
  { key: "&", command: "kill-window", description: "Kill window" },
  { key: "f", command: "command-prompt find-window", description: "Find window" },
  { key: ".", command: "command-prompt move-window", description: "Move window" },
  { key: "0", command: "select-window -t :0", description: "Select window 0" },
  { key: "1", command: "select-window -t :1", description: "Select window 1" },
  { key: "2", command: "select-window -t :2", description: "Select window 2" },
  { key: "3", command: "select-window -t :3", description: "Select window 3" },
  { key: "4", command: "select-window -t :4", description: "Select window 4" },
  { key: "5", command: "select-window -t :5", description: "Select window 5" },
  { key: "6", command: "select-window -t :6", description: "Select window 6" },
  { key: "7", command: "select-window -t :7", description: "Select window 7" },
  { key: "8", command: "select-window -t :8", description: "Select window 8" },
  { key: "9", command: "select-window -t :9", description: "Select window 9" },
  // Pane
  { key: '"', command: "split-window", description: "Split pane vertically" },
  { key: "%", command: "split-window -h", description: "Split pane horizontally" },
  { key: "x", command: "kill-pane", description: "Kill pane" },
  { key: "z", command: "resize-pane -Z", description: "Toggle pane zoom" },
  { key: "o", command: "select-pane -t :.+", description: "Next pane" },
  { key: ";", command: "last-pane", description: "Last pane" },
  { key: "q", command: "display-panes", description: "Show pane numbers" },
  { key: "{", command: "swap-pane -U", description: "Swap pane up" },
  { key: "}", command: "swap-pane -D", description: "Swap pane down" },
  { key: "!", command: "break-pane", description: "Break pane to window" },
  { key: "Space", command: "next-layout", description: "Cycle layouts" },
  // Copy & misc
  { key: "[", command: "copy-mode", description: "Enter copy mode" },
  { key: "]", command: "paste-buffer", description: "Paste buffer" },
  { key: ":", command: "command-prompt", description: "Command prompt" },
  { key: "?", command: "list-keys", description: "List keybindings" },
  { key: "t", command: "clock-mode", description: "Show clock" },
  { key: "i", command: "display-message", description: "Display info" },
  { key: "~", command: "show-messages", description: "Show messages" },
];

function loadTmux(): App | null {
  function resolvePath(p: string): string {
    return p.startsWith("~") ? path.join(homedir(), p.slice(1)) : p;
  }

  function readTmuxConfig(filePath: string, seen: Set<string>): string {
    const resolved = resolvePath(filePath);
    if (seen.has(resolved)) return "";
    seen.add(resolved);
    let text: string;
    try {
      text = readFileSync(resolved, "utf-8");
    } catch {
      return "";
    }
    // Follow source-file directives
    return text.replace(/^\s*source-file\s+(.+)$/gm, (_, p) => {
      return "\n" + readTmuxConfig(p.trim(), seen);
    });
  }

  const content = readTmuxConfig("~/.tmux.conf", new Set());
  if (!content) return null;

  // Parse prefix
  let prefix = "⌃B";
  const prefixMatch = content.match(/set\s+-g\s+prefix\s+(\S+)/);
  if (prefixMatch) {
    const raw = prefixMatch[1];
    if (raw === "C-space") prefix = "⌃Space";
    else if (raw === "C-a") prefix = "⌃A";
    else if (raw.startsWith("C-")) prefix = "⌃" + raw.slice(2).toUpperCase();
    else prefix = raw;
  }

  // Parse custom bindings
  const customKeys = new Map<string, { key: string; description: string }>();
  const bindRegex = /^\s*bind(?:-key)?\s+(?:-[rn]\s+)*(?:-T\s+\S+\s+)?["']?([^\s"']+)["']?\s+(.+)$/gm;
  let match;
  while ((match = bindRegex.exec(content))) {
    const key = match[1];
    const cmd = match[2]
      .trim()
      .replace(/-c\s+"[^"]*"\s*/, "")
      .replace(/-c\s+'[^']*'\s*/, "");
    let description = cmd;
    if (cmd.startsWith("split-window -v")) description = "Split pane vertically";
    else if (cmd.startsWith("split-window -h")) description = "Split pane horizontally";
    else if (cmd.startsWith("new-window")) description = "New window";
    else if (cmd.startsWith("send-prefix")) description = "Send prefix";
    customKeys.set(key, { key, description });
  }

  // Merge: custom overrides defaults
  const sessionShortcuts: Shortcut[] = [];
  const windowShortcuts: Shortcut[] = [];
  const paneShortcuts: Shortcut[] = [];
  const miscShortcuts: Shortcut[] = [];

  const sessionCmds = new Set(["detach-client", "choose-tree -s", "rename-session", "switch-client"]);
  const windowCmds = new Set([
    "new-window",
    "rename-window",
    "choose-tree -w",
    "next-window",
    "previous-window",
    "last-window",
    "kill-window",
    "find-window",
    "move-window",
    "select-window",
  ]);
  const paneCmds = new Set([
    "split-window",
    "kill-pane",
    "resize-pane",
    "select-pane",
    "last-pane",
    "display-panes",
    "swap-pane",
    "break-pane",
    "next-layout",
  ]);

  function categorize(key: string, description: string, command: string) {
    const shortcut = { keys: formatTmuxKey(prefix, key), description };
    const cmdBase = command.split(" ")[0];
    const cmdFull = command.split(" ").slice(0, 2).join(" ");
    if (sessionCmds.has(cmdBase) || sessionCmds.has(cmdFull)) sessionShortcuts.push(shortcut);
    else if (windowCmds.has(cmdBase) || windowCmds.has(cmdFull)) windowShortcuts.push(shortcut);
    else if (paneCmds.has(cmdBase) || paneCmds.has(cmdFull)) paneShortcuts.push(shortcut);
    else miscShortcuts.push(shortcut);
  }

  const processedKeys = new Set<string>();

  // Add custom bindings first
  for (const [key, binding] of customKeys) {
    if (key === "C-space" || binding.description === "Send prefix") continue;
    categorize(key, binding.description, binding.description);
    processedKeys.add(key);
  }

  // Add defaults that aren't overridden
  for (const def of TMUX_DEFAULTS) {
    if (!processedKeys.has(def.key)) {
      categorize(def.key, def.description, def.command);
    }
  }

  const categories: ShortcutCategory[] = [];
  if (sessionShortcuts.length > 0)
    categories.push({ name: `Sessions (prefix: ${prefix})`, shortcuts: sessionShortcuts });
  if (windowShortcuts.length > 0) categories.push({ name: "Windows", shortcuts: windowShortcuts });
  if (paneShortcuts.length > 0) categories.push({ name: "Panes", shortcuts: paneShortcuts });
  if (miscShortcuts.length > 0) categories.push({ name: "Copy & Misc", shortcuts: miscShortcuts });

  return categories.length > 0 ? { name: "tmux", categories } : null;
}

// ---------------------------------------------------------------------------
// Static shortcut data
// ---------------------------------------------------------------------------

const STATIC_APPS: App[] = [
  {
    name: "Chrome",
    categories: [
      {
        name: "Tabs & Windows",
        shortcuts: [
          { keys: "⌘T", description: "New tab" },
          { keys: "⌘N", description: "New window" },
          { keys: "⌘⇧N", description: "New incognito window" },
          { keys: "⌘W", description: "Close tab" },
          { keys: "⌘⇧W", description: "Close window" },
          { keys: "⌘⇧T", description: "Reopen last closed tab" },
          { keys: "⌘⌥→", description: "Next tab" },
          { keys: "⌘⌥←", description: "Previous tab" },
          { keys: "⌘1–⌘8", description: "Switch to tab 1–8" },
          { keys: "⌘9", description: "Switch to last tab" },
          { keys: "⌘⇧M", description: "Switch profile" },
          { keys: "⌘M", description: "Minimize window" },
          { keys: "⌘H", description: "Hide Chrome" },
        ],
      },
      {
        name: "Navigation",
        shortcuts: [
          { keys: "⌘L", description: "Focus address bar" },
          { keys: "⌘←", description: "Go back" },
          { keys: "⌘→", description: "Go forward" },
          { keys: "⌘R", description: "Reload page" },
          { keys: "⌘⇧R", description: "Hard reload (bypass cache)" },
          { keys: "⌘.", description: "Stop loading" },
          { keys: "⌘↩", description: "Open address in new tab" },
          { keys: "Space", description: "Scroll down one page" },
          { keys: "⇧Space", description: "Scroll up one page" },
          { keys: "⌘↑", description: "Scroll to top" },
          { keys: "⌘↓", description: "Scroll to bottom" },
        ],
      },
      {
        name: "Find & Search",
        shortcuts: [
          { keys: "⌘F", description: "Find on page" },
          { keys: "⌘G", description: "Find next" },
          { keys: "⌘⇧G", description: "Find previous" },
          { keys: "⌘E", description: "Use selection for find" },
          { keys: "⌘⌥F", description: "Open search in address bar" },
        ],
      },
      {
        name: "Page & Content",
        shortcuts: [
          { keys: "⌘P", description: "Print page" },
          { keys: "⌘S", description: "Save page" },
          { keys: "⌘+", description: "Zoom in" },
          { keys: "⌘-", description: "Zoom out" },
          { keys: "⌘0", description: "Reset zoom" },
          { keys: "⌘⇧B", description: "Toggle bookmarks bar" },
          { keys: "⌘D", description: "Bookmark current page" },
          { keys: "⌘⌥B", description: "Open bookmark manager" },
          { keys: "⌘⇧J", description: "Open downloads" },
          { keys: "⌘Y", description: "Open history" },
          { keys: "⌘⇧Delete", description: "Clear browsing data" },
          { keys: "⌘U", description: "View page source" },
        ],
      },
      {
        name: "Developer Tools",
        shortcuts: [
          { keys: "⌘⌥I", description: "Open DevTools" },
          { keys: "⌘⌥J", description: "Open DevTools console" },
          { keys: "⌘⌥C", description: "Inspect element" },
          { keys: "⌘⌥U", description: "View source" },
          { keys: "⌘⇧C", description: "Toggle element inspector" },
          { keys: "F12", description: "Toggle DevTools" },
        ],
      },
      {
        name: "Text Editing",
        shortcuts: [
          { keys: "⌘A", description: "Select all" },
          { keys: "⌘C", description: "Copy" },
          { keys: "⌘V", description: "Paste" },
          { keys: "⌘⇧V", description: "Paste without formatting" },
          { keys: "⌘X", description: "Cut" },
          { keys: "⌘Z", description: "Undo" },
          { keys: "⌘⇧Z", description: "Redo" },
        ],
      },
    ],
  },
  {
    name: "Slack",
    categories: [
      {
        name: "Navigation",
        shortcuts: [
          { keys: "⌘K", description: "Quick switcher (jump to channel/DM)" },
          { keys: "⌘⇧K", description: "Browse DMs" },
          { keys: "⌘⇧L", description: "Browse channels" },
          { keys: "⌘⇧A", description: "All unreads" },
          { keys: "⌘⇧T", description: "Threads" },
          { keys: "⌘⇧S", description: "Saved items" },
          { keys: "⌘⇧E", description: "People & user groups" },
          { keys: "⌘.", description: "Toggle right sidebar" },
          { keys: "⌘⇧D", description: "Toggle sidebar" },
          { keys: "⌘⇧F", description: "Search" },
          { keys: "⌘⇧Y", description: "Set status" },
          { keys: "⌘[", description: "Go back" },
          { keys: "⌘]", description: "Go forward" },
          { keys: "⌥↑", description: "Previous channel/DM" },
          { keys: "⌥↓", description: "Next channel/DM" },
          { keys: "⌥⇧↑", description: "Previous unread channel/DM" },
          { keys: "⌥⇧↓", description: "Next unread channel/DM" },
          { keys: "⌘1–⌘9", description: "Switch workspace" },
        ],
      },
      {
        name: "Messages",
        shortcuts: [
          { keys: "⌘N", description: "Compose new message" },
          { keys: "⌘⇧↩", description: "Create snippet" },
          { keys: "⌘U", description: "Upload file" },
          { keys: "⇧↩", description: "New line in message" },
          { keys: "↑", description: "Edit last message" },
          { keys: "⌘⇧\\", description: "React to last message" },
          { keys: "E", description: "Add emoji reaction (hover)" },
          { keys: "R", description: "Reply in thread (hover)" },
          { keys: "T", description: "Open thread (hover)" },
          { keys: "P", description: "Pin message (hover)" },
          { keys: "S", description: "Share message (hover)" },
          { keys: "A", description: "Save message (hover)" },
          { keys: "M", description: "Remind about message (hover)" },
          { keys: "U", description: "Mark unread (hover)" },
          { keys: "Delete", description: "Delete message (hover)" },
        ],
      },
      {
        name: "Formatting",
        shortcuts: [
          { keys: "⌘B", description: "Bold" },
          { keys: "⌘I", description: "Italic" },
          { keys: "⌘⇧X", description: "Strikethrough" },
          { keys: "⌘⇧C", description: "Code block" },
          { keys: "⌘⇧7", description: "Ordered list" },
          { keys: "⌘⇧8", description: "Bulleted list" },
          { keys: "⌘⇧9", description: "Blockquote" },
          { keys: "⌘⇧F", description: "Toggle formatting toolbar" },
        ],
      },
      {
        name: "Calls",
        shortcuts: [
          { keys: "M", description: "Mute/unmute (in call)" },
          { keys: "V", description: "Toggle video (in call)" },
          { keys: "A", description: "Toggle screen share (in call)" },
          { keys: "E", description: "Show reactions (in call)" },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Zed keymap parser
// ---------------------------------------------------------------------------

const ZED_KEY_SYMBOLS: Record<string, string> = {
  ctrl: "⌃",
  cmd: "⌘",
  alt: "⌥",
  shift: "⇧",
  space: "Space",
  enter: "↩",
  escape: "Esc",
  backspace: "⌫",
  tab: "⇥",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

function formatZedKey(raw: string): string {
  // A key sequence like "space b n" or "ctrl-/" or "g d"
  return raw
    .split(" ")
    .map((chord) => {
      const parts = chord.split("-");
      return parts.map((p) => ZED_KEY_SYMBOLS[p] ?? p.toUpperCase()).join("");
    })
    .join(" ");
}

function formatZedAction(action: string): string {
  // "pane::ActivateNextItem" → "Activate Next Item"
  const name = action.includes("::") ? action.split("::")[1] : action;
  return name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function friendlyContext(ctx: string): string {
  if (ctx.includes("ProjectPanel")) return "File Explorer";
  if (ctx.includes("vim_mode == normal")) return "Vim Normal";
  if (ctx.includes("vim_mode == visual")) return "Vim Visual";
  if (ctx.includes("vim_mode == insert")) return "Vim Insert";
  if (ctx.includes("VimControl") || ctx.includes("!Editor")) return "General";
  if (ctx === "Workspace") return "Workspace";
  return ctx;
}

function loadZed(): App | null {
  let raw: string;
  try {
    raw = readFileSync(path.join(homedir(), ".config/zed/keymap.json"), "utf-8");
  } catch {
    return null;
  }

  // Strip JSONC comments
  const stripped = raw.replace(/\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1");
  let entries: { context?: string; bindings?: Record<string, string> }[];
  try {
    entries = JSON.parse(stripped);
  } catch {
    return null;
  }

  const categories: ShortcutCategory[] = [];
  // Deduplicate: later contexts can rebind the same key, and multiple keys can map to the same action.
  // Group by friendly context name, merging entries with the same context.
  const contextMap = new Map<string, Shortcut[]>();

  for (const entry of entries) {
    if (!entry.bindings) continue;
    const ctx = friendlyContext(entry.context ?? "Global");
    if (!contextMap.has(ctx)) contextMap.set(ctx, []);
    const shortcuts = contextMap.get(ctx)!;
    for (const [key, action] of Object.entries(entry.bindings)) {
      shortcuts.push({
        keys: formatZedKey(key),
        description: formatZedAction(action),
      });
    }
  }

  for (const [ctx, shortcuts] of contextMap) {
    if (shortcuts.length > 0) categories.push({ name: ctx, shortcuts });
  }

  return categories.length > 0 ? { name: "Zed", categories } : null;
}

// ---------------------------------------------------------------------------
// Load all apps (static + dynamic from config files)
// ---------------------------------------------------------------------------

function loadApps(): App[] {
  const apps = [...STATIC_APPS];
  const aero = loadAeroSpace();
  if (aero) apps.push(aero);
  const tmux = loadTmux();
  if (tmux) apps.push(tmux);
  const zed = loadZed();
  if (zed) apps.push(zed);
  return apps;
}

const APPS = loadApps();

// ---------------------------------------------------------------------------
// Fuzzy matching
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ---------------------------------------------------------------------------
// App shortcuts view (pushed into from the top-level list)
// ---------------------------------------------------------------------------

function AppShortcuts({ app }: { app: App }) {
  const [text, setText] = useState("");
  const query = text.trim();

  return (
    <List onSearchTextChange={setText} searchBarPlaceholder={`Search ${app.name} shortcuts...`} throttle>
      {app.categories.map((category) => {
        const filtered = query
          ? category.shortcuts.filter((s) => fuzzyMatch(query, s.description) || fuzzyMatch(query, s.keys))
          : category.shortcuts;
        if (filtered.length === 0) return null;
        return (
          <List.Section key={category.name} title={category.name}>
            {filtered.map((shortcut) => (
              <List.Item
                key={shortcut.keys}
                title={shortcut.keys}
                subtitle={shortcut.description}
                actions={
                  <ActionPanel>
                    <Action.CopyToClipboard title="Copy Shortcut" content={shortcut.keys} />
                    <Action.CopyToClipboard title="Copy Description" content={shortcut.description} />
                    <Action.CopyToClipboard title="Copy Both" content={`${shortcut.keys} — ${shortcut.description}`} />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        );
      })}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default function Command() {
  return (
    <List searchBarPlaceholder="Search applications...">
      {APPS.map((app) => (
        <List.Item
          key={app.name}
          title={app.name}
          subtitle={`${app.categories.reduce((n, c) => n + c.shortcuts.length, 0)} shortcuts`}
          actions={
            <ActionPanel>
              <Action.Push title="Browse Shortcuts" target={<AppShortcuts app={app} />} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
