// ShortsRemote: グローバルショートカットを YouTube タブへ中継する。
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
  dispatch(action).catch((err) => console.warn('[ShortsRemote]', err));
});

async function dispatch(action) {
  const tab = await pickTab();
  if (!tab) {
    markFailure('?', t('errNoTab'));
    return;
  }

  // 「次へ / 前へ」は YouTube が表示中のタブでしか切り替えないので、
  // 裏タブなら前面のタブに切り替えてから送る（ウィンドウ自体は前に出さない）。
  if (action === 'next' || action === 'prev') {
    const state = await makeVisible(tab);
    if (!state.ok) {
      markFailure('!', t(state.reason));
      return;
    }
    if (state.changed) await delay(150);
  }

  const res = await send(tab.id, action);
  if (!res || !res.ok) {
    markFailure('!', describeFailure(res));
    return;
  }
  clearFailure();
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// タブをそのウィンドウの前面タブにする。最小化されている場合だけは
// ゲームのフォーカスを奪う危険があるので自動で戻さず、エラーにする。
async function makeVisible(tab) {
  const win = await chrome.windows.get(tab.windowId).catch(() => null);
  if (win && win.state === 'minimized') return { ok: false, reason: 'errMinimized' };
  if (tab.active) return { ok: true, changed: false };
  try {
    await chrome.tabs.update(tab.id, { active: true });
    return { ok: true, changed: true };
  } catch (_) {
    return { ok: true, changed: false };
  }
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
  const message = { type: 'shortsremote', action };
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

// 表示言語は Chrome の UI 言語に追従する（_locales/ 配下の messages.json）
const t = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;

// 失敗はバッジを残して知らせる（ゲーム中は一瞬で消える表示には気づけないため）。
// バッジが消えるのは次に成功したときだけ。詳細はアイコンにマウスを乗せると出る。
const REASON_KEYS = {
  'not-shorts': 'errNotShorts',
  'hidden': 'errHidden',
  'no-target': 'errNoTarget',
  'no-video': 'errNoVideo',
  'no-like-button': 'errNoLike',
  'unknown-action': 'errUnknown',
};

function describeFailure(res) {
  const reason = res && res.reason;
  const key = REASON_KEYS[reason];
  return key ? t(key) : t('errGeneric', [reason || 'unknown']);
}

function markFailure(badge, title) {
  chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
  chrome.action.setBadgeText({ text: badge });
  chrome.action.setTitle({ title: `ShortsRemote — ${title}` });
}

function clearFailure() {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'ShortsRemote' });
}
