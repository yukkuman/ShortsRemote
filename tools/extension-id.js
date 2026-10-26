// manifest.json の "key" から Chrome の拡張IDを計算する。
// 使い方: node tools/extension-id.js
// Chrome は「公開鍵DERの SHA-256 の先頭 16 バイト」を 16進にし、0-9a-f を a-p に置き換えたものを ID にする。

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const manifestPath = path.join(__dirname, '..', 'extension', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (!manifest.key) {
  console.error('manifest.json に "key" がありません');
  process.exit(1);
}

const der = Buffer.from(manifest.key, 'base64');
const hex = crypto.createHash('sha256').update(der).digest('hex').slice(0, 32);
const id = hex
  .split('')
  .map((c) => String.fromCharCode(97 + parseInt(c, 16)))
  .join('');

console.log(`拡張ID: ${id}`);
