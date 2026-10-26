// ShortUp: ショートの「次へ / 前へ」などを実際に動かす部分。
//
// 設計メモ:
//   合成キーイベント（dispatchEvent(new KeyboardEvent(...))）は isTrusted=false になり
//   YouTube 側に無視されることがあるので使わない。DOM を直接操作する。
//   現行のショートは ytd-shorts の仮想リスト（loadVideo / getPlayableNextIndex）で
//   送っているので、それを第一候補にし、壊れていたらスクロール・旧UIのボタンへ順に落とす。

(() => {
  'use strict';

  // 宣言的注入と、拡張導入後に executeScript で注入される場合の二重登録を防ぐ
  if (globalThis.__shortupLoaded) return;
  globalThis.__shortupLoaded = true;

  const SEL = {
    root: 'ytd-shorts',
    container: '#shorts-container',
    slot: '#shorts-inner-container > .reel-video-in-sequence-new',
    renderer: 'ytd-reel-video-renderer',
    activeRenderer: 'ytd-reel-video-renderer[is-active]',
    video: 'video.html5-main-video, video',
    like: 'like-button-view-model button, #like-button button, ytd-toggle-button-renderer button',
  };

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const isShortsPage = () => location.pathname.startsWith('/shorts');
  const container = () => q(SEL.container);
  const shortsRoot = () => q(SEL.root);
  const slots = () => qa(SEL.slot);
  const activeRenderer = () => q(SEL.activeRenderer) || q(SEL.renderer);

  function activeVideo() {
    const renderer = activeRenderer();
    return renderer ? q(SEL.video, renderer) : q(SEL.video);
  }

  // slot の上端をコンテナ上端に合わせる（ネイティブのスナップと同じ計算）
  function alignTo(box, slot) {
    if (!box || !slot) return false;
    const delta = slot.getBoundingClientRect().top - box.getBoundingClientRect().top;
    box.scrollTop += delta;
    return true;
  }

  function nearestSlot(box, list) {
    if (!box || !list.length) return null;
    const top = box.getBoundingClientRect().top;
    return list.reduce((best, slot) => {
      const d = Math.abs(slot.getBoundingClientRect().top - top);
      const bd = Math.abs(best.getBoundingClientRect().top - top);
      return d < bd ? slot : best;
    });
  }

  function navigate(direction) {
    const box = container();
    const root = shortsRoot();
    const list = slots();

    // 1) 公式の仮想リスト API（現行のショートはこの経路で送られている）
    if (root && typeof root.loadVideo === 'function') {
      try {
        const index = direction > 0
          ? (typeof root.getPlayableNextIndex === 'function' ? root.getPlayableNextIndex() : NaN)
          : (typeof root.getPlayablePreviousIndex === 'function' ? root.getPlayablePreviousIndex() : NaN);
        if (Number.isInteger(index) && index >= 0) {
          alignTo(box, list[index]);
          root.loadVideo(index);
          return true;
        }
      } catch (_) {
        // 内部 API が変わったら下のフォールバックへ
      }
    }

    // 2) スロット1つ分スクロール（ホイールと同じ経路なので is-active も追従する）
    if (box && list.length) {
      const current = nearestSlot(box, list);
      const target = list[list.indexOf(current) + direction];
      if (target && alignTo(box, target)) return true;
    }

    // 3) 旧 UI の上下ボタン
    const button = q(direction > 0 ? '#navigation-button-down button' : '#navigation-button-up button');
    if (button) {
      button.click();
      return true;
    }

    // 4) 最後の手段
    if (box) {
      box.scrollTop += direction * box.clientHeight;
      return true;
    }
    return false;
  }

  function togglePlay() {
    const video = activeVideo();
    if (!video) return false;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    return true;
  }

  function toggleMute() {
    const video = activeVideo();
    if (!video) return false;
    video.muted = !video.muted;
    return true;
  }

  function like() {
    const renderer = activeRenderer();
    const button = renderer ? q(SEL.like, renderer) : null;
    if (!button) return false;
    // 二重に押して「高評価を外す」ことにならないよう、押下済みなら何もしない
    if (button.getAttribute('aria-pressed') === 'true') return true;
    button.click();
    return true;
  }

  function run(action) {
    if (!isShortsPage()) return { ok: false, reason: 'not-shorts' };
    // 「次へ / 前へ」は YouTube が「表示中のタブ」でしか有効な動画を切り替えない。
    // 隠れたタブで呼ぶと反映されず、表示したときに溜まった分がまとめて動いてしまうので、
    // ここで失敗を返して service worker 側にタブを前面へ切り替えさせる。
    if ((action === 'next' || action === 'prev') && document.visibilityState === 'hidden') {
      return { ok: false, reason: 'hidden' };
    }
    switch (action) {
      case 'next':
        return navigate(1) ? { ok: true } : { ok: false, reason: 'no-target' };
      case 'prev':
        return navigate(-1) ? { ok: true } : { ok: false, reason: 'no-target' };
      case 'toggle':
        return togglePlay() ? { ok: true } : { ok: false, reason: 'no-video' };
      case 'mute':
        return toggleMute() ? { ok: true } : { ok: false, reason: 'no-video' };
      case 'like':
        return like() ? { ok: true } : { ok: false, reason: 'no-like-button' };
      default:
        return { ok: false, reason: 'unknown-action' };
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== 'shortup') return;
    try {
      sendResponse(run(message.action));
    } catch (err) {
      sendResponse({ ok: false, reason: String(err) });
    }
  });
})();
