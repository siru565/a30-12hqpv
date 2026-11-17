(function () {
  const A = window.A30;
  const WED = A.KST_MS(1996, 11, 17);
  const BIRTH = A.KST_MS(2003, 8, 26);
  const fmt = n => n.toLocaleString('ko-KR');
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 카운터
  function tick() {
    const now = Date.now();
    $$('[data-days]').forEach(e => (e.textContent = fmt(A.daysSince(WED, now))));
    $$('[data-hms]').forEach(e => (e.textContent = A.clockKST(now)));
    $$('[data-parent]').forEach(e => (e.textContent = fmt(A.daysSince(BIRTH, now))));
  }
  tick();
  setInterval(tick, 1000);

  // 달 (값: docs/facts.md)
  const setMoon = (id, illum, waxing) => {
    const p = document.querySelector('#' + id + ' .moon__lit');
    if (p) p.setAttribute('d', A.moonPath(illum, waxing));
  };
  setMoon('moon-wedding', 0.42, true);
  setMoon('moon-birth', 0.08, false);

  // 선물: 이미지가 실제로 있을 때만 상자가 보인다
  let showGiftPopup = () => {};
  const gift = $('gift'), img = $('gift-img'), box = $('gift-open'), reveal = $('gift-reveal'), save = $('gift-save');
  if (gift && img && box && reveal) {
    const src = img.dataset.src;
    const probe = new Image();
    let ready = false;
    let wanted = false;
    probe.onload = () => { img.src = src; ready = true; if (wanted) showGiftPopup(); };  // 아래 선물 칸은 가운데 상자를 거친 뒤에야 생긴다
    probe.src = src;

    const DELAY = reduceMotion ? 0 : 900;
    // 아래쪽 선물 칸을 만든다 (opened: 열린 상태로 / 아니면 닫힌 상자로)
    const placeGift = opened => {
      gift.hidden = false;
      gift.classList.add('is-in');
      if (opened) openGift();
    };
    const openGift = () => {
      $('gift-tap').hidden = true;
      box.hidden = true;
      reveal.hidden = false;
    };
    box.addEventListener('click', () => {
      if (box.classList.contains('is-open')) return;
      box.classList.add('is-open');
      closePopup();
      setTimeout(() => { openGift(); reveal.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }, DELAY);
    });

    // 편지까지 다 보고 나면 화면 가운데에 선물 상자를 띄운다 (한 번만)
    let pop = null, popShown = false;
    // 열지 않고 닫으면 아래에 닫힌 상자를 둔다
    const closePopup = (dismissed) => {
      if (!pop) return;
      if (dismissed === true) placeGift(false);
      const p = pop; pop = null;
      p.classList.add('is-leaving');
      setTimeout(() => p.remove(), reduceMotion ? 0 : 400);
      document.removeEventListener('keydown', onEsc);
    };
    const onEsc = e => { if (e.key === 'Escape') closePopup(true); };
    showGiftPopup = () => {
      if (!ready) { wanted = true; return; }
      if (popShown || box.classList.contains('is-open')) return;
      popShown = true;
      pop = document.createElement('div');
      pop.className = 'giftpop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-modal', 'true');
      pop.setAttribute('aria-label', '선물');
      pop.innerHTML = '<div class="giftpop__panel"><p class="giftpop__hint">선물이 도착했어요</p></div>';
      const pbox = box.cloneNode(true);
      pbox.removeAttribute('id');
      const tap = document.createElement('p');
      tap.className = 'gift__tap';
      tap.textContent = '상자를 눌러 열어 보세요';
      pop.firstChild.append(pbox, tap);
      pop.addEventListener('click', e => { if (e.target === pop) closePopup(true); });
      pbox.addEventListener('click', () => {
        if (pbox.classList.contains('is-open')) return;
        pbox.classList.add('is-open');
        tap.hidden = true;
        setTimeout(() => {
          closePopup();
          placeGift(true);
          gift.scrollIntoView({ behavior: 'auto', block: 'start' });
        }, DELAY);
      });
      document.addEventListener('keydown', onEsc);
      document.body.appendChild(pop);
      pbox.focus({ preventScroll: true });
    };

    // 갤러리에 저장: 공유 시트(아이폰 '이미지 저장')가 되면 그걸로, 아니면 파일 다운로드
    save && save.addEventListener('click', async () => {
      const name = '30주년-선물.png';
      try {
        const blob = await (await fetch(src)).blob();
        const file = new File([blob], name, { type: blob.type || 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      const a = document.createElement('a');
      a.href = src; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
    });
  }

  // 시작 화면: '여행 시작'을 눌러야 시작한다 (JS가 돌 때만 보인다)
  const cover = $('cover'), startBtn = $('start');
  const onStart = fn => {
    if (!cover || !startBtn) { fn(); return; }
    cover.hidden = false;
    startBtn.addEventListener('click', () => {
      cover.classList.add('is-leaving');
      setTimeout(() => cover.remove(), reduceMotion ? 0 : 700);
      fn();
    }, { once: true });
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    onStart(() => {});
    $('stardust')?.remove();
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) showGiftPopup();
    }, { passive: true });
    return;
  }

  // 나타나기: 맨 위는 열 때 차례로, 정류장은 화면에 들어올 때 하나씩. 노선은 스크롤을 따라 그어진다.
  const root = document.documentElement;
  root.classList.add('reveal');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -45% 0px', threshold: 0 });
  $$('.stop, .closing, .gift').forEach(el => io.observe(el));
  // 맨 끝 요소들은 화면 가운데까지 올라오지 못하므로, 바닥에 닿으면 남은 것을 모두 보여 준다
  const revealAll = () => $$('.stop, .closing, .gift').forEach(el => el.classList.add('is-in'));
  const nearBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

  const route = document.querySelector('.route');
  let queued = false;
  const draw = () => {
    queued = false;
    if (nearBottom()) { revealAll(); if (!locked) showGiftPopup(); }
    if (!route) return;
    const r = route.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - r.top) / r.height));
    route.style.setProperty('--drawn', p.toFixed(4));
  };
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(draw); } }, { passive: true });
  window.addEventListener('resize', draw);
  draw();

  // 자동 스크롤: 끝까지 천천히 내려가는 동안 손 스크롤을 막고, 끝나면 푼다.
  const SPEED = 90; // px/초
  const block = e => { e.preventDefault(); };
  const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar']);
  const blockKeys = e => { if (SCROLL_KEYS.has(e.key)) e.preventDefault(); };
  let locked = false;
  const lock = () => {
    locked = true;
    root.classList.add('is-locked');
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', blockKeys);
  };
  const unlock = () => {
    revealAll();
    if (!locked) return;
    locked = false;
    root.classList.remove('is-locked');
    window.removeEventListener('wheel', block);
    window.removeEventListener('touchmove', block);
    window.removeEventListener('keydown', blockKeys);
  };
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  lock();
  onStart(() => {
  setTimeout(() => document.querySelector('.hero')?.classList.add('is-in'), 300);
  // 안전장치: 어떤 경우에도 일정 시간 뒤엔 풀린다
  const failsafe = setTimeout(unlock, 6000 + (maxY() / SPEED) * 1000 * 1.5 + 10000);

  setTimeout(() => {
    let y = window.scrollY, last = 0;
    function step(t) {
      if (last) y += (SPEED * (t - last)) / 1000;
      last = t;
      const end = maxY();
      if (y >= end) { window.scrollTo(0, end); clearTimeout(failsafe); unlock(); setTimeout(showGiftPopup, 1200); return; }
      window.scrollTo(0, y);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, 3800);

  // 별가루: 열 때마다 한 번
  const canvas = $('stardust');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  const dust = Array.from({ length: 60 }, () => ({
    x: Math.random() * W,
    y: -Math.random() * H * 0.6,
    r: 0.8 + Math.random() * 2.2,
    vy: 1.2 + Math.random() * 2.2,
    vx: (Math.random() - 0.5) * 0.6,
    tw: Math.random() * Math.PI * 2,
  }));
  const DURATION = 3200, FADE = 900;
  let start = null;
  function frame(t) {
    if (start === null) start = t;
    const el = t - start;
    const alpha = el > DURATION - FADE ? Math.max(0, (DURATION - el) / FADE) : 1;
    ctx.clearRect(0, 0, W, H);
    for (const d of dust) {
      d.y += d.vy; d.x += d.vx; d.tw += 0.15;
      ctx.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(d.tw));
      ctx.fillStyle = '#F2C46D';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    if (el < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
  });
})();
