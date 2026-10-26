# Changelog

このプロジェクトの主な変更点を記録します。書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/)、
バージョンは [セマンティック バージョニング](https://semver.org/lang/ja/) に従います。

## [Unreleased]

## [0.2.0] - 2026-10-26

### 追加

- 日本語 / 英語の表示（ブラウザの UI 言語に自動追従）
- ロケール整合チェック `tests/i18n.js`

### 変更

- 「ミュート切替」のコマンド説明から補足文を削除
- 失敗バッジを次に成功するまで残すように変更（ゲーム中に気づけるように）

## [0.1.0] - 2026-10-26

### 追加

- 初版。`Ctrl+Shift+1`〜`4` で 前 / 次 / 再生停止 / 高評価
- グローバルショートカット（`chrome.commands` の `global: true`）対応
- 4段フォールバックの DOM 操作
- 拡張 ID の固定（`manifest.json` の `key`）
