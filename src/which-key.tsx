import { Action, ActionPanel, List } from "@raycast/api";
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
// Shortcut data
// ---------------------------------------------------------------------------

const APPS: App[] = [
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
];

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
// Command
// ---------------------------------------------------------------------------

export default function Command() {
  const [text, setText] = useState("");
  const [selectedApp, setSelectedApp] = useState(APPS[0].name);

  const app = APPS.find((a) => a.name === selectedApp) ?? APPS[0];
  const query = text.trim();

  return (
    <List
      onSearchTextChange={setText}
      searchBarPlaceholder={`Search ${app.name} shortcuts...`}
      throttle
      searchBarAccessory={
        APPS.length > 1 ? (
          <List.Dropdown tooltip="Application" onChange={setSelectedApp}>
            {APPS.map((a) => (
              <List.Dropdown.Item key={a.name} title={a.name} value={a.name} />
            ))}
          </List.Dropdown>
        ) : undefined
      }
    >
      {app.categories.map((category) => {
        const filtered = query
          ? category.shortcuts.filter(
              (s) => fuzzyMatch(query, s.description) || fuzzyMatch(query, s.keys),
            )
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
                    <Action.CopyToClipboard
                      title="Copy Both"
                      content={`${shortcut.keys} — ${shortcut.description}`}
                    />
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
