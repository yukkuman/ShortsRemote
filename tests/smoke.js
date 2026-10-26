// content.js の動作をブラウザ無しで確認する簡易テスト。
// 使い方: node tests/smoke.js
// 実際の YouTube の DOM を模した最小のスタブを渡して、各アクションの分岐を通す。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'extension', 'content.js'), 'utf8');

function makeEnv(options) {
  const opts = options || {};
  const SLOT_HEIGHT = 800;

  let scrollTop = 0;
  let current = opts.current || 0;

  const container = {
    clientHeight: SLOT_HEIGHT,
    get scrollTop() {
      return scrollTop;
    },
    set scrollTop(value) {
      scrollTop = value;
    },
    getBoundingClientRect: () => ({ top: 0 }),
  };

  // スロットの位置はスクロール量に比例して動く（本物と同じ振る舞い）
  const slots = [0, 1, 2].map((index) => ({
    id: String(index),
    getBoundingClientRect: () => ({ top: index * SLOT_HEIGHT - scrollTop }),
  }));

  const video = {
    paused: true,
    muted: false,
    play() {
      video.paused = false;
      return Promise.resolve();
    },
    pause() {
      video.paused = true;
    },
  };

  const likeButton = {
    clicked: 0,
    attrs: {},
    click() {
      this.clicked += 1;
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    },
    closest() {
      return null;
    },
  };

  const renderer = {
    querySelector(selector) {
      if (selector.startsWith('video')) return video;
      if (selector.indexOf('like-button-view-model') >= 0) return likeButton;
      return null;
    },
  };

  const root = {};
  if (opts.withLoadVideo !== false) {
    root.loadVideo = (index) => {
      current = index;
    };
    root.getPlayableNextIndex = () => current + 1;
    root.getPlayablePreviousIndex = () => current - 1;
  }

  const bySelector = {
    'ytd-shorts': root,
    '#shorts-container': container,
    'ytd-reel-video-renderer[is-active]': renderer,
    'ytd-reel-video-renderer': renderer,
    '#navigation-button-down button': null,
    '#navigation-button-up button': null,
  };

  const document = {
    visibilityState: opts.hidden ? 'hidden' : 'visible',
    querySelector: (selector) => (selector in bySelector ? bySelector[selector] : null),
    querySelectorAll: (selector) =>
      selector === '#shorts-inner-container > .reel-video-in-sequence-new' ? slots : [],
  };

  const listeners = [];
  const sandbox = {
    document,
    location: { pathname: opts.shortsPage === false ? '/watch' : '/shorts/abcdefg' },
    chrome: { runtime: { onMessage: { addListener: (fn) => listeners.push(fn) } } },
    console,
  };
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'content.js' });

  return {
    send(action) {
      let result = null;
      for (const listener of listeners) {
        listener({ type: 'shortup', action }, {}, (res) => {
          result = res;
        });
      }
      return result;
    },
    state: () => ({ scrollTop, current, video, likeButton }),
  };
}

let failures = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  OK   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}\n       期待: ${e}\n       実際: ${a}`);
  }
}

console.log('next / prev');
{
  const env = makeEnv({ current: 0 });
  check('next は ok を返す', env.send('next'), { ok: true });
  check('next で loadVideo(1)', env.state().current, 1);
  check('next でスロット位置へスナップ', env.state().scrollTop, 800);

  check('prev は ok を返す', env.send('prev'), { ok: true });
  check('prev で loadVideo(0)', env.state().current, 0);
  check('prev で先頭へ戻る', env.state().scrollTop, 0);
}

console.log('再生 / ミュート');
{
  const env = makeEnv({});
  check('toggle は ok', env.send('toggle'), { ok: true });
  check('toggle で再生される', env.state().video.paused, false);
  env.send('toggle');
  check('もう一度 toggle で停止', env.state().video.paused, true);
  check('mute は ok', env.send('mute'), { ok: true });
  check('mute でミュート', env.state().video.muted, true);
}

console.log('高評価');
{
  const env = makeEnv({});
  check('like は ok', env.send('like'), { ok: true });
  check('like で1回クリック', env.state().likeButton.clicked, 1);
  env.state().likeButton.attrs['aria-pressed'] = 'true';
  env.send('like');
  check('押下済みなら再クリックしない', env.state().likeButton.clicked, 1);
}

console.log('フォールバック（loadVideo が無い旧 UI 相当）');
{
  const env = makeEnv({ withLoadVideo: false, current: 0 });
  check('スクロール経路でも ok', env.send('next'), { ok: true });
  check('スロット1つ分スクロールする', env.state().scrollTop, 800);
}

console.log('ショート画面ではない');
{
  const env = makeEnv({ shortsPage: false });
  check('not-shorts を返す', env.send('next'), { ok: false, reason: 'not-shorts' });
}

console.log('裏タブ（非表示）');
{
  const env = makeEnv({ hidden: true });
  check('次は hidden を返す', env.send('next'), { ok: false, reason: 'hidden' });
  check('前は hidden を返す', env.send('prev'), { ok: false, reason: 'hidden' });
  check('裏タブではスクロールさせない（溜め込み防止）', env.state().scrollTop, 0);
  check('再生停止は裏タブでも効く', env.send('toggle'), { ok: true });
  check('ミュートも効く', env.send('mute'), { ok: true });
}

console.log('未知のアクション');
{
  const env = makeEnv({});
  check('unknown-action を返す', env.send('bogus'), { ok: false, reason: 'unknown-action' });
}

console.log('');
if (failures) {
  console.log(`${failures} 件失敗`);
  process.exit(1);
}
console.log('すべて成功');
