# ShortUp — YouTube Shorts Remote

**日本語** | [English](README.en.md)

ゲームをしたまま、キーを押すだけで YouTube ショートを「次へ / 前へ」送る拡張機能。
常駐ソフトもキーボードフックも使わず、Chrome に1つのグローバルショートカットを登録するだけで動きます
（Chrome / Edge / Brave 共通）。

## インストール

`chrome://extensions` を開き（Edge は `edge://extensions`、Brave は `brave://extensions`）、
デベロッパーモードを ON →「パッケージ化されていない拡張機能を読み込む」→ `extension` を選ぶ。

`youtube.com/shorts` を開いたタブを別モニタに残し、ゲームは**ボーダーレスウィンドウ**で起動してください。

## 既定キー

| キー | 動作 |
|---|---|
| `Ctrl+Shift+1` | 前のショートへ |
| `Ctrl+Shift+2` | 次のショートへ |
| `Ctrl+Shift+3` | 再生 / 一時停止 |
| `Ctrl+Shift+4` | 高評価 |
| （未割当） | ミュート切替 |

## キーを変える

`chrome://extensions/shortcuts` で編集します。**スコープが Global になっていること**を確認してください
（Chrome だとブラウザが前面のときしか効きません）。

Chrome の制約で、割り当てられるのは **`Ctrl` か `Alt` を含む組み合わせ**だけです
（`F1`〜`F12`・テンキー・修飾なしの単キーは不可）。**ゲームで使うキーは避けてください**
— グローバル登録したキーは OS が横取りして、ゲーム側には届かなくなります。

## 注意

- Chromium 系を2つ同時に起動していると、同じキーは先に起動した方しか取れない
- 長押ししてもリピートしない（1回だけ反応する）
- 更新したら `chrome://extensions` で「再読み込み」を押す（手動読み込みなので自動更新されない）

## 動かないとき

失敗するとアイコンに `!` か `?` のバッジが付き、次に成功するまで残ります。理由はアイコンにマウスを乗せると出ます。

| 症状 | 対処 |
|---|---|
| `!` が残る | ショート画面のタブがあるか確認して押し直す |
| `?` が残る | YouTube のタブが見つかっていない |
| 何も起きない | `chrome://extensions/shortcuts` でキーとスコープを確認 |
| 特定のキーがゲームで効かない | ShortUp が横取りしている。別のキーに変える |

## 仕組みと開発メモ

ゲーム → `chrome.commands`（global）→ service worker → content script → `ytd-shorts.loadVideo()`。
キーボードフックを使わないのは、アンチチートに刺さりにくい構成にするためです（保証はできないので実機で確認を）。

- 送りは `loadVideo` → スロットスクロール → 旧UIの上下ボタン → コンテナスクロール の4段フォールバック
- 合成キーイベントは `isTrusted=false` で無視されることがあるので、DOM を直接操作している
- 表示言語はブラウザの UI 言語に追従（`_locales/` に ja・en）

```bash
node tests/smoke.js   # content.js の動作
node tests/i18n.js    # ロケール整合
```

MIT（[LICENSE](LICENSE)）。拡張 ID は `manifest.json` の `key` で固定済みです。
