# ShortUp — YouTube Shorts Remote

**日本語** | [English](README.en.md)

ゲーム（FPS など）をしたまま、キーを押すだけで YouTube ショートを「次へ / 前へ」送る拡張機能です。

- **追加の常駐ソフトなし**。AutoHotkey もキーボードフックも使いません
- **Chrome / Edge / Brave** で同じものが動きます（Chromium 共通）
- **ゲームが前面にある間も効きます**（`chrome.commands` のグローバルショートカット）

## 仕組み

```
[ゲームが前面]
   │ Ctrl+Shift+2  （OS が Chrome に予約させているホットキー）
   ▼
service-worker.js   chrome.commands.onCommand
   │ ショートを開いているタブを選んで sendMessage
   ▼
content.js          ytd-shorts.loadVideo(...) で1本送る
```

キーボード入力を横取りするフック（`WH_KEYBOARD_LL`）は使わず、Chrome が OS に
ホットキーを1つ登録するだけなので、アンチチートに刺さりにくい構成にしています
（ただし 100% の保証はありません。実機で確認してください）。

## インストール

いずれも「デベロッパーモード」を ON にして、このリポジトリの `extension` フォルダを読み込みます。

| ブラウザ | 手順 |
|---|---|
| Chrome | `chrome://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」→ `extension` |
| Edge | `edge://extensions` → 開発者モード → 「展開して読み込み」→ `extension` |
| Brave | `brave://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」→ `extension` |

読み込み後、`youtube.com/shorts` を開いたタブを1つ残しておいてください（拡張導入前に開いていたタブでも、
次にキーを押したときに自動で注入されます）。

## 既定キー

| キー | 動作 |
|---|---|
| `Ctrl+Shift+1` | 前のショートへ |
| `Ctrl+Shift+2` | 次のショートへ |
| `Ctrl+Shift+3` | 再生 / 一時停止 |
| `Ctrl+Shift+4` | 高評価 |
| （未割当） | ミュート切替 |

## キーを変える

`chrome://extensions/shortcuts`（Edge は `edge://extensions/shortcuts`）を開き、ShortUp の各項目を編集します。

- **スコープが「Global」になっていることを確認**してください。「Chrome」になっていると、
  ゲームが前面のときには発火しません。
- 割り当てられるキーには Chrome 側の制約があります。

| 項目 | 制約 |
|---|---|
| 修飾キー | `Ctrl` か `Alt` が必須（`Ctrl+Alt` の同時押しは不可） |
| 使えるキー | `A`〜`Z`、`0`〜`9`、矢印、`PageUp/Down`、`Home/End`、`Insert/Delete`、`Space`、`Tab`、`,` `.` |
| 使えないキー | `F1`〜`F12`・テンキー・修飾なしの単キー（例外はメディアキー4種） |
| 個数 | manifest で提案できるのは4個まで。増やす場合は上記画面で手動追加 |

**ゲームで使うキーは割り当てないでください。** グローバル登録したキーは OS が横取りするため、
ゲーム側にはそのキーが届かなくなります。

## 使い方

1. ショートを開いたタブを、ゲームとは別のモニタに表示しておく（最小化しない）
2. ゲームは**ボーダーレスウィンドウ / ウィンドウ**で起動する（排他フルスクリーンだと重ねられません）
3. ゲーム中にキーを押すとショートが1本進む

## 運用の注意（ハマりどころ）

- **Chromium 系ブラウザを2つ以上同時に起動していると、グローバルホットキーは片方しか取れません。**
  先に起動した方が登録し、後から起動した方では `chrome://extensions/shortcuts` の欄が空になります。
  併用したいときは、片方のスコープを「Chrome」にしてください（そのブラウザが前面のときだけ反応します）。
- **キーは押した瞬間に1回だけ反応します。** 長押ししても連続では送られません
  （Windows のグローバルホットキーはリピートしないため）。
- **ショートのタブが非アクティブ・最小化でも動くはずですが、環境によっては送れません。**
  動かないときはタブを前面に戻してください。別モニタに表示しておくのが一番確実です。
- **グローバル登録したキーは OS が横取りするので、ゲーム側にはそのキーが届きません。**
- **拡張を更新したら `chrome://extensions` で「再読み込み」を押してください。**
  手動読み込みのため、自動更新はされません。

## 動かないとき

失敗するとアイコンにバッジが付き、**次に成功するまで消えません**（ゲーム中に一瞬で消える表示では気づけないため）。
理由はアイコンにマウスを乗せると出ます。

| 症状 | 対処 |
|---|---|
| アイコンに `!` が残る | 操作に失敗しています。`youtube.com/shorts` を開いたタブがあるか確認して押し直してください |
| アイコンに `?` が残る | YouTube のタブが見つかりません。ショートを開いたタブを残してください |
| 何も起きない | `chrome://extensions/shortcuts` でキーが割り当てられているか、スコープが Global か確認 |
| ゲームで特定のキーが効かなくなった | そのキーを ShortUp が横取りしています。別のキーに変えてください |
| ショートが送られなくなった | YouTube 側の DOM 変更の可能性。`content.js` の `SEL` を更新してください |

## 多言語対応

表示言語は **Chrome の UI 言語に自動で追従**します（切り替え設定はありません）。
`extension/_locales/` に `ja` と `en` を入れてあり、ブラウザが日本語なら日本語、
それ以外は英語（`default_locale`）が出ます。対象は次のとおりです。

- 拡張機能の説明（`chrome://extensions` やストア掲載文に出る文）
- `chrome://extensions/shortcuts` の各コマンド説明
- 失敗時にアイコンへマウスを乗せたときの理由

言語を足すときは `_locales/<言語コード>/messages.json` を追加するだけです（例: `zh_CN`、`ko`）。
manifest の `__MSG_xxx__` の綴り間違いや、ロケール間のキー不足は次のテストで検出できます。

```bash
node tests/i18n.js
```

## 開発メモ

- 合成キーイベント（`dispatchEvent(new KeyboardEvent(...))`）は `isTrusted=false` になり、
  YouTube 側に無視されることがあるため使っていません。DOM を直接操作します。
- 送りの経路は4段フォールバックです:
  1. `ytd-shorts.loadVideo(index)`（現行の仮想リスト API）
  2. `#shorts-inner-container` のスロットを1つ分スクロール
  3. 旧 UI の `#navigation-button-down` / `#navigation-button-up` をクリック
  4. `#shorts-container` を1画面スクロール
- アイコンの再生成: `powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1`
- ファイル構成:

```
extension/
├─ manifest.json       commands ×5（うち4つに既定キー、すべて global: true）
├─ service-worker.js   コマンド → タブ選択 → sendMessage
├─ content.js          DOM 操作（次/前/再生/ミュート/高評価）
├─ _locales/           en / ja の messages.json
└─ icons/              icon16/32/48/128.png
tests/
├─ smoke.js            content.js の動作テスト（node tests/smoke.js）
└─ i18n.js             ロケールと __MSG_ 参照の整合チェック（node tests/i18n.js）
tools/
└─ make-icons.ps1      アイコン生成
```

## 公開について

ストアには出さず、このリポジトリを公開するだけの形にしています。

- 拡張 ID は `manifest.json` の `key` で固定済みです（`cpjflhhcagpehibpdnbjmdejmclbioon`）。
  この値を変えるとショートカット設定が引き継がれません
- ライセンスは MIT（`LICENSE`）
- 権限は `tabs`（送り先タブの特定）、`scripting`（導入前から開いていたタブへの後追い注入）、
  `host_permissions`（YouTube ページの DOM 操作）の3つだけです
- ストア公開に必要な文書（プライバシー表記・申請手順・申請用 zip の作り方）は、
  必要になった時点で作り直せます（削除前のコミットに残っています）
