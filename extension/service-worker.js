// ShortUp: グローバルショートカットを YouTube タブへ中継する。
// ここでは DOM を触らない（触れない）。実際の操作は content.js 側で行う。

const ACTIONS = {
  'shorts-next': 'next',
  'shorts-prev': 'prev',
  'shorts-toggle': 'toggle',
  'shorts-like': 'like',
  'shorts-mute': 'mute',
};

chrome.commands.onCommand.addListener((command) => {
  const action = ACTIONS[command];
  if (!action) return;
  // 各 chrome API 呼び出しがサービスワーカーの寿命を延ばすので、このまま待って問題ない
  dispatch(action).catch((err) => console.warn('[ShortUp]', err));
});

async function dispatch(action) {
  const tab = await pickTab();
  if (!tab) {
    markFailure('?', 'YouTube のタブが見つかりません');
    return;
  }
  const res = await send(tab.id, action);
  if (!res || !res.ok) {
    markFailure('!', describeFailure(res));
    return;
  }
  clearFailure();
}

// ショートを開いているタブを最優先で選ぶ。
// 音が出ているタブ（＝再生中）を強く優先するので、複数タブでも取り違えにくい。
function scoreTab(tab) {
  const url = tab.url || '';
  let score = 0;
  if (/\/shorts(\/|$|\?)/.test(url)) score += 100;
  if (tab.audible) score += 20;
  if (tab.active) score += 10;
  if (tab.discarded) score -= 1000;
  return score;
}

async function pickTab() {
  const tabs = await chrome.tabs.query({ url: ['*://*.youtube.com/*'] });
  // query の url 絞り込みが効かない環境でも YouTube 以外を掴まないよう、自前でも弾く
  const youtube = tabs.filter((tab) => tab.url && /^https?:\/\/([^/]+\.)?youtube\.com\//.test(tab.url));
  if (!youtube.length) return null;
  return youtube
    .map((tab) => ({ tab, score: scoreTab(tab) }))
    .sort((a, b) => b.score - a.score)[0].tab;
}

async function send(tabId, action) {
  const message = { type: 'shortup', action };
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (_) {
    // 拡張を入れる前に開いていたタブは受信側が居ない → その場で注入してから再送
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (err) {
      return { ok: false, reason: String(err) };
    }
  }
}

// 失敗はバッジを残して知らせる（ゲーム中は一瞬で消える表示には気づけないため）。
// バッジが消えるのは次に成功したときだけ。詳細はアイコンにマウスを乗せると出る。
const REASONS = {
  'not-shorts': 'このタブはショート画面ではありません',
  'no-target': '送り先が見つかりませんでした',
  'no-video': '動画が見つかりませんでした',
  'no-like-button': '高評価ボタンが見つかりませんでした',
  'unknown-action': '不明な操作です',
};

function describeFailure(res) {
  const reason = res && res.reason;
  return REASONS[reason] || `失敗 (${reason || 'unknown'})`;
}

function markFailure(badge, title) {
  chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
  chrome.action.setBadgeText({ text: badge });
  chrome.action.setTitle({ title: `ShortUp — ${title}` });
}

function clearFailure() {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'ShortUp' });
}
