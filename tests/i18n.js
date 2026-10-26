// manifest と JS の i18n 参照が _locales と揃っているかを検査する。
// 使い方: node tests/i18n.js
//
// 1. manifest.json の __MSG_xxx__ が default_locale の messages.json に存在するか
// 2. JS の chrome.i18n.getMessage('xxx') が全ロケールに存在するか
// 3. 各ロケールのキーが default_locale と同じ集合か（足りないと英語が出てしまう）
// 4. messages.json の placeholders が message 内で $name$ として使われているか

const fs = require('fs');
const path = require('path');

const extensionDir = path.join(__dirname, '..', 'extension');
const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8'));
const defaultLocale = manifest.default_locale;
const localesDir = path.join(extensionDir, '_locales');

let failures = 0;
function fail(message) {
  failures += 1;
  console.log('  FAIL ' + message);
}
function ok(message) {
  console.log('  OK   ' + message);
}

function readCatalog(locale) {
  const file = path.join(localesDir, locale, 'messages.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// --- 1. default_locale とロケール一覧 ---
console.log('ロケール');
if (!defaultLocale) {
  fail('manifest.json に default_locale がありません');
} else if (!fs.existsSync(path.join(localesDir, defaultLocale))) {
  fail(`_locales/${defaultLocale} がありません`);
} else {
  ok(`default_locale = ${defaultLocale}`);
}

const locales = fs
  .readdirSync(localesDir)
  .filter((name) => fs.statSync(path.join(localesDir, name)).isDirectory());
ok(`ロケール: ${locales.join(', ')}`);

const catalogs = {};
for (const locale of locales) catalogs[locale] = readCatalog(locale);

// --- 2. manifest の __MSG_xxx__ ---
console.log('manifest のメッセージ参照');
const rawManifest = fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8');
const referenced = new Set();
for (const match of rawManifest.matchAll(/__MSG_([A-Za-z0-9_@]+?)__/g)) referenced.add(match[1]);
if (!referenced.size) {
  ok('参照なし');
}
for (const name of referenced) {
  if (!catalogs[defaultLocale] || !catalogs[defaultLocale][name]) {
    fail(`__MSG_${name}__ が _locales/${defaultLocale}/messages.json にありません`);
  } else {
    ok(`__MSG_${name}__`);
  }
}

// --- 3. JS の getMessage('xxx') ---
console.log('JS のメッセージ参照');
const jsFiles = ['service-worker.js', 'content.js'];
const jsKeys = new Set();
for (const file of jsFiles) {
  const source = fs.readFileSync(path.join(extensionDir, file), 'utf8');
  for (const match of source.matchAll(/getMessage\(\s*'([A-Za-z0-9_@]+)'/g)) jsKeys.add(match[1]);
  // ヘルパー t('key') 経由の参照も拾う
  for (const match of source.matchAll(/\bt\(\s*'([A-Za-z0-9_@]+)'/g)) jsKeys.add(match[1]);
}
if (!jsKeys.size) {
  ok('参照なし');
}
for (const key of jsKeys) {
  const missing = locales.filter((locale) => !catalogs[locale][key]);
  if (missing.length) fail(`"${key}" が ${missing.join(', ')} にありません`);
  else ok(`"${key}"`);
}

// 動的に組み立てるキー（REASON_KEYS の値）も検査する
const worker = fs.readFileSync(path.join(extensionDir, 'service-worker.js'), 'utf8');
const reasonBlock = worker.match(/const REASON_KEYS = \{([\s\S]*?)\};/);
if (reasonBlock) {
  for (const match of reasonBlock[1].matchAll(/'(err[A-Za-z0-9]+)'/g)) {
    const key = match[1];
    if (!jsKeys.has(key)) {
      jsKeys.add(key);
      const missing = locales.filter((locale) => !catalogs[locale][key]);
      if (missing.length) fail(`"${key}"（REASON_KEYS 経由）が ${missing.join(', ')} にありません`);
      else ok(`"${key}"（REASON_KEYS 経由）`);
    }
  }
}

// --- 4. ロケール間のキー集合が一致するか ---
console.log('ロケール間の整合');
const baseKeys = Object.keys(catalogs[defaultLocale] || {}).sort();
for (const locale of locales) {
  if (locale === defaultLocale) continue;
  const keys = Object.keys(catalogs[locale]).sort();
  const missing = baseKeys.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !baseKeys.includes(key));
  if (missing.length) fail(`${locale} に不足: ${missing.join(', ')}`);
  else if (extra.length) fail(`${locale} に余分: ${extra.join(', ')}`);
  else ok(`${locale} は ${baseKeys.length} 件すべて一致`);
}

// --- 5. placeholders の使用 ---
console.log('プレースホルダ');
for (const locale of locales) {
  for (const [key, entry] of Object.entries(catalogs[locale])) {
    for (const name of Object.keys(entry.placeholders || {})) {
      if (!entry.message.includes('$' + name + '$')) {
        fail(`${locale}.${key}: placeholders "${name}" が message 内で使われていません`);
      } else {
        ok(`${locale}.${key} の $${name}$`);
      }
    }
  }
}

console.log('');
if (failures) {
  console.log(`${failures} 件失敗`);
  process.exit(1);
}
console.log('すべて成功');
