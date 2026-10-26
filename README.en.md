# ShortUp — YouTube Shorts Remote

Scroll YouTube Shorts with a key press while you game. No background app, no keyboard hook.

[日本語](README.md) | **English**

- **No extra runtime.** No AutoHotkey, no `WH_KEYBOARD_LL` hook — Chrome registers one global hotkey for us
- **Works in Chrome, Edge and Brave** (one Chromium extension)
- **Works while a game has focus**

## How it works

```
[game has focus]
   │ Ctrl+Shift+2   (a hotkey Windows reserves for Chrome)
   ▼
service-worker.js   chrome.commands.onCommand
   │ pick the tab that has a Short open, then sendMessage
   ▼
content.js          ytd-shorts.loadVideo(...) to advance one Short
```

Keyboard hooks are the thing anti-cheat software tends to flag, so this extension deliberately
avoids them: Chrome only registers a global hotkey through the documented OS API, and the
extension never installs a background process. (This is not a guarantee — verify in your own game.)

## Install

Enable developer mode, then load the `extension` folder from this repository.

| Browser | Steps |
|---|---|
| Chrome | `chrome://extensions` → Developer mode → "Load unpacked" → `extension` |
| Edge | `edge://extensions` → Developer mode → "Load unpacked" → `extension` |
| Brave | `brave://extensions` → Developer mode → "Load unpacked" → `extension` |

Keep one tab open on `youtube.com/shorts` afterwards. Tabs that were already open before you
installed the extension still work — the content script is injected on the next key press.

## Default keys

| Key | Action |
|---|---|
| `Ctrl+Shift+1` | Previous Short |
| `Ctrl+Shift+2` | Next Short |
| `Ctrl+Shift+3` | Play / pause |
| `Ctrl+Shift+4` | Like |
| (unbound) | Toggle mute |

## Changing keys

Open `chrome://extensions/shortcuts` (`edge://extensions/shortcuts` on Edge) and edit each ShortUp row.

- Make sure the scope is **Global**. With "Chrome" the shortcut only fires while the browser is focused.
- Chrome limits which keys can be bound:

| Item | Limitation |
|---|---|
| Modifiers | `Ctrl` or `Alt` is required (`Ctrl+Alt` together is not allowed) |
| Usable keys | `A`–`Z`, `0`–`9`, arrows, `PageUp/Down`, `Home/End`, `Insert/Delete`, `Space`, `Tab`, `,` `.` |
| Unusable | `F1`–`F12`, numpad, any bare key without a modifier (exception: the four media keys) |
| Count | At most four suggested shortcuts in the manifest; add more from the screen above |

**Do not bind keys your game uses.** A globally registered hotkey is consumed by the OS, so the
game never receives that key.

## Usage

1. Put the Shorts tab on a second monitor and leave it un-minimised
2. Run your game in **borderless windowed / windowed** mode (exclusive fullscreen cannot be covered)
3. Press the key while playing — the feed advances one Short

## Gotchas

- **Two Chromium browsers running at once cannot both hold the same global hotkey.** The one started
  first wins; the other shows an empty field in `chrome://extensions/shortcuts`. If you really need
  both, set one of them to "Chrome" scope.
- **Holding a key does not repeat.** Windows global hotkeys fire once per press.
- If the Shorts tab is a background tab or minimised, advancing may still work, but it depends on the
  environment. Bring the tab to the front if it does not.
- **After updating the extension, press "Reload" in `chrome://extensions`.** It is loaded unpacked,
  so it does not auto-update.

## Troubleshooting

A failed action leaves a badge on the icon that **stays until the next success** (a badge that flashes
for a second is invisible while you game). Hover the icon to read the reason.

| Symptom | Fix |
|---|---|
| `!` badge stays | The action failed. Check that a tab is open on `youtube.com/shorts`, then press again |
| `?` badge stays | No YouTube tab found. Keep a Shorts tab open |
| Nothing happens | Check the key is assigned in `chrome://extensions/shortcuts` and the scope is Global |
| A game key stopped working | ShortUp is consuming it. Bind something else |
| Shorts stop advancing | Possibly a YouTube DOM change. Update `SEL` in `content.js` |

## Development

- Synthetic key events (`dispatchEvent(new KeyboardEvent(...))`) carry `isTrusted=false` and may be
  ignored by YouTube, so this extension manipulates the DOM directly.
- Advancing has four fallbacks:
  1. `ytd-shorts.loadVideo(index)` (the current virtualised list API)
  2. scrolling `#shorts-inner-container` by one slot
  3. clicking the legacy `#navigation-button-down` / `#navigation-button-up` buttons
  4. scrolling `#shorts-container` by one viewport
- UI strings follow the browser language (`_locales/en`, `_locales/ja`). To add a language, drop in
  `_locales/<code>/messages.json`.

```bash
node tests/smoke.js   # behaviour of content.js against a stub DOM
node tests/i18n.js    # manifest __MSG__ / getMessage keys vs _locales
```

Layout:

```
extension/
├─ manifest.json      five commands (four with default keys, all global: true)
├─ service-worker.js  command → tab selection → sendMessage
├─ content.js         DOM operations (next/prev/play/mute/like)
├─ _locales/          en / ja messages.json
└─ icons/
tests/
tools/
```

## License

MIT — see [LICENSE](LICENSE). Privacy notes: [PRIVACY.md](PRIVACY.md).
Release steps: [RELEASING.md](RELEASING.md).
