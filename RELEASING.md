# 公開手順

## 1. リリース前チェック

- `extension/manifest.json` の `version` を上げる（`CHANGELOG.md` も同時に更新）
- 下のテストが通る（GitHub Actions でも同じものを回している）

```bash
node --check extension/service-worker.js
node --check extension/content.js
node tests/i18n.js
node tests/smoke.js
```

- Chrome / Edge / Brave の3つで読み込み直して動作確認する
- ストアに出す場合は `PRIVACY.md` の URL を用意する（GitHub のファイル URL で可）

## 2. パッケージ作成

```powershell
powershell -ExecutionPolicy Bypass -File tools/package.ps1
```

`dist/shortup-v<version>.zip` ができます。zip の直下に `manifest.json` が来る形なので、
そのままストアにアップロードできます。

## 3. GitHub Releases で配る（ストアに出さない場合）

```bash
git tag v0.2.0
git push origin v0.2.0
```

Releases に `dist/shortup-v0.2.0.zip` を添付します。
受け取る側はデベロッパーモードでの読み込みが必要になる点を README に明記してください。

## 4. Chrome ウェブストア

1. Chrome Web Store Developer Dashboard で開発者登録（初回のみ・$5）
2. 「新しいアイテム」→ 2 の zip をアップロード
3. 掲載情報を入力
   - 名前 / 説明（132 文字以内。`_locales/<lang>/messages.json` の `extDesc` と揃える）
   - カテゴリ: 生産性など
   - スクリーンショット: **1280×800 または 640×400** を1枚以上
   - プライバシー: データを収集しない旨と `PRIVACY.md` の URL
   - 権限の説明: `tabs`（送り先タブの特定）／`scripting`（導入前から開いていたタブへの後追い注入）／
     ホスト権限（YouTube ページ上の DOM 操作）
4. 審査（数日かかることがあります）
5. 公開後の更新も同じダッシュボードから zip を差し替えます

Brave は Chrome ウェブストアからそのままインストールできます。

## 5. Microsoft Edge アドオン

- Microsoft パートナーセンターで登録（無料）
- 同じ zip をアップロード

## 6. 拡張 ID について

`manifest.json` の `key` により、ID は `cpjflhhcagpehibpdnbjmdejmclbioon` に固定されています
（`node tools/extension-id.js` で再確認できます）。
**この `key` を変えるとショートカット設定が引き継がれない**ので、原則そのままにしてください。
