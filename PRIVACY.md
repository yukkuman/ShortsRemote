# プライバシーポリシー / Privacy Policy

最終更新: 2026-10-26

## 日本語

ShortUp（以下「本拡張」）は、**いかなる個人情報も収集・送信・保存しません。**

- 外部サーバーとの通信は一切行いません（解析・テレメトリ・広告なし）
- 閲覧履歴・cookie・アカウント情報を読み取りません
- 入力内容を記録・送信しません
- 本拡張が保存する設定はありません（キーの割り当ては Chrome 自身の設定画面に保存されます）

### 権限の用途

| 権限 | 用途 |
|---|---|
| `tabs` | ショートを開いているタブを特定するため。URL の判定にのみ使用します |
| `scripting` | 本拡張の導入前から開いていたタブに、操作スクリプトを後追いで注入するため |
| `host_permissions`（`*://*.youtube.com/*`） | YouTube のページ上で DOM を操作するため |

これらの情報が端末外へ出ることはありません。

## English

ShortUp (the "extension") **collects, transmits and stores no personal data.**

- It makes no network requests (no analytics, telemetry or advertising)
- It does not read your browsing history, cookies or account information
- It does not record or transmit what you type
- It stores no settings of its own (shortcut assignments live in Chrome's own settings screens)

### Why each permission is needed

| Permission | Purpose |
|---|---|
| `tabs` | To find the tab that has a Short open. Used only to inspect URLs |
| `scripting` | To inject the content script into tabs that were opened before the extension was installed |
| `host_permissions` (`*://*.youtube.com/*`) | To operate the DOM on YouTube pages |

None of this information leaves your device.
