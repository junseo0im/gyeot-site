// 아이콘은 index.html 맨 끝의 lucide 스크립트가 도착하면 그려요 (async). 이 파일은 아이콘을 기다리지 않아요.

// 등장 효과 · 현재 섹션 표시 · 사용 흐름 레일. 전역 이름을 만들지 않게 즉시 실행 함수로 감싸요.
// html의 no-js는 여기서 떼요. 이 파일을 못 받거나(네트워크 오류·차단) 문법 오류로 아예 돌지 않으면 no-js가 남아
// 모든 내용이 그대로 보이고, 눌러도 움직이지 않을 단계 알약과 ‹ ›는 숨겨져요 (styles.css).
// 도중에 오류로 멈추면 no-js를 다시 붙여 같은 상태로 돌아가요.
(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');   // 아래에서 레이아웃을 읽기 전에 떼요
  try {
    // 등장 효과 (동작 줄이기 설정이거나 주소에 ?static이 있으면 바로 표시)
    // ?static이면 레일·내비의 스크롤도 부드럽게 미끄러지지 않고 바로 움직여요 (index.html 머리의 is-static과 같은 조건)
    const isStatic = /[?&]static\b/.test(location.search);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || isStatic;
    const reveals = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(el => io.observe(el));
    }
    // 인쇄·PDF 저장 전에는 아직 안 본 블록도 모두 보이게 (styles.css의 @media print와 같은 일)
    window.addEventListener('beforeprint', () => reveals.forEach(el => el.classList.add('in')));

    // 현재 섹션 표시
    const links = [...document.querySelectorAll('.nav-links a')];
    const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
    // 내비 띠 안에서 링크를 가운데로 옮겨요.
    // offsetLeft는 sticky 헤더 기준이라 내비 띠의 위치(bar.offsetLeft)를 빼야 가운데에 와요
    const centerLink = (a, behavior) => {
      const bar = a.parentElement;
      bar.scrollTo({ left: a.offsetLeft - bar.offsetLeft - (bar.clientWidth - a.clientWidth) / 2, behavior });
    };
    if ('IntersectionObserver' in window) {
      const navIo = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          links.forEach(a => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
          const a = byId[e.target.id];
          if (a) {
            a.classList.add('active');
            a.setAttribute('aria-current', 'location');   // 화면 읽기 프로그램에도 지금 섹션을 알려요
            centerLink(a, reduce ? 'auto' : 'smooth');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      document.querySelectorAll('main section[id]').forEach(s => navIo.observe(s));
    }
    const navBar = document.querySelector('.nav-links');
    if (navBar) {
      // 휴대폰 폭에서 키보드로 옮겨 간 링크가 띠 끝에 반쯤 걸려 있으면, 초점 테두리까지 보이게 바로 가운데로 옮겨요
      // (크롬은 완전히 가려진 링크만 스스로 보이게 넘겨요)
      navBar.addEventListener('focusin', e => { if (e.target.matches('a')) centerLink(e.target, 'auto'); });
      // 오른쪽에 넘겨 볼 링크가 남아 있으면 띠 끝을 흐려요 (styles.css .nav-links.is-clipped).
      // 잘린 글자가 다른 말처럼 읽히지 않게 하고, 끝까지 넘기면 흐림을 꺼서 마지막 링크가 또렷해요
      const clip = () => navBar.classList.toggle('is-clipped', navBar.scrollWidth - navBar.clientWidth - navBar.scrollLeft > 2);
      navBar.addEventListener('scroll', clip, { passive: true });
      window.addEventListener('resize', clip);
      if (document.fonts) document.fonts.ready.then(clip);   // 글꼴이 바뀌면 띠 길이도 바뀌어요
      clip();
    }

    // 사용 흐름 레일
    const rail = document.getElementById('rail');
    const scenes = rail ? [...rail.querySelectorAll('.scene')] : [];
    const stepBtns = [...document.querySelectorAll('.flow-steps button')];
    const behavior = reduce ? 'auto' : 'smooth';

    // 지금 고른 단계(active)를 따로 기억해요. 태블릿처럼 한 화면에 휴대폰이 두세 대 보이면
    // '가운데에 가장 가까운 장면'만으로는 첫 장면·마지막 장면을 고를 수 없어서예요.
    // (.rail이 position: relative라 offsetLeft는 레일 기준이에요.)
    let active = 0;
    const maxScroll = () => rail.scrollWidth - rail.clientWidth;
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const target = i => { // i번째 장면을 가운데에 두는 위치 (레일 양 끝을 넘지 않게)
      const s = scenes[i];
      return Math.max(0, Math.min(maxScroll(), s.offsetLeft - (rail.clientWidth - s.clientWidth) / 2));
    };
    const show = i => {
      active = i;
      stepBtns.forEach((b, j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
      // 지금 단계의 휴대폰에 테두리 (styles.css .is-current). 넓은 화면은 휴대폰이 두세 대 함께 보여서
      // 첫·마지막 쪽에서는 ‹ ›를 눌러도 레일이 움직이지 않아요. 그때도 눌린 결과가 휴대폰에서 보여요.
      // 휴대폰 폭에서는 지금 단계가 아닌 장면의 설명을 흐리게 해요 (화면 끝에 걸린 조각이 지금 설명처럼 읽히지 않게)
      scenes.forEach((s, j) => s.classList.toggle('is-current', j === i));
      // 양 끝에서는 ‹ ›를 흐리게. disabled 대신 aria-disabled라 키보드 초점은 그대로 남아요
      if (prevBtn) prevBtn.setAttribute('aria-disabled', i === 0 ? 'true' : 'false');
      if (nextBtn) nextBtn.setAttribute('aria-disabled', i === scenes.length - 1 ? 'true' : 'false');
    };
    // 단계 알약을 누른 뒤 휴대폰 화면이 거의 안 보이면(휴대폰에서 알약이 화면 아래쪽에 있을 때)
    // 알약 묶음을 화면 위쪽으로 올려, 누른 알약과 바뀐 화면이 함께 보이게 해요
    const flowSteps = document.querySelector('.flow-steps');
    const bringRailIntoView = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rail.getBoundingClientRect().top > vh * 0.6) (flowSteps || rail).scrollIntoView({ block: 'start', behavior });
    };
    const goTo = i => {
      i = Math.max(0, Math.min(scenes.length - 1, i));
      if (!scenes[i]) return;
      show(i); // 스크롤이 일어나지 않아도(이미 그 자리) 단계 표시는 바로 바꿔요
      rail.scrollTo({ left: target(i), behavior });
    };
    const fromScroll = () => { // 손으로 넘긴 뒤 멈춘 자리에서 단계를 읽어요
      const x = rail.scrollLeft;
      if (Math.abs(x - target(active)) <= 2) return active; // 고른 단계의 자리 그대로
      if (x <= 2) return 0;
      if (x >= maxScroll() - 2) return scenes.length - 1;
      const mid = x + rail.clientWidth / 2;
      let best = 0, d = Infinity;
      scenes.forEach((s, i) => {
        const c = s.offsetLeft + s.clientWidth / 2;
        if (Math.abs(c - mid) < d) { d = Math.abs(c - mid); best = i; }
      });
      return best;
    };
    if (rail && scenes.length) {
      stepBtns.forEach(b => b.addEventListener('click', () => { goTo(+b.dataset.go); bringRailIntoView(); }));
      prevBtn.addEventListener('click', () => goTo(active - 1));   // 첫 화면에서는 움직이지 않아요 (aria-disabled)
      nextBtn.addEventListener('click', () => goTo(active + 1));   // 마지막 화면에서도 마찬가지
      rail.addEventListener('keydown', e => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;   // Alt+←(뒤로 가기) 같은 브라우저 단축키는 그대로 둬요
        const to = e.key === 'ArrowRight' ? active + 1
          : e.key === 'ArrowLeft' ? active - 1
          : e.key === 'Home' ? 0                      // Home·End는 페이지 맨 위·아래 대신 레일의 처음·끝으로
          : e.key === 'End' ? scenes.length - 1
          : null;
        if (to === null) return;
        e.preventDefault();
        goTo(to);
      });
      const settle = () => show(fromScroll());
      let t; rail.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(settle, 120); }, { passive: true });
      show(fromScroll());
    }
  } catch (err) {
    root.classList.add('no-js');   // 멈춘 곳과 관계없이 모든 내용이 보이고, 동작하지 않을 알약·‹ ›는 숨겨요
    throw err;
  }
})();

// 통계 숫자 카운트업 (prefix rt-)
// - #problem .stat .num 의 숫자를 화면에 들어올 때 한 번만 0부터 올려요. 1초, ease-out.
// - HTML에는 최종 값이 그대로 있어요. JS가 없거나, 동작 줄이기 설정이거나,
//   주소에 ?static 이 있으면 아무것도 바꾸지 않아요.
// - 처음 열었을 때 이미 보이는 숫자는 건드리지 않아요 (최종 값 → 0으로 튀는 일 없음).
// - 단위 <small>은 그대로 두고, 화면 읽기 프로그램에는 최종 값만 읽혀요.
// 위 블록처럼 즉시 실행 함수로 감싸 전역 이름을 만들지 않아요 (reduce 같은 이름도 이 안에서만 써요).
(function () {
  'use strict';
  var DURATION = 1000; // 1.1초 이하
  var SELECTOR = '#problem .stat .num';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || /[?&]static\b/.test(location.search)) return;
  if (!('IntersectionObserver' in window) || !window.requestAnimationFrame) return;

  function format(value, it) {
    var s = value.toFixed(it.decimals);
    if (it.group) {
      var parts = s.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      s = parts.join('.');
    }
    return s;
  }

  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
  }

  var items = [];
  var nums = document.querySelectorAll(SELECTOR);

  Array.prototype.forEach.call(nums, function (el) {
    // 숫자가 든 첫 텍스트 노드 (예: "7,244"), 뒤의 <small>건</small>은 그대로
    var node = null;
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && /\d/.test(n.nodeValue)) { node = n; break; }
    }
    if (!node) return;
    var raw = node.nodeValue.trim();
    if (!/^\d{1,3}(?:,\d{3})*(?:\.\d+)?$|^\d+(?:\.\d+)?$/.test(raw)) return;
    var target = parseFloat(raw.replace(/,/g, ''));
    if (!isFinite(target)) return;
    if (inView(el)) return; // 이미 보이는 숫자는 그대로 둬요

    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = raw;

    var box = document.createElement('span');
    box.className = 'rt-count';
    box.setAttribute('aria-hidden', 'true');
    var ghost = document.createElement('span'); // 최종 값으로 폭을 잡아 단위가 움직이지 않게
    ghost.className = 'rt-count-ghost';
    ghost.textContent = raw;
    var live = document.createElement('span');
    live.className = 'rt-count-live';
    box.appendChild(ghost);
    box.appendChild(live);

    var it = {
      el: el, live: live, raw: raw, target: target, node: node, sr: sr, box: box,
      decimals: (raw.split('.')[1] || '').length,
      group: raw.indexOf(',') !== -1,
      done: false
    };
    live.textContent = format(0, it);

    el.replaceChild(box, node);
    el.insertBefore(sr, box);
    items.push(it);
  });

  if (!items.length) return;

  function finish(it) {
    if (it.done) return;
    it.done = true;
    // 끝나면 원래 글자 노드로 되돌려요. 복사하거나 페이지에서 찾을 때 숫자가 한 번만 나와요.
    // 자리는 유령 숫자(최종 값)가 잡아 두었던 폭과 같아서 단위가 움직이지 않아요
    it.el.replaceChild(it.node, it.box);
    if (it.sr.parentNode) it.sr.parentNode.removeChild(it.sr);
  }

  function run(it) {
    var start = null;
    function frame(now) {
      if (it.done) return;
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / DURATION);
      if (p >= 1) { finish(it); return; }
      var eased = 1 - Math.pow(1 - p, 3); // ease-out
      it.live.textContent = format(it.target * eased, it);
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      items.forEach(function (it) { if (it.el === e.target && !it.done) run(it); });
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.75 });

  items.forEach(function (it) { io.observe(it.el); });

  // 인쇄할 때는 아직 안 본 숫자도 최종 값으로
  window.addEventListener('beforeprint', function () { items.forEach(finish); });
})();

// 여정(04) 휴대폰 폭: 단계마다 ‘달라지는 것’만 먼저 보이고, 버튼으로 두 경우를 펼쳐요 (JS가 없으면 모두 보여요)
(function () {
  document.querySelectorAll('.jr-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var st = b.closest('.jr-stage');
      var open = st.classList.toggle('is-open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.querySelector('span').textContent = open ? '접기' : '두 경우 자세히 보기';
    });
  });
})();
