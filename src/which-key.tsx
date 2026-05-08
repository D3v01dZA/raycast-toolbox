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
  {
    name: "Zoom",
    categories: [
      {
        name: "Meeting Controls",
        shortcuts: [
          { keys: "⌘⇧A", description: "Mute/unmute audio" },
          { keys: "⌘⇧V", description: "Start/stop video" },
          { keys: "⌘⇧S", description: "Start/stop screen share" },
          { keys: "⌘⇧T", description: "Pause/resume screen share" },
          { keys: "⌘⇧R", description: "Start local recording" },
          { keys: "⌘⇧C", description: "Start cloud recording" },
          { keys: "⌘⇧P", description: "Pause/resume recording" },
          { keys: "⌘W", description: "End or leave meeting" },
        ],
      },
      {
        name: "Chat & Participants",
        shortcuts: [
          { keys: "⌘⇧H", description: "Show/hide chat" },
          { keys: "⌘U", description: "Show/hide participants" },
          { keys: "⌘I", description: "Open invite window" },
          { keys: "⌘⇧M", description: "Mute all (host)" },
          { keys: "⌘⇧U", description: "Unmute all (host)" },
        ],
      },
      {
        name: "View & Layout",
        shortcuts: [
          { keys: "⌘⇧W", description: "Toggle speaker/gallery view" },
          { keys: "⌘⇧F", description: "Enter/exit full screen" },
          { keys: "⌘⇧M", description: "Toggle minimal window" },
          { keys: "⌃⌥⌘H", description: "Show/hide meeting controls" },
          { keys: "⌘+", description: "Zoom in (pinch out)" },
          { keys: "⌘-", description: "Zoom out (pinch in)" },
        ],
      },
      {
        name: "Reactions & Feedback",
        shortcuts: [
          { keys: "⌘⇧Y", description: "Raise/lower hand" },
          { keys: "Space", description: "Push to talk (when muted)" },
        ],
      },
    ],
  },
  {
    name: "Outlook",
    categories: [
      {
        name: "Mail",
        shortcuts: [
          { keys: "⌘N", description: "New message" },
          { keys: "⌘R", description: "Reply" },
          { keys: "⌘⇧R", description: "Reply all" },
          { keys: "⌘J", description: "Forward" },
          { keys: "⌘↩", description: "Send message" },
          { keys: "⌘⇧M", description: "Mark as read/unread" },
          { keys: "⌘⇧J", description: "Mark as junk" },
          { keys: "⌘E", description: "Archive" },
          { keys: "⌫", description: "Delete message" },
          { keys: "⌘⇧A", description: "Attach file" },
          { keys: "⌘⇧S", description: "Save draft" },
          { keys: "⌘⇧G", description: "Flag message" },
          { keys: "⌘.", description: "Snooze" },
        ],
      },
      {
        name: "Navigation",
        shortcuts: [
          { keys: "⌘1", description: "Go to Mail" },
          { keys: "⌘2", description: "Go to Calendar" },
          { keys: "⌘3", description: "Go to People" },
          { keys: "⌘4", description: "Go to To Do" },
          { keys: "⌘7", description: "Go to Notes" },
          { keys: "⌘8", description: "Go to Groups" },
          { keys: "⌘⌥S", description: "Toggle sidebar" },
          { keys: "⌘⇧F", description: "Search" },
          { keys: "⌘⇧O", description: "Open in new window" },
          { keys: "⌘⌥F", description: "Filter messages" },
        ],
      },
      {
        name: "Calendar",
        shortcuts: [
          { keys: "⌘N", description: "New event" },
          { keys: "⌘T", description: "Go to today" },
          { keys: "⌘→", description: "Go to next period" },
          { keys: "⌘←", description: "Go to previous period" },
          { keys: "⌘⌥1", description: "Day view" },
          { keys: "⌘⌥2", description: "Work week view" },
          { keys: "⌘⌥3", description: "Week view" },
          { keys: "⌘⌥4", description: "Month view" },
        ],
      },
      {
        name: "Formatting",
        shortcuts: [
          { keys: "⌘B", description: "Bold" },
          { keys: "⌘I", description: "Italic" },
          { keys: "⌘U", description: "Underline" },
          { keys: "⌘K", description: "Insert link" },
          { keys: "⌘⇧T", description: "Strikethrough" },
          { keys: "⌘{", description: "Decrease indent" },
          { keys: "⌘}", description: "Increase indent" },
          { keys: "⌘⇧L", description: "Bulleted list" },
          { keys: "⌘⇧E", description: "Align center" },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Shared Vim keybinding categories (used by Zed and Neovim)
// ---------------------------------------------------------------------------

const VIM_CATEGORIES: ShortcutCategory[] = [
  {
    name: "Vim: Movement",
    shortcuts: [
      { keys: "H", description: "Move left" },
      { keys: "J", description: "Move down" },
      { keys: "K", description: "Move up" },
      { keys: "L", description: "Move right" },
      { keys: "W", description: "Next word start" },
      { keys: "B", description: "Previous word start" },
      { keys: "E", description: "Next word end" },
      { keys: "G E", description: "Previous word end" },
      { keys: "W", description: "Next WORD start (whitespace-delimited)" },
      { keys: "B", description: "Previous WORD start (whitespace-delimited)" },
      { keys: "E", description: "Next WORD end (whitespace-delimited)" },
      { keys: "0", description: "Start of line" },
      { keys: "$", description: "End of line" },
      { keys: "^", description: "First non-blank character" },
      { keys: "G _", description: "Last non-blank character" },
      { keys: "G G", description: "Go to first line" },
      { keys: "G", description: "Go to last line" },
      { keys: "{count}G", description: "Go to line {count}" },
      { keys: "{", description: "Previous blank line / paragraph" },
      { keys: "}", description: "Next blank line / paragraph" },
      { keys: "%", description: "Matching bracket" },
      { keys: "F {char}", description: "Find char forward on line" },
      { keys: "F {char}", description: "Find char backward on line" },
      { keys: "T {char}", description: "Till before char forward" },
      { keys: "T {char}", description: "Till after char backward" },
      { keys: ";", description: "Repeat last f/F/t/T" },
      { keys: ",", description: "Repeat last f/F/t/T reversed" },
      { keys: "⌃D", description: "Half page down" },
      { keys: "⌃U", description: "Half page up" },
      { keys: "⌃F", description: "Page down" },
      { keys: "⌃B", description: "Page up" },
      { keys: "Z Z", description: "Center cursor line" },
      { keys: "Z T", description: "Cursor line to top" },
      { keys: "Z B", description: "Cursor line to bottom" },
    ],
  },
  {
    name: "Vim: Operators",
    shortcuts: [
      { keys: "D", description: "Delete (motion/selection)" },
      { keys: "C", description: "Change (delete + insert mode)" },
      { keys: "Y", description: "Yank (copy)" },
      { keys: ">", description: "Indent right" },
      { keys: "<", description: "Indent left" },
      { keys: "G U", description: "Make lowercase" },
      { keys: "G U", description: "Make uppercase" },
      { keys: "=", description: "Auto-indent" },
      { keys: "D D", description: "Delete line" },
      { keys: "C C", description: "Change line" },
      { keys: "Y Y", description: "Yank line" },
      { keys: "D $", description: "Delete to end of line" },
      { keys: "D 0", description: "Delete to start of line" },
      { keys: "D", description: "Delete to end of line (shorthand)" },
      { keys: "C", description: "Change to end of line (shorthand)" },
      { keys: "Y", description: "Yank to end of line (shorthand)" },
      { keys: "X", description: "Delete character under cursor" },
      { keys: "S", description: "Substitute character (delete + insert)" },
      { keys: "S", description: "Substitute line (delete line + insert)" },
      { keys: "R {char}", description: "Replace character under cursor" },
      { keys: "J", description: "Join line below" },
      { keys: "G J", description: "Join line below (no space)" },
    ],
  },
  {
    name: "Vim: Text Objects",
    shortcuts: [
      { keys: "I W", description: "Inner word" },
      { keys: "A W", description: "Around word (includes space)" },
      { keys: "I W", description: "Inner WORD" },
      { keys: "A W", description: "Around WORD" },
      { keys: 'I "', description: "Inner double quotes" },
      { keys: 'A "', description: "Around double quotes" },
      { keys: "I '", description: "Inner single quotes" },
      { keys: "A '", description: "Around single quotes" },
      { keys: "I `", description: "Inner backticks" },
      { keys: "A `", description: "Around backticks" },
      { keys: "I (", description: "Inner parentheses" },
      { keys: "A (", description: "Around parentheses" },
      { keys: "I {", description: "Inner braces" },
      { keys: "A {", description: "Around braces" },
      { keys: "I [", description: "Inner brackets" },
      { keys: "A [", description: "Around brackets" },
      { keys: "I <", description: "Inner angle brackets" },
      { keys: "A <", description: "Around angle brackets" },
      { keys: "I T", description: "Inner HTML/XML tag" },
      { keys: "A T", description: "Around HTML/XML tag" },
      { keys: "I P", description: "Inner paragraph" },
      { keys: "A P", description: "Around paragraph" },
      { keys: "I S", description: "Inner sentence" },
      { keys: "A S", description: "Around sentence" },
    ],
  },
  {
    name: "Vim: Common Combos",
    shortcuts: [
      { keys: "C W", description: "Change word (from cursor)" },
      { keys: "C I W", description: "Change inner word" },
      { keys: "C A W", description: "Change word + surrounding space" },
      { keys: 'C I "', description: "Change inside double quotes" },
      { keys: "C I '", description: "Change inside single quotes" },
      { keys: "C I (", description: "Change inside parentheses" },
      { keys: "C I {", description: "Change inside braces" },
      { keys: "C I [", description: "Change inside brackets" },
      { keys: "C I T", description: "Change inside HTML tag" },
      { keys: "C I P", description: "Change inner paragraph" },
      { keys: "C F {char}", description: "Change through next {char}" },
      { keys: "C T {char}", description: "Change until next {char}" },
      { keys: "C $", description: "Change to end of line" },
      { keys: "C 0", description: "Change to start of line" },
      { keys: "C G G", description: "Change to start of file" },
      { keys: "C G", description: "Change to end of file" },
      { keys: "D W", description: "Delete word (from cursor)" },
      { keys: "D I W", description: "Delete inner word" },
      { keys: "D A W", description: "Delete word + surrounding space" },
      { keys: 'D I "', description: "Delete inside double quotes" },
      { keys: "D I '", description: "Delete inside single quotes" },
      { keys: "D I (", description: "Delete inside parentheses" },
      { keys: "D I {", description: "Delete inside braces" },
      { keys: "D I [", description: "Delete inside brackets" },
      { keys: "D I T", description: "Delete inside HTML tag" },
      { keys: "D A T", description: "Delete HTML tag and contents" },
      { keys: "D I P", description: "Delete inner paragraph" },
      { keys: "D F {char}", description: "Delete through next {char}" },
      { keys: "D T {char}", description: "Delete until next {char}" },
      { keys: "D G G", description: "Delete to start of file" },
      { keys: "D G", description: "Delete to end of file" },
      { keys: "Y I W", description: "Yank inner word" },
      { keys: "Y A W", description: "Yank word + surrounding space" },
      { keys: 'Y I "', description: "Yank inside double quotes" },
      { keys: "Y I (", description: "Yank inside parentheses" },
      { keys: "Y I {", description: "Yank inside braces" },
      { keys: "Y I T", description: "Yank inside HTML tag" },
      { keys: "Y I P", description: "Yank inner paragraph" },
      { keys: "Y $", description: "Yank to end of line" },
      { keys: "Y G G", description: "Yank to start of file" },
      { keys: "Y G", description: "Yank to end of file" },
      { keys: "> I {", description: "Indent inside braces" },
      { keys: "< I {", description: "De-indent inside braces" },
      { keys: "> I P", description: "Indent paragraph" },
      { keys: "= I {", description: "Auto-indent inside braces" },
      { keys: "= I P", description: "Auto-indent paragraph" },
      { keys: "V I W U", description: "Lowercase word" },
      { keys: "V I W U", description: "Uppercase word" },
      { keys: "G U I W", description: "Lowercase word (normal mode)" },
      { keys: "G U I W", description: "Uppercase word (normal mode)" },
    ],
  },
  {
    name: "Vim: Insert Mode",
    shortcuts: [
      { keys: "I", description: "Insert before cursor" },
      { keys: "I", description: "Insert at start of line" },
      { keys: "A", description: "Append after cursor" },
      { keys: "A", description: "Append at end of line" },
      { keys: "O", description: "Open line below" },
      { keys: "O", description: "Open line above" },
      { keys: "Esc", description: "Exit insert mode" },
      { keys: "⌃C", description: "Exit insert mode" },
      { keys: "⌃W", description: "Delete word before cursor" },
      { keys: "⌃U", description: "Delete to start of line" },
      { keys: "⌃T", description: "Indent line" },
      { keys: "⌃D", description: "De-indent line" },
      { keys: "⌃R {reg}", description: "Insert from register" },
      { keys: "⌃O", description: "Execute one normal command" },
    ],
  },
  {
    name: "Vim: Visual Mode",
    shortcuts: [
      { keys: "V", description: "Visual character mode" },
      { keys: "V", description: "Visual line mode" },
      { keys: "⌃V", description: "Visual block mode" },
      { keys: "O", description: "Move to other end of selection" },
      { keys: "G V", description: "Reselect last visual selection" },
      { keys: "Esc", description: "Exit visual mode" },
    ],
  },
  {
    name: "Vim: Search & Replace",
    shortcuts: [
      { keys: "/", description: "Search forward" },
      { keys: "?", description: "Search backward" },
      { keys: "N", description: "Next match" },
      { keys: "N", description: "Previous match" },
      { keys: "*", description: "Search word under cursor forward" },
      { keys: "#", description: "Search word under cursor backward" },
      { keys: ":s/old/new", description: "Replace first on line" },
      { keys: ":s/old/new/g", description: "Replace all on line" },
      { keys: ":%s/old/new/g", description: "Replace all in file" },
      { keys: ":%s/old/new/gc", description: "Replace all with confirm" },
    ],
  },
  {
    name: "Vim: Marks & Registers",
    shortcuts: [
      { keys: "M {a-z}", description: "Set mark" },
      { keys: "' {a-z}", description: "Jump to mark (line)" },
      { keys: "` {a-z}", description: "Jump to mark (exact position)" },
      { keys: "' '", description: "Jump to last jump position" },
      { keys: "' .", description: "Jump to last edit position" },
      { keys: ":marks", description: "List marks" },
      { keys: '" {a-z} y', description: "Yank into register" },
      { keys: '" {a-z} p', description: "Paste from register" },
      { keys: '" +', description: "System clipboard register" },
      { keys: ":reg", description: "List registers" },
    ],
  },
  {
    name: "Vim: Undo & Repeat",
    shortcuts: [
      { keys: "U", description: "Undo" },
      { keys: "⌃R", description: "Redo" },
      { keys: ".", description: "Repeat last change" },
      { keys: "@:", description: "Repeat last command" },
    ],
  },
  {
    name: "Vim: Macros",
    shortcuts: [
      { keys: "Q {a-z}", description: "Record macro into register" },
      { keys: "Q", description: "Stop recording macro" },
      { keys: "@ {a-z}", description: "Play macro from register" },
      { keys: "@@", description: "Replay last macro" },
      { keys: "{count}@ {a-z}", description: "Play macro {count} times" },
    ],
  },
  {
    name: "Vim: Folds",
    shortcuts: [
      { keys: "Z O", description: "Open fold" },
      { keys: "Z C", description: "Close fold" },
      { keys: "Z A", description: "Toggle fold" },
      { keys: "Z R", description: "Open all folds" },
      { keys: "Z M", description: "Close all folds" },
      { keys: "Z O", description: "Open all folds under cursor" },
      { keys: "Z C", description: "Close all folds under cursor" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Neovim / LazyVim parser
// ---------------------------------------------------------------------------

const LAZYVIM_DEFAULTS: ShortcutCategory[] = [
  {
    name: "LazyVim: General",
    shortcuts: [
      { keys: "Space", description: "Leader key" },
      { keys: "Space q q", description: "Quit all" },
      { keys: "Space q w", description: "Save and quit" },
      { keys: "Space l", description: "Lazy plugin manager" },
      { keys: "Space L", description: "LazyVim changelog" },
      { keys: "⌃S", description: "Save file" },
      { keys: "Space u n", description: "Dismiss notifications" },
    ],
  },
  {
    name: "LazyVim: Find & Search",
    shortcuts: [
      { keys: "Space Space", description: "Find files (root)" },
      { keys: "Space f f", description: "Find files (root)" },
      { keys: "Space f F", description: "Find files (cwd)" },
      { keys: "Space f r", description: "Recent files" },
      { keys: "Space f R", description: "Recent files (cwd)" },
      { keys: "Space f n", description: "New file" },
      { keys: "Space /", description: "Grep (root)" },
      { keys: "Space s g", description: "Grep (root)" },
      { keys: "Space s G", description: "Grep (cwd)" },
      { keys: "Space s w", description: "Search word under cursor (root)" },
      { keys: "Space s W", description: "Search word under cursor (cwd)" },
      { keys: "Space s b", description: "Search buffer" },
      { keys: "Space s k", description: "Search keymaps" },
      { keys: "Space s h", description: "Search help" },
      { keys: "Space s m", description: "Search marks" },
      { keys: "Space s M", description: "Search man pages" },
      { keys: "Space s o", description: "Search options" },
      { keys: "Space s R", description: "Search & replace (Spectre)" },
      { keys: "Space s s", description: "Go to symbol" },
      { keys: "Space s S", description: "Go to symbol (workspace)" },
    ],
  },
  {
    name: "LazyVim: Buffers & Windows",
    shortcuts: [
      { keys: "Space ,", description: "Switch buffer" },
      { keys: "Space b b", description: "Switch buffer (alternate)" },
      { keys: "Space b d", description: "Delete buffer" },
      { keys: "Space b D", description: "Delete buffer (force)" },
      { keys: "Space b o", description: "Delete other buffers" },
      { keys: "Space b p", description: "Toggle pin buffer" },
      { keys: "Space b P", description: "Delete non-pinned buffers" },
      { keys: "⇧H", description: "Previous buffer" },
      { keys: "⇧L", description: "Next buffer" },
      { keys: "Space -", description: "Split below" },
      { keys: "Space |", description: "Split right" },
      { keys: "Space w d", description: "Delete window" },
      { keys: "Space w w", description: "Other window" },
      { keys: "⌃H", description: "Go to left window" },
      { keys: "⌃J", description: "Go to lower window" },
      { keys: "⌃K", description: "Go to upper window" },
      { keys: "⌃L", description: "Go to right window" },
      { keys: "⌃↑", description: "Increase window height" },
      { keys: "⌃↓", description: "Decrease window height" },
      { keys: "⌃←", description: "Decrease window width" },
      { keys: "⌃→", description: "Increase window width" },
    ],
  },
  {
    name: "LazyVim: Code & LSP",
    shortcuts: [
      { keys: "Space c a", description: "Code action" },
      { keys: "Space c f", description: "Format" },
      { keys: "Space c r", description: "Rename" },
      { keys: "Space c d", description: "Line diagnostics" },
      { keys: "Space c l", description: "Lsp info" },
      { keys: "Space c o", description: "Organize imports" },
      { keys: "G D", description: "Go to definition" },
      { keys: "G R", description: "References" },
      { keys: "G I", description: "Go to implementation" },
      { keys: "G Y", description: "Go to type definition" },
      { keys: "G d", description: "Go to declaration" },
      { keys: "K", description: "Hover documentation" },
      { keys: "G K", description: "Signature help" },
      { keys: "] D", description: "Next diagnostic" },
      { keys: "[ D", description: "Previous diagnostic" },
      { keys: "] E", description: "Next error" },
      { keys: "[ E", description: "Previous error" },
      { keys: "] W", description: "Next warning" },
      { keys: "[ W", description: "Previous warning" },
    ],
  },
  {
    name: "LazyVim: Explorer & UI",
    shortcuts: [
      { keys: "Space e", description: "Explorer (root)" },
      { keys: "Space E", description: "Explorer (cwd)" },
      { keys: "Space f e", description: "Explorer (root)" },
      { keys: "Space f E", description: "Explorer (cwd)" },
      { keys: "Space u c", description: "Toggle conceallevel" },
      { keys: "Space u d", description: "Toggle diagnostics" },
      { keys: "Space u f", description: "Toggle autoformat (global)" },
      { keys: "Space u F", description: "Toggle autoformat (buffer)" },
      { keys: "Space u h", description: "Toggle inlay hints" },
      { keys: "Space u i", description: "Inspect treesitter node" },
      { keys: "Space u l", description: "Toggle line numbers" },
      { keys: "Space u L", description: "Toggle relative line numbers" },
      { keys: "Space u s", description: "Toggle spelling" },
      { keys: "Space u T", description: "Toggle treesitter highlight" },
      { keys: "Space u w", description: "Toggle word wrap" },
    ],
  },
  {
    name: "LazyVim: Git",
    shortcuts: [
      { keys: "Space g g", description: "Lazygit (root)" },
      { keys: "Space g G", description: "Lazygit (cwd)" },
      { keys: "Space g b", description: "Git blame line" },
      { keys: "Space g B", description: "Git browse" },
      { keys: "Space g f", description: "Git file history (current)" },
      { keys: "Space g l", description: "Git log" },
      { keys: "Space g L", description: "Git log (cwd)" },
      { keys: "Space g s", description: "Git status" },
      { keys: "] H", description: "Next hunk" },
      { keys: "[ H", description: "Previous hunk" },
      { keys: "Space g h s", description: "Stage hunk" },
      { keys: "Space g h r", description: "Reset hunk" },
      { keys: "Space g h S", description: "Stage buffer" },
      { keys: "Space g h u", description: "Undo stage hunk" },
      { keys: "Space g h p", description: "Preview hunk" },
      { keys: "Space g h b", description: "Blame line" },
      { keys: "Space g h d", description: "Diff this" },
    ],
  },
  {
    name: "LazyVim: Diagnostics & Quickfix",
    shortcuts: [
      { keys: "Space x x", description: "Document diagnostics" },
      { keys: "Space x X", description: "Workspace diagnostics" },
      { keys: "Space x L", description: "Location list" },
      { keys: "Space x Q", description: "Quickfix list" },
      { keys: "[ Q", description: "Previous quickfix" },
      { keys: "] Q", description: "Next quickfix" },
    ],
  },
  {
    name: "LazyVim: Terminal & Tabs",
    shortcuts: [
      { keys: "⌃/", description: "Toggle terminal" },
      { keys: "Space f t", description: "Terminal (root)" },
      { keys: "Space f T", description: "Terminal (cwd)" },
      { keys: "Space Tab Tab", description: "New tab" },
      { keys: "Space Tab d", description: "Close tab" },
      { keys: "Space Tab ]", description: "Next tab" },
      { keys: "Space Tab [", description: "Previous tab" },
      { keys: "Space Tab f", description: "First tab" },
      { keys: "Space Tab l", description: "Last tab" },
    ],
  },
  {
    name: "LazyVim: Command & Misc",
    shortcuts: [
      { keys: "Space :", description: "Command history" },
      { keys: "Space n", description: "Notification history" },
      { keys: "Space f p", description: "Recent projects" },
      { keys: "⌥J", description: "Move line down" },
      { keys: "⌥K", description: "Move line up" },
      { keys: "Space u r", description: "Redraw / clear hlsearch" },
    ],
  },
  {
    name: "LazyVim: Completion (blink.cmp)",
    shortcuts: [
      { keys: "↩", description: "Accept completion" },
      { keys: "⌃N", description: "Next completion item" },
      { keys: "⌃P", description: "Previous completion item" },
      { keys: "⌃B", description: "Scroll docs up" },
      { keys: "⌃F", description: "Scroll docs down" },
      { keys: "⌃Space", description: "Trigger completion" },
      { keys: "⌃E", description: "Dismiss completion" },
      { keys: "⇥", description: "Next snippet placeholder" },
      { keys: "⇧⇥", description: "Previous snippet placeholder" },
    ],
  },
];

function loadNeovim(): App | null {
  // Check that nvim config exists
  const configDir = path.join(homedir(), ".config/nvim");
  try {
    readFileSync(path.join(configDir, "init.lua"), "utf-8");
  } catch {
    return null;
  }

  const categories: ShortcutCategory[] = [];

  // Parse custom keymaps from keymaps.lua
  try {
    const keymapsLua = readFileSync(path.join(configDir, "lua/config/keymaps.lua"), "utf-8");
    const customShortcuts: Shortcut[] = [];
    // Match: vim.keymap.set("n", "<leader>xx", ..., { desc = "..." })
    // and: map("n", "<leader>xx", ..., { desc = "..." })
    const keymapRegex =
      /(?:vim\.keymap\.set|map)\s*\(\s*["'{]\s*([^"'}\]]+)\s*["'}]\s*,\s*"([^"]+)"\s*,\s*[^,]+,\s*\{[^}]*desc\s*=\s*"([^"]+)"/g;
    let m;
    while ((m = keymapRegex.exec(keymapsLua))) {
      const key = m[2]
        .replace(/<leader>/gi, "Space ")
        .replace(/<CR>/gi, "↩")
        .replace(/<Tab>/gi, "⇥")
        .replace(/<Esc>/gi, "Esc")
        .replace(/<C-([^>]+)>/gi, (_, k) => `⌃${k.toUpperCase()}`)
        .replace(/<A-([^>]+)>/gi, (_, k) => `⌥${k.toUpperCase()}`)
        .replace(/<S-([^>]+)>/gi, (_, k) => `⇧${k.toUpperCase()}`)
        .trim();
      customShortcuts.push({ keys: key, description: m[3] });
    }
    if (customShortcuts.length > 0) {
      categories.push({ name: "Custom Keymaps", shortcuts: customShortcuts });
    }
  } catch {
    // no keymaps file
  }

  // LazyVim defaults
  categories.push(...LAZYVIM_DEFAULTS);

  // Vim defaults
  categories.push(...VIM_CATEGORIES);

  return categories.length > 0 ? { name: "Neovim (LazyVim)", categories } : null;
}

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

  // Vim defaults
  categories.push(...VIM_CATEGORIES);

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
  const nvim = loadNeovim();
  if (nvim) apps.push(nvim);
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
