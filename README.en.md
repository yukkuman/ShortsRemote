# ShortsRemote

[日本語](README.md) | **English**

Drive YouTube Shorts with a key press without bringing the tab to the front. Global hotkeys, so it
works whatever has focus — a game, an editor, OBS. No background app and no keyboard hook (so it
does not trip anti-cheat software). Works in Chrome, Edge and Brave.

## Install

Open `chrome://extensions` (`edge://extensions` on Edge, `brave://extensions` on Brave), turn on
Developer mode, choose "Load unpacked" and pick the `extension` folder.

Keep a tab open on `youtube.com/shorts` without focusing it — put it on a second monitor if you want
to watch. If you also play games, run them in **borderless windowed** mode.

## Default keys

| Key | Action |
|---|---|
| `Ctrl+Shift+1` | Previous Short |
| `Ctrl+Shift+2` | Next Short |
| `Ctrl+Shift+3` | Play / pause |
| `Ctrl+Shift+4` | Like |
| (unbound) | Toggle mute |

## Changing keys

Edit the rows in `chrome://extensions/shortcuts`. Make sure the scope is **Global** — with "Chrome"
the shortcut only fires while the browser is focused.

Chrome only accepts combinations that include **`Ctrl` or `Alt`** (`F1`–`F12`, numpad and bare keys
without a modifier are not selectable). **Avoid keys your game or other apps use** — a globally
registered key is consumed by the OS and never reaches that app.

## Notes

- Two Chromium browsers running at once cannot both hold the same key; the one started first wins
- Next/previous only work while the Shorts tab is the **visible tab of its window** (YouTube will not
  switch the video in a hidden tab). ShortsRemote activates that tab for you when you press the key;
  a minimised window has to be restored manually
- Holding a key does not repeat (it fires once per press)
- After updating the extension, press "Reload" in `chrome://extensions` (unpacked extensions do not auto-update)

## Troubleshooting

A failed action leaves a `!` or `?` badge on the icon until the next success. Hover the icon to read the reason.

| Symptom | Fix |
|---|---|
| `!` badge stays | Check that a tab is open on `youtube.com/shorts`, then press again |
| `?` badge stays | No YouTube tab was found |
| Nothing happens | Check the key and scope in `chrome://extensions/shortcuts` |
| A key stopped working in another app | ShortsRemote is consuming it. Bind something else |

MIT — see [LICENSE](LICENSE). The extension ID is pinned by `key` in `manifest.json`.
