/* VCFO Suite prototype glue: routing between screens, the floating Prototype control,
   sidebar/top-bar navigation, icon tooltips (rule 17) and a feedback fallback so no control is dead. */
(function () {
  if (window.__vcfoProto) return; window.__vcfoProto = true;

  /* ---------- theme: light, dark (True black) or follow the system; remembered across pages ---------- */
  (function () {
    var KEY = 'vcfo.theme', mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    function saved() { try { var v = JSON.parse(localStorage.getItem(KEY)); return v === 'dark' || v === 'system' ? v : 'light'; } catch (e) { return 'light'; } }
    function resolved() { var m = saved(); return m === 'system' ? (mq && mq.matches ? 'dark' : 'light') : m; }
    function apply() {
      var t = resolved(), r = document.documentElement;
      r.setAttribute('data-theme', t); r.style.colorScheme = t;
      [].forEach.call(document.querySelectorAll('button[aria-label],a[aria-label],[role="button"][aria-label]'), function (b) {
        if (!/theme/i.test(b.getAttribute('aria-label'))) return;
        var lab = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        b.setAttribute('aria-label', lab); b.setAttribute('aria-pressed', String(t === 'dark'));
        if (b.hasAttribute('data-tip')) b.setAttribute('data-tip', lab);
        if (b.hasAttribute('title')) b.setAttribute('title', lab);
      });
    }
    window.vcfoSetTheme = function (m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} apply(); };
    window.vcfoToggleTheme = function () { window.vcfoSetTheme(resolved() === 'dark' ? 'light' : 'dark'); };
    if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (saved() === 'system') apply(); });
    window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); });
    apply();
    document.addEventListener('DOMContentLoaded', apply);
    window.addEventListener('load', function () { apply(); setTimeout(apply, 400); });
    /* every moon / sun button in the prototype is labelled "...theme..."; one handler for all of them */
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[aria-label],a[aria-label],[role="button"][aria-label]');
      if (!b || !/theme/i.test(b.getAttribute('aria-label'))) return;
      e.preventDefault(); e.stopPropagation(); window.vcfoToggleTheme();
    }, true);
    var ds = document.createElement('style'); ds.id = 'vp-dark';
    ds.textContent = [
      'html{color-scheme:light}',
      'html[data-theme="dark"]{color-scheme:dark;' +
        '--bg:#111821;--panel:#18202b;--raised:#1f2935;--border:#2c3745;--hair:#232d3a;' +
        '--fg:oklch(92% 0.005 260);--muted:oklch(72% 0.008 260);--subtle:oklch(60% 0.01 260);' +
        '--primary:oklch(68% 0.16 255);--primary-dark:oklch(76% 0.13 255);--primary-light:oklch(22% 0.06 258);--primary-chip:oklch(50% 0.17 258);' +
        '--navy:oklch(46% 0.15 258);--navy-ink:oklch(94% 0.008 255);--navy-2:oklch(52% 0.15 258);--navy-3:oklch(56% 0.15 255);' +
        '--navy-deep:oklch(19% 0.05 258);--navy-2-deep:oklch(23% 0.07 258);--navy-3-deep:oklch(29% 0.1 255);--primary-fill:oklch(52% 0.19 258);--primary-fill-2:oklch(58% 0.18 258);' +
        '--gold:#e0bd66;--gold-2:#ecd08a;--gold-soft:oklch(25% 0.05 85);--gold-text:#e8c97d;' +
        '--ok:oklch(68% 0.14 165);--ok-light:oklch(23% 0.05 165);--ok-text:oklch(80% 0.1 165);--ok-chip:oklch(50% 0.12 165);' +
        '--due:oklch(74% 0.15 62);--due-light:oklch(25% 0.06 60);--due-text:oklch(84% 0.11 68);--due-chip:oklch(54% 0.15 45);' +
        '--over:oklch(66% 0.19 22);--over-light:oklch(23% 0.07 22);--over-text:oklch(80% 0.12 22);--over-chip:oklch(52% 0.19 22);' +
        '--prog:oklch(66% 0.15 252);--prog-light:oklch(23% 0.06 252);--prog-text:oklch(80% 0.1 252);--prog-chip:oklch(50% 0.16 252);' +
        '--up:oklch(40% 0.015 255);--up-light:oklch(18% 0.008 255);--up-text:oklch(72% 0.01 255);--up-chip:oklch(40% 0.02 258);' +
        '--violet:oklch(68% 0.15 292);--violet-light:oklch(24% 0.06 292);--violet-chip:oklch(52% 0.16 292);--violet-text:oklch(80% 0.1 292);--violet-soft:oklch(28% 0.07 292);' +
        '--sky:oklch(68% 0.11 228);--sky-light:oklch(23% 0.05 228);--sky-chip:oklch(52% 0.11 230);' +
        '--teal:oklch(66% 0.1 195);--teal-light:oklch(23% 0.05 195);--teal-chip:oklch(58% 0.09 195);' +
        '--you:oklch(70% 0.15 55);--you-light:oklch(25% 0.06 55);--you-text:oklch(84% 0.1 60);' +
        '--with:oklch(66% 0.15 262);--with-light:oklch(23% 0.06 262);--with-text:oklch(80% 0.1 262);' +
        '--own-you:oklch(26% 0.05 85);--own-you-t:#e8c97d;--own-sbc:oklch(23% 0.05 262);--own-sbc-t:oklch(80% 0.1 262);' +
        '--folder:oklch(72% 0.1 255);--folder-open:oklch(78% 0.1 255);--sk:oklch(20% 0.008 260);--cv:oklch(20% 0.008 260);' +
        '--shadow:0 0 0 1px oklch(20% 0.008 260);--pop:0 18px 44px -12px rgba(0,0,0,.9)}',
      'html[data-theme="dark"],html[data-theme="dark"] body{background:#000}',
      /* the sidebar and the page-level sidebar placeholders are hard-coded navy; True black takes them to black */
      'html[data-theme="dark"] .vps,html[data-theme="dark"] .vh-side,html[data-theme="dark"] .tb-side{background:#000!important}',
      'html[data-theme="dark"] .vps:not(.vps-mbar){box-shadow:inset -1px 0 0 oklch(20% 0.008 260)}',
      'html[data-theme="dark"] .vps .vps-i[aria-current=page]{background:oklch(17% 0.02 260)}',
      'html[data-theme="dark"] .vps.vps-icons .vps-i .vps-b{box-shadow:0 0 0 2px #000}',
      /* switch knobs stay light so on/off reads at a glance */
      'html[data-theme="dark"] .tgl::after{background:oklch(92% 0.005 260)}',
      /* document previews: a light-only island, white paper with the original ink */
      'html[data-theme="dark"] [data-paper]{color-scheme:light;background:#fff!important;color:oklch(21% 0.042 264);' +
        '--fg:oklch(21% 0.042 264);--muted:oklch(46% 0.028 258);--subtle:oklch(55% 0.022 255);--hair:oklch(94.8% 0.007 255);' +
        '--border:oklch(92.2% 0.011 255);--raised:oklch(96.6% 0.007 255);--panel:#fff;--navy:#15263b;--navy-ink:#15263b}',
      /* Credentials: per-authority colours, slate accent */
      'html[data-theme="dark"] :is(.cr-card,.cr-ctile)[data-auth=mca]{--a:oklch(62% 0.15 278);--a-bg:oklch(24% 0.06 278);--a-fg:oklch(84% 0.08 278)}',
      'html[data-theme="dark"] :is(.cr-card,.cr-ctile)[data-auth=it]{--a:oklch(62% 0.1 200);--a-bg:oklch(23% 0.05 200);--a-fg:oklch(84% 0.07 200)}',
      'html[data-theme="dark"] :is(.cr-card,.cr-ctile)[data-auth=gst]{--a:oklch(62% 0.12 155);--a-bg:oklch(23% 0.05 155);--a-fg:oklch(84% 0.08 155)}',
      'html[data-theme="dark"] :is(.cr-card,.cr-ctile)[data-auth=oth]{--a:oklch(70% 0.13 72);--a-bg:oklch(25% 0.06 72);--a-fg:oklch(86% 0.09 75)}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(ds);
  })();
  var me = document.currentScript && document.currentScript.src || '';
  var ROOT = '';   // v6: one file, every path is root-relative (the shell serves them)
  function curPath() { return window.__VPATH || location.pathname; }
  function curUrl() { return curPath() + location.hash; }
  function pathOf(u) { return String(u).split('#')[0]; }
  function hashOf(u) { var i = String(u).indexOf('#'); return i < 0 ? '' : String(u).slice(i); }
  function injectScript(name, onload) { if (window.__vcfoInject) { var s = window.__vcfoInject(name); if (onload) onload(); return s; } var sc = document.createElement('script'); sc.src = resolveRoot(name); sc.onload = onload || null; document.head.appendChild(sc); return sc; }
  function resolveRoot(u) { try { if (/^https?:$/.test(location.protocol)) return new URL(u, location.origin + '/').href; } catch (e) {} return u; }   // dev server: paths are root-relative
  function vcfoNav(u) { pushHist(); if (window.vcfoNav) return window.vcfoNav(u); location.href = resolveRoot(u); }
  function histGet() { try { return JSON.parse(sessionStorage.getItem('vcfo.hist')) || []; } catch (e) { return []; } }
  function histSet(h) { try { sessionStorage.setItem('vcfo.hist', JSON.stringify(h.slice(-40))); } catch (e) {} }
  function pushHist() { var h = histGet(), c = curUrl(); if (h[h.length - 1] !== c) { h.push(c); histSet(h); } }
  function goBack() {
    try { if (window.parent !== window && window.parent.__vcfoAppBack) { window.parent.__vcfoAppBack(); return; } } catch (e) {}
    var h = histGet(), c = curUrl();
    while (h.length && h[h.length - 1] === c) h.pop();
    var u = h.pop(); histSet(h);
    if (!u) { toast('This is the first screen you opened'); return; }
    if (window.vcfoNav) window.vcfoNav(u); else location.href = resolveRoot(u);
  }
  window.vcfoBack = goBack;
  function samePage(u) { return pathOf(u).replace(/^\/+/, '') === String(curPath()).replace(/^\/+/, ''); }
  var R = window.__VCFO_ROUTES || {};
  var LEADPG = /(^|\/)s\/(lead|mgr|admin|super|dev)\//.test(String(window.__VPATH || location.pathname));
  var MGRPG = /(^|\/)s\/mgr\//.test(String(window.__VPATH || location.pathname));   // v9: a Manager portal screen (shares the Lead nav, mgr-* routes)
  var ADMPG = /(^|\/)s\/admin\//.test(String(window.__VPATH || location.pathname)), SUPPG = /(^|\/)s\/super\//.test(String(window.__VPATH || location.pathname)), DEVPG = /(^|\/)s\/dev\//.test(String(window.__VPATH || location.pathname)), PRE = DEVPG ? 'dev-' : SUPPG ? 'super-' : (ADMPG ? 'admin-' : (MGRPG ? 'mgr-' : ''));
  function rmap(k) { return (PRE && k && /^lead-/.test(k) && R[PRE + k.slice(5)]) ? PRE + k.slice(5) : k; }   // v8: a Lead portal screen          // route -> {d: desktop path, m: mobile path, t: title}
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('vcfo.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('vcfo.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function device() { var d = store.get('device', null); return d || (innerWidth < 700 ? 'mobile' : 'desktop'); }
  function pathFor(route) {
    var r = R[route]; if (!r) return null;
    if (route === 'home' && store.get('after', false)) r = R['home-after'] || r;
    return (device() === 'mobile' && r.m) ? r.m : r.d;
  }
  function here() {
    var p = curPath(), best = null;
    Object.keys(R).forEach(function (k) {
      [R[k].d, R[k].m].forEach(function (x) { if (x && p.slice(-x.split('#')[0].length) === x.split('#')[0] && (!x.split('#')[1] || location.hash === '#' + x.split('#')[1])) best = best || k; });
    });
    if (!best) Object.keys(R).forEach(function (k) { [R[k].d, R[k].m].forEach(function (x) { if (x && p.slice(-x.split('#')[0].length) === x.split('#')[0]) best = best || k; }); });
    return best;
  }
  function go(route, extra) {
    route = rmap(route);
    var p = pathFor(route); if (!p) { toast('“' + route + '” is not part of this prototype'); return; }
    var url = ROOT + p + (extra || '');
    if (curUrl() === url || (here() === route && !extra)) { toast('You are already on ' + ((R[route] && R[route].t) || route)); return; }
    if (pathOf(url) === curPath() && hashOf(url) !== location.hash) { location.hash = hashOf(url); return; }
    if (reduce) { vcfoNav(url); return; }
    document.documentElement.classList.add('vp-leave'); setTimeout(function () { vcfoNav(url); }, 140);
  }
  window.vcfoGo = go; window.vcfoHere = here;

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '#vp-bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:6px;padding:5px;border-radius:10px;background:#15263b;box-shadow:0 12px 30px -10px rgba(8,20,40,.55);font:600 12px Public Sans,system-ui,sans-serif;color:#fff}',
    '#vp-bar .vp-tag{padding:0 8px;color:#e9792f;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:11px}',
    '#vp-bar .vp-seg{position:relative;display:flex;background:rgba(255,255,255,.1);border-radius:8px;padding:2px}',
    '#vp-bar .vp-seg button{position:relative;z-index:1;border:0;background:none;color:rgba(255,255,255,.75);font:600 12px Public Sans,sans-serif;height:26px;padding:0 10px;border-radius:6px;cursor:pointer}',
    '#vp-bar .vp-seg button[aria-pressed=true]{background:light-dark(#fff, oklch(13% 0 89.9));color:light-dark(#15263b, oklch(88.7% 0.047 254.4))}',
    '#vp-bar select{height:30px;border-radius:6px;border:0;background:rgba(255,255,255,.12);color:#fff;font:600 12px Public Sans,sans-serif;padding:0 8px;max-width:210px}',
    '#vp-bar select option{color:light-dark(#15263b, oklch(88.7% 0.047 254.4))}',
    '#vp-bar .vp-role button[aria-pressed=true]{background:#e9792f;color:#15263b}',
    '#vp-bar .vp-back{height:30px;border:0;border-radius:6px;background:rgba(255,255,255,.12);color:#fff;font:700 12px Public Sans,sans-serif;padding:0 10px;cursor:pointer}',
    '#vp-bar .vp-back:hover{background:rgba(255,255,255,.2)}',
    '#vp-bar .vp-x{width:26px;height:26px;border:0;border-radius:6px;background:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:14px}',
    '#vp-mini{position:fixed;left:14px;bottom:14px;z-index:2147483000;border:0;border-radius:8px;background:#15263b;color:#e9792f;font:800 11px Public Sans,sans-serif;letter-spacing:.08em;padding:8px 10px;cursor:pointer;box-shadow:0 8px 20px -8px rgba(8,20,40,.5)}',
    '#vp-toast{position:fixed;left:50%;bottom:64px;transform:translate(-50%,12px);opacity:0;z-index:2147483001;display:flex;align-items:center;gap:12px;max-width:min(560px,calc(100vw - 32px));padding:10px 12px 10px 14px;border-radius:8px;background:#15263b;color:#fff;font:600 13px Public Sans,sans-serif;box-shadow:0 18px 40px -14px rgba(8,20,40,.6);transition:opacity .18s,transform .22s cubic-bezier(.22,1,.36,1);pointer-events:none}',
    '#vp-toast.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}',
    '#vp-toast button{border:0;background:rgba(255,255,255,.14);color:#f2a65e;font:700 12px Public Sans,sans-serif;height:28px;padding:0 10px;border-radius:6px;cursor:pointer}',
    '#vp-tip{position:fixed;z-index:2147483002;pointer-events:none;background:#15263b;color:#fff;font:700 12px/1.3 Public Sans,sans-serif;padding:5px 9px;border-radius:6px;white-space:nowrap;opacity:0;transform:translateY(3px);transition:opacity .12s,transform .12s}',
    '#vp-tip.on{opacity:1;transform:none}',
    'html.vp-enter body{animation:vpIn .26s cubic-bezier(.22,1,.36,1) both}',
    'html.vp-leave body{opacity:.35;transition:opacity .14s}',
    '@keyframes vpIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    'html.vp-mobile body{background:light-dark(#e3e6eb, oklch(25% 0.01 258.3))}',
    /* pop-ups always on top: drill-downs and dialogs escape their card's stacking context (rule 14 · item 14) */
    /* no visible scrollbars anywhere; scrolling still works (item 11) */
    'html,body,*{scrollbar-width:none!important}',
    '*::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}',
    '.ov{position:fixed!important;inset:0!important;z-index:2147482000!important}',
    '.ddscrim{position:fixed!important;inset:0!important;z-index:2147482000!important}',
    '.dd{position:fixed!important;z-index:2147482001!important;top:max(72px,8vh)!important;max-height:calc(100vh - 110px);overflow:auto!important}',
    ':is(.card,.kpi,section,.stag>*,.sc-host,dc-import):has([style*="z-index:201"],[style*="z-index: 201"]){transform:none!important;z-index:2147481500!important;position:relative}',
    '#vp-drill-scrim{position:fixed;inset:0;z-index:2147482000;background:rgba(8,20,40,.5);display:flex;align-items:flex-start;justify-content:center;padding:max(72px,8vh) 16px 16px;opacity:0;transition:opacity .18s}',
    '#vp-drill-scrim.on{opacity:1}',
    'html.vp-mobile x-dc~div,html.vp-mobile body>div:first-of-type{margin:0 auto}',
    '@media (max-width:700px){#vp-bar{top:62px;bottom:auto;flex-wrap:wrap;justify-content:center;width:calc(100% - 20px)}#vp-bar select{max-width:none;flex:1}#vp-toast{bottom:100px}}',
    '@media (prefers-reduced-motion: reduce){html.vp-enter body{animation:none}#vp-toast,#vp-tip{transition:none}}'
  ].join('\n');
  document.head.appendChild(css);
  document.documentElement.classList.add('vp-enter');
  if (device() === 'mobile' && R[here()] && R[here()].m && curPath().indexOf(R[here()].m.split('#')[0]) >= 0) document.documentElement.classList.add('vp-mobile');

  /* ---------- toast ---------- */
  var toastEl, toastT;
  function toast(msg, undo, cb) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'vp-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '';
    var s = document.createElement('span'); s.textContent = msg; toastEl.appendChild(s);
    if (undo) { var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Undo'; b.onclick = function () { if (typeof cb === 'function') cb(); toast('Undone'); }; toastEl.appendChild(b); }
    toastEl.classList.add('on'); toastEl.setAttribute('data-n', String((+toastEl.getAttribute('data-n') || 0) + 1)); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 3200);
  }
  window.vcfoToast = toast;

  /* ---------- floating Prototype control ---------- */
  function buildBar() {
    if (store.get('barHidden', innerWidth < 700)) {
      var mini = document.createElement('button'); mini.id = 'vp-mini'; mini.type = 'button'; mini.textContent = 'PROTOTYPE';
      mini.onclick = function () { store.set('barHidden', false); mini.remove(); buildBar(); };
      document.body.appendChild(mini); return;
    }
    var bar = document.createElement('div'); bar.id = 'vp-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Prototype controls');
    var tag = document.createElement('span'); tag.className = 'vp-tag'; tag.textContent = 'Prototype'; bar.appendChild(tag);
    var bk = document.createElement('button'); bk.type = 'button'; bk.className = 'vp-back'; bk.textContent = '‹ Back'; bk.setAttribute('aria-label', 'Back to the previous screen'); bk.onclick = goBack; bar.appendChild(bk);
    function seg(opts, cur, on) {
      var g = document.createElement('div'); g.className = 'vp-seg' + (arguments[3] ? ' ' + arguments[3] : '');
      opts.forEach(function (o) { var b = document.createElement('button'); b.type = 'button'; b.textContent = o[1]; b.setAttribute('aria-pressed', String(o[0] === cur)); b.onclick = function () { on(o[0]); }; g.appendChild(b); });
      bar.appendChild(g);
    }
    var role = DEVPG ? 'dev' : SUPPG ? 'super' : (ADMPG ? 'admin' : (MGRPG ? 'mgr' : (LEADPG ? 'lead' : 'client')));
    seg([['client', 'Client'], ['lead', 'Lead'], ['mgr', 'Manager'], ['admin', 'Admin'], ['super', 'Super admin'], ['dev', 'Developer']], role, function (v) { if (v === role) return; store.set('role', v); go({ mgr: 'mgr-home', lead: 'lead-home', admin: 'admin-home', super: 'super-home', dev: 'dev-home' }[v] || 'home'); }, 'vp-role');
    if (!LEADPG) seg([[false, 'Before COI'], [true, 'After COI']], store.get('after', false), function (v) { setAfter(v); }, 'vp-ab');
    seg([['desktop', 'Desktop'], ['mobile', 'Mobile 390']], device(), function (v) { store.set('device', v); var h = here() || 'home'; go(h.indexOf('home') === 0 ? 'home' : h); });
    var sel = document.createElement('select'); sel.setAttribute('aria-label', 'Go to page');
    var cur = here();
    Object.keys(R).forEach(function (k) { if (R[k].hide) return; if ((R[k].role || 'client') !== role) return; var o = document.createElement('option'); o.value = k; o.textContent = R[k].t || k; if (k === cur) o.selected = true; sel.appendChild(o); });
    sel.onchange = function () { go(sel.value); };
    bar.appendChild(sel);
    var x = document.createElement('button'); x.className = 'vp-x'; x.type = 'button'; x.setAttribute('aria-label', 'Hide prototype controls'); x.textContent = '×';
    x.onclick = function () { store.set('barHidden', true); bar.remove(); buildBar(); };
    bar.appendChild(x);
    document.body.appendChild(bar);
  }

  /* Before | After: one stored state (vcfo.after) shared by the bottom bar, the top-bar pill and the phone drawer */
  function syncAfter() {
    var v = !!store.get('after', false), seg = document.querySelector('#vp-bar .vp-seg.vp-ab');
    if (seg) [].forEach.call(seg.querySelectorAll('button'), function (b, i) { b.setAttribute('aria-pressed', String((i === 1) === v)); });
    if (window.vcfoSyncBA) window.vcfoSyncBA();
  }
  function goHome() {
    var p = pathFor('home'); if (!p) return;
    var url = ROOT + p; if (curUrl() === url) return;
    var same = samePage(url);
    var run = function () {
      pushHist(); if (window.vcfoNav) return window.vcfoNav(url);
      if (same) { location.hash = hashOf(url); location.reload(); return; }   // mobile.html reads #after once, at load
      location.href = resolveRoot(url);
    };
    if (reduce) return run();
    document.documentElement.classList.add('vp-leave'); setTimeout(run, 140);
  }
  function setAfter(v) {
    v = !!v; store.set('after', v); syncAfter();
    try { document.dispatchEvent(new CustomEvent('vcfo-after', { detail: v })); } catch (e) {}   // screens that are not Home re-render in place
    var h = here();
    if (!h || h.indexOf('home') === 0) goHome(); else toast(v ? 'Showing the company after incorporation' : 'Showing the company before incorporation');
  }
  window.vcfoSetAfter = setAfter;

  /* ---------- navigation map ---------- */
  var SIDE = [['Home', 'home'], ['Updates', 'notifications'], ['Incorporation', 'incorporation'], ['Compliances', 'compliances'], ['Calendar', 'compliances'], ['Filings', 'filings'], ['Documents', 'documents'], ['Library', 'knowledge-bank'], ['Knowledge bank', 'knowledge-bank'], ['Team', 'team'], ['Audit', 'audit']];
  function label(el) { return ((el.getAttribute('aria-label') || el.getAttribute('data-tip') || el.textContent || el.title || '') + '').replace(/\s+/g, ' ').trim(); }
  function navTargetC(el) {
    var t = label(el);
    var inSide = el.closest('aside, .snav, nav[aria-label="Main"]');
    if (inSide) {
      for (var i = 0; i < SIDE.length; i++) if (t.indexOf(SIDE[i][0]) === 0) return SIDE[i][1];
      if (/· Client|Account|Settings/.test(t)) return 'settings';
    }
    if (/^Announcements/.test(t)) return 'announcements';
    if (/^Notifications/.test(t)) return 'notifications';
    if (/^Open Ask VCFO|^Ask VCFO( about this| why)?$|^Ask VCFO about/.test(t)) return 'chat';
    if (/^Settings$/.test(t)) return 'settings';
    return null;
  }
  var KIND = [
    [/download/i, function (t) { return ['Download started · ' + t.replace(/^download\s*/i, ''), false]; }],
    [/zip/i, function () { return ['Preparing the ZIP…', false]; }],
    [/upload|choose file|take photo/i, function () { return ['Choose a file to upload', false]; }],
    [/copy/i, function () { return ['Link copied', false]; }],
    [/whatsapp|call |^call|email|teams/i, function (t) { return ['Opening ' + t + '…', false]; }],
    [/portal|↗/i, function (t) { return ['Opens the official portal in a new tab', false]; }],
    [/approve|submit|send|save|mark|confirm|request|remind|resend|cancel invite|hand off|turn on|turn off/i, function (t) { return [t + ' · done', true]; }],
    [/search/i, function () { return ['Search · type to find steps, filings and documents', false]; }]
  ];
  function chatQuestion(el) {
    if (!/about this/i.test(label(el))) return '';
    var box = el.closest('section,.card,[role="dialog"],.pop,article,li');
    var h = box && box.querySelector('h1,h2,h3,h4,strong,b');
    var t = h ? (h.textContent || '').replace(/\s+/g, ' ').trim() : '';
    return t ? 'Tell me about ' + t : 'Tell me more about this';
  }
  function fallbackMsg(el) {
    var t = label(el) || 'This control';
    for (var i = 0; i < KIND.length; i++) if (KIND[i][0].test(t)) return KIND[i][1](t);
    return [t.length > 60 ? t.slice(0, 57) + '…' : t, false];
  }

  /* ---------- click handling ---------- */
  var muts = 0;
  function countMuts(l) { l.forEach(function (m) { var t = m.target.nodeType === 1 ? m.target : m.target.parentNode; if (!t || !t.closest || !t.closest('#vp-tip,#vp-toast,#vp-bar,#vp-mini,#vp-launch,#vp-chat,.vps,#vp-drawer-scrim,#vp-drill-scrim')) muts++; }); }
  var muObs = new MutationObserver(countMuts); window.vcfoQuiet = function (fn) { countMuts(muObs.takeRecords()); fn(); muObs.takeRecords(); }; muObs.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
  var LSIDE = [[/^Overview/, 'lead-home'], [/^Connections/, 'lead-connections'], [/^Messages/, 'lead-messages'], [/^Jobs/, 'lead-jobs'], [/^Logs$/, 'lead-logs'], [/^Deploys$/, 'lead-deploys'], [/^Access$/, 'lead-access'], [/^Data and costs$/, 'lead-data'], [/^Practice areas|^Incorporation$/, 'lead-incorporation'], [/^Registrations$/, 'lead-registrations'], [/^Firm settings$/, 'lead-settings'], [/^Obligations$/, 'lead-obligations'], [/^Team$/, 'lead-team'], [/^Risks/, 'lead-risks'], [/^Growth$/, 'lead-growth'], [/^Reports$/, 'lead-reports'], [/^Managers|^(Pranay|Priya Raman|Arjun Mehta)$/, 'lead-managers'], [/^VCFO Suite/, 'lead-home'], [/^Today/, 'lead-home'], [/^Work/, 'lead-work'], [/^Project leads|^My [Ll]eads|^All 3 leads|^(Sneha|Meera|Rohan) /, 'lead-leads'], [/^Clients/, 'lead-clients'], [/^View all/, 'lead-clients'],
    [/^(Northwind|Orchid|Brightwave|Kestrel|Tidewater|Halcyon|Larkspur|Juniper|Saffron|Monsoon|Indigo|Banyan|Coral|Quartz|Pinecrest|Saltmarsh|Ember)/, 'lead-overview'], [/^Email/, 'lead-email'], [/^Docs/, 'lead-documents'],
    [/^Vault/, 'lead-vault'], [/^Knowledge/, 'lead-knowledge-bank'], [/^Updates/, 'lead-announcements'], [/^Announcements/, 'lead-announcements'],
    [/^Notifications/, 'lead-notifications'], [/^Compliances/, 'lead-compliances'], [/^Calendar/, 'lead-compliances'], [/^Filings/, 'lead-filings'],
    [/^Analytics/, 'lead-analytics'], [/^Audit/, 'lead-audit'], [/^October|compliance calendar/i, 'lead-compliances'], [/Project lead|^Settings/, 'lead-settings']];
  function leadNav(el, t) {
    var h = (here() || '').replace(/^(mgr|admin|super|dev)-/, 'lead-');
    if (el.closest('[data-crumb]')) { var CR = { Home: 'lead-home', Today: 'lead-home', Clients: 'lead-clients', Work: 'lead-work', Updates: 'lead-announcements', Compliances: 'lead-compliances', Docs: 'lead-vault' }; if (CR[t]) return CR[t]; if (/^(Northwind|Orchid|Brightwave|Kestrel|Tidewater|Halcyon|Larkspur|Juniper|Saffron|Monsoon|Indigo|Banyan|Coral|Quartz|Pinecrest|Saltmarsh|Ember)/.test(t)) return 'lead-overview'; return null; }
    if (el.closest('aside') && /^(Bharath|Sneha|Meera) /.test(t)) { try { sessionStorage.setItem('vcfo.lead', t.split(' ')[0]); } catch (e) {} }
    if (el.closest('aside')) { for (var i = 0; i < LSIDE.length; i++) if (LSIDE[i][0].test(t)) return LSIDE[i][1]; return null; }
    if (/^Plan my week/.test(t)) return 'lead-work-plan';
    if (h === 'lead-work' && /^(List|Board)$/.test(t)) return 'lead-work-board';
    if (h === 'lead-work-board' && /^Planner$/.test(t)) return 'lead-work';
    if (h === 'lead-work' && /^Request change$/.test(t)) return 'lead-work-drawer';
    if ((h === 'lead-work-plan' || h === 'lead-work-drawer') && /^(Close|Cancel)$/.test(t)) return 'lead-work';
    if (/^Board resolution/.test(t)) return 'lead-board-resolution';
    if (/^Documents \d/.test(t)) return 'lead-documents';
    if (/^Open calendar|^Calendar$/.test(t)) return 'lead-compliances';
    if (/^Filings$/.test(t)) return 'lead-filings';
    if (h === 'lead-clients' && el.matches('a.row')) return 'lead-overview';
    if (h === 'lead-overview' && /^Back$/.test(t)) return 'lead-clients';
    if (h === 'lead-overview' && /^Open (current )?step/.test(t)) return 'lead-step';
    if (/^Search/.test(t) && el.closest('header,[data-vp=top]')) return 'lead-search';
    return null;
  }
  function navTarget(el) {
    if (!LEADPG) return navTargetC(el);
    var ln = leadNav(el, label(el)); if (ln) return rmap(ln);
    var c = navTargetC(el);
    if (c === 'chat') return c;
    if (c === 'home') return rmap('lead-home');
    return c && R['lead-' + c] ? rmap('lead-' + c) : null;
  }
  var FG = 'lead-filings', ST = { f: ['Filed', '#1e7f55'], d: ['Due soon', '#a35f00'], o: ['Overdue', '#be3434'], u: ['Upcoming', '#98a1ae'], y: ['Your step', '#15263b'], w: ['With client', '#667180'], n: ['Not started', '#98a1ae'] };
  function rowsOf(list, go) { var by = {}; list.forEach(function (r) { (by[r[2]] = by[r[2]] || []).push([r[0], r[1], ST[r[2]][0], ST[r[2]][1], go]); }); return by; }
  function tabsOf(by, order) { var all = []; order.forEach(function (k) { all = all.concat(by[k] || []); }); return [{ label: 'All', rows: all }].concat(order.map(function (k) { return { label: ST[k][0], color: ST[k][1], rows: by[k] || [] }; })); }
  var NW_FIL = [['TDS/TCS challan', '7 Oct · filed 6 Oct', 'f'], ['ECB-2 return', '7 Oct · 1 day late', 'o'], ['Professional tax', '10 Oct', 'd'], ['GSTR-1', '11 Oct', 'd'], ['PF & ESI payment', '15 Oct', 'd'], ['TCS return Q2', '15 Oct', 'd'],
    ['GSTR-3B', '20 Oct', 'u'], ['ITC-04', '25 Oct', 'u'], ['AOC-4 (financial statements)', '29 Oct', 'u'], ['MSME-1', '30 Oct', 'u'], ['Softex filing', '30 Oct', 'u'], ['TDS return Q2', '31 Oct', 'u'], ['Income tax return', '31 Oct', 'u']];
  var NW_SEP = [['Advance tax Q2', '15 Sept · filed 14 Sept', 'f'], ['PF & ESI payment', '15 Sept · filed 12 Sept', 'f'], ['GSTR-3B', '20 Sept · filed 18 Sept', 'f'], ['AGM held (Sec 96)', '30 Sept · filed 26 Sept', 'f'], ['GSTR-1', '11 Sept · filed 10 Sept', 'f']];
  var LEAD_DONUT = {
    'comp-month': function () { var by = rowsOf(NW_FIL, FG); return { title: 'October filings', sub: '13 filings this month', tabs: tabsOf(by, ['o', 'd', 'u', 'f']), link: { lead: 'Every filing, with proof', text: 'Open filings →', go: FG, where: 'Filings' } }; },
    'filings': function () { var by = rowsOf(NW_SEP.concat(NW_FIL), FG); return { title: 'Filings · Sep to Oct 2026', sub: '18 filings', tabs: tabsOf(by, ['o', 'd', 'u', 'f']), link: { lead: 'Due dates on a calendar', text: 'Open calendar →', go: 'lead-compliances', where: 'the calendar' } }; },
    'phone': function () { var L = [['FC-GPR · Tidewater', 'Was due 22 Oct', 'o'], ['TDS · Brightwave', 'Due 7 Oct', 'd'], ['TDS · Kestrel', 'Due 7 Oct', 'd'], ['TDS · Halcyon', 'Due 7 Oct', 'd'], ['GSTR-1 · Halcyon', 'Due 11 Oct', 'd'],
        ['ESI · Brightwave', '15 Oct', 'u'], ['PT · Brightwave', '25 Oct', 'u'], ['ESI · Tidewater', '15 Oct', 'u'],
        ['GSTR-1 · Brightwave', 'Filed', 'f'], ['GSTR-3B · Brightwave', 'Filed', 'f'], ['PF ECR · Brightwave', 'Filed', 'f'], ['GSTR-1 · Tidewater', 'Filed', 'f'], ['GSTR-3B · Tidewater', 'Filed', 'f'], ['TDS · Tidewater', 'Filed', 'f'],
        ['PF ECR · Tidewater', 'Filed', 'f'], ['GSTR-3B · Halcyon', 'Filed', 'f'], ['DIR-3 · Halcyon', 'Filed', 'f'], ['GSTR-1 · Northwind', 'Filed', 'f'], ['GSTR-3B · Northwind', 'Filed', 'f']];
      return { title: 'Compliance health · October', sub: 'Your compliance clients', tabs: tabsOf(rowsOf(L, FG), ['o', 'd', 'u', 'f']), link: { lead: 'Every filing for your clients', text: 'Open filings →', go: FG, where: 'Filings' } }; },
    'spice': function () { var L = [['Pre-1 · Client details', 'Done 15 Sep', 'f'], ['Pre-2 · Draft Board resolution', 'Done 17 Sep', 'f'], ['Pre-3 · Signed Board resolution', 'Done 19 Sep', 'f'], ['Pre-4 · Name Application', 'Done 22 Sep', 'f'], ['Pre-5 · Name Approval', 'Done 28 Sep', 'f'], ['Pre-6 · Capital structure', 'Done 9 Oct', 'f'],
        ['Pre-7 · Registered office address', 'With Northwind · 5d', 'w'], ['Pre-8 · Proposed Directors', 'Due 20 Oct', 'y'], ['Pre-9 · Subscriber Details', '-', 'n'], ['Pre-10 · KYC Review & DSC', '-', 'n'], ['Pre-11 · SPICe+ Confirmation', '-', 'n'], ['Pre-12 · SPICe+ Filing', '-', 'n'], ['Pre-13 · MCA Remarks', '-', 'n'], ['Pre-14 · Certificate of Incorporation', '-', 'n']];
      var by = rowsOf(L, 'lead-step'); ST.f = ['Done', '#1e7f55']; var t = tabsOf(by, ['y', 'w', 'n', 'f']); ST.f = ['Filed', '#1e7f55'];
      return { title: 'SPICe+ progress', sub: 'Phases 1 and 2 · 6 of 14 steps done', tabs: t, active: 1, link: { lead: 'SPICe+ ends with the Certificate of Incorporation', text: 'Open current step →', go: 'lead-step', where: 'the step pages' } }; }
  };
  /* manager · My Leads: one lead's tasks by status (sample rows match the page's donut counts) */
  LEAD_DONUT['team-tasks'] = function (el) {
    var c = JSON.parse(el.getAttribute('data-drill') || '{}'); if (!c.tabs) return null;
    c.link = { lead: 'Every task for your project leads', text: 'Open Work →', go: 'lead-work', where: 'Work' }; return c;
  };
  LEAD_DONUT['my-lead'] = function () {
    var LDS = { Bharath: ['Bharath', [6, 5, 3, 3, 2]], Sneha: ['Sneha Kulkarni', [9, 4, 3, 2, 4]], Meera: ['Meera Nair', [12, 3, 2, 0, 3]] };
    var k = 'Bharath'; try { k = sessionStorage.getItem('vcfo.lead') || k; } catch (e) {} if (!LDS[k]) k = 'Bharath';
    var name = LDS[k][0], cnt = LDS[k][1], off = k === 'Meera' ? 5 : (k === 'Bharath' ? 11 : 0);
    var STS = [['Done', '#1e7f55'], ['In progress', '#2563a8'], ['Due soon', '#a35f00'], ['Overdue', '#be3434'], ['Not started', '#98a1ae']];
    var TASK = [['GSTR-1 · September', 'GST'], ['GSTR-3B · September', 'GST'], ['TDS 24Q · Q2 return', 'Income tax'], ['PF and ESI payment', 'Payroll'], ['Professional tax', 'Payroll'],
      ['AOC-4 · financial statements', 'MCA'], ['MGT-7 annual return', 'MCA'], ['DIR-3 KYC', 'MCA'], ['INC-20A · commencement', 'MCA'], ['ADT-1 · auditor appointment', 'MCA'],
      ['FC-GPR filing', 'FEMA'], ['FLA annual return', 'FEMA'], ['Advance tax · Q2', 'Income tax'], ['ITR · AY 2026-27', 'Income tax'], ['GST reconciliation', 'GST'],
      ['Payroll run · October', 'Payroll'], ['MSME-1 return', 'MCA'], ['ECB-2 return', 'FEMA'], ['TCS return · Q2', 'Income tax'], ['ITC-04', 'GST'], ['Board resolution · bank', 'MCA'], ['DSC renewal', 'MCA']];
    var CO = ['Northwind', 'Orchid Lane', 'Brightwave', 'Kestrel Health', 'Tidewater', 'Halcyon', 'Larkspur', 'Juniper Bio'];
    var IN = [name];
    var tabs = STS.map(function (s) { return { label: s[0], color: s[1], rows: [] }; }), n = 0;
    cnt.forEach(function (c, si) {
      for (var j = 0; j < c; j++) {
        var t = TASK[(n + off) % TASK.length], co = CO[(n * 3 + off) % CO.length], who = IN[(n + off) % IN.length], d = 6 + ((n * 5 + off) % 24);
        var sub = si === 0 ? 'Done ' + Math.min(d, 15) + ' Oct' : si === 1 ? 'Due ' + Math.max(d, 17) + ' Oct · started' : si === 2 ? 'Due ' + (17 + j % 5) + ' Oct' :
          si === 3 ? 'Was due ' + (9 + j * 3) + ' Oct · ' + (7 - j * 3 > 0 ? 7 - j * 3 : 1) + 'd late' : 'Starts ' + (2 + j * 4) + ' Nov';
        tabs[si].rows.push([t[0] + ' · ' + co, t[1] + ' · ' + sub + ' · ' + who, STS[si][0], STS[si][1], 'lead-work']);
        n++;
      }
    });
    var all = []; [3, 2, 1, 4, 0].forEach(function (i) { all = all.concat(tabs[i].rows); });
    return { title: name + ' · tasks', sub: n + ' tasks · Sep to Oct 2026 · ' + (n - cnt[0]) + ' open',
      tabs: [{ label: 'All', rows: all }].concat(tabs), link: { lead: 'Every task for ' + name.split(' ')[0], text: 'Open Work →', go: 'lead-work', where: 'Work' } };
  };
  function openLeadDonut(el, target) {
    var f = LEAD_DONUT[el.getAttribute('data-donut')]; if (!f || !window.vcfoDrill) return false;
    var cfg = f(el); if (!cfg) return false; var seg = target && target.closest && target.closest('[data-tip]');
    if (seg) { var lab = String(seg.getAttribute('data-tip')).split(' · ')[0]; cfg.tabs.forEach(function (t, i) { if (t.label === lab) cfg.active = i; }); }
    window.vcfoDrill(cfg); return true;
  }
  document.addEventListener('keydown', function (e) { if (!LEADPG || (e.key !== 'Enter' && e.key !== ' ')) return; var dn = e.target.closest && e.target.closest('[data-donut]'); if (dn && openLeadDonut(dn)) e.preventDefault(); });
  document.addEventListener('click', function (e) {
    var dn = LEADPG && e.target.closest && e.target.closest('[data-donut]');
    if (dn && openLeadDonut(dn, e.target)) { e.preventDefault(); e.stopPropagation(); return; }
    var dg = e.target.closest && e.target.closest('[data-go]');
    /* a control inside a data-go tile (info "i", button, link, field) handles its own click: the tile does not navigate */
    var inner = dg && e.target.closest('a[href],button,[role="button"],[role="link"],[role="tab"],[role="menuitem"],[role="checkbox"],input,select,textarea,label,summary,.info');
    if (inner && inner !== dg && dg.contains(inner)) dg = null;
    if (dg && !dg.closest('.vps') && R[dg.getAttribute('data-go')]) { var dgo = dg.getAttribute('data-go'); if (LEADPG) dgo = rmap(dgo === 'home' ? 'lead-home' : (R['lead-' + dgo] ? 'lead-' + dgo : dgo)); e.preventDefault(); e.stopPropagation(); go(dgo, dg.getAttribute('data-go-hash') || ''); return; }
    var el = e.target.closest && e.target.closest('a,button,[role="button"],[role="tab"],[role="menuitem"],summary');
    if (!el || el.closest('#vp-bar,#vp-toast,#vp-mini,#vp-chat,#vp-launch,#tle-scrim,.vps,#vp-drill-scrim,.vp-ba')) return;
    if (LEADPG && /^(‹\s*)?Back$/.test(label(el))) { e.preventDefault(); e.stopPropagation(); goBack(); return; }
    var nav = navTarget(el);
    if (nav === 'chat') { e.preventDefault(); e.stopPropagation(); if (window.vcfoChat) window.vcfoChat(chatQuestion(el)); return; }
    if (/^\s*Edit\s*$/.test(el.textContent || '') && el.closest('section,.card') && /Timeline/.test((el.closest('section,.card').querySelector('h3,h2') || {}).textContent || '')) { e.preventDefault(); e.stopPropagation(); openTimeline(); return; }
    if (nav && R[nav]) { e.preventDefault(); e.stopPropagation(); go(nav); return; }
    var href = el.tagName === 'A' ? el.getAttribute('href') : null;
    if (href && !/^#/.test(href)) {
      if (/^https?:/i.test(href)) { e.preventDefault(); toast('Opens ' + (label(el) || 'the official portal') + ' in the full app'); return; }
      if (!window.__vcfoResolve) { /* plain file server (dev): normal navigation */ }
      else {
        var rk = window.__vcfoResolve(href);   // a real screen of this prototype
        if (rk) { e.preventDefault(); vcfoNav(rk.path + rk.hash); return; }
        e.preventDefault(); toast(label(el) + ' · opens in the full app'); return;
      }
    }
    if (href === '#' || href === '' ) e.preventDefault();
    var before = muts, url = curUrl();
    if (el.getAttribute('aria-selected') === 'true' && el.getAttribute('role') === 'tab') { setTimeout(function () { toast('Already showing ' + label(el).replace(/\d+$/, '').trim()); }, 120); return; }
    setTimeout(function () {
      if (muts !== before || curUrl() !== url) return;   // the screen reacted on its own
      var m = fallbackMsg(el); toast(m[0], m[1]);
    }, 380);
  }, true);

  /* ---------- rule 17: icon-only controls explain themselves ---------- */
  var tip;
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('a,button,[role="button"]');
    if (!el || el.closest('#vp-bar,.vps,[data-notip]')) return hideTip();
    var txt = (el.textContent || '').trim();
    var lab = el.getAttribute('aria-label');
    if (!lab || txt.length > 2 || el.hasAttribute('data-tip') || el.querySelector('.tt') || OBVIOUS.test(lab)) return hideTip();
    if (!tip) { tip = document.createElement('div'); tip.id = 'vp-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    tip.textContent = lab; var r = el.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2)) + 'px';
    tip.style.top = (r.top - 32 < 4 ? r.bottom + 6 : r.top - 32) + 'px';
    clearTimeout(tip._t); tip._t = setTimeout(function () { tip.classList.add('on'); }, 120);
  });
  function hideTip() { if (tip) { clearTimeout(tip._t); tip.classList.remove('on'); } }
  document.addEventListener("pointerdown", hideTip, true);
  document.addEventListener('scroll', hideTip, true);


  /* ---------- Ask VCFO: one launcher + chat window, fixed bottom-right on every route ---------- */
  var CHAT_OWN = !!window.__vcfoOwnChat;
  var ccss = document.createElement('style');
  ccss.textContent = [
    /* sizes shared by the launcher and the chat; the bottom-right inset follows the page gutter (a page or the shell may set --vp-inset on :root) */
    ':root{--vpl-in:var(--vp-inset,clamp(14px,1.25vw + 8px,24px));--vpl-w:clamp(96px,4.5vw + 72px,148px);--vpk-w:clamp(96px,3vw + 72px,128px);--vpl-ph:36px;'+
      '--vp-launch-h:calc(var(--vpl-ph) + 2 * var(--vpl-in));--vp-launch-w:calc(var(--vpl-w) + 4px + 108px + var(--vpl-in));scroll-padding-bottom:var(--vp-launch-h)}',
    '@media (max-width:767px){:root{--vpl-ph:40px}}',
    /* bottom spacer: every screen can scroll its last row clear of the floating pills (Ask VCFO, PROTOTYPE). 1 px wide, so never a horizontal scroll */
    'html.vp-endpad body::after,.vp-endpad-box::after{content:"";display:block;flex:none;grid-column:1/-1;width:1px;height:var(--vp-launch-h);margin:0;padding:0;pointer-events:none}',
    'html.vp-endpad body::after{width:100%;background:var(--vp-endpad-bg,transparent)}',
    /* launcher = the owner character gripping the viewport bottom edge + an always-visible "Ask VCFO" pill in the corner */
    '#vp-launch{position:fixed;right:var(--vpl-in);bottom:0;z-index:2147482500;display:flex;align-items:flex-end;gap:4px;pointer-events:none}',
    '#vp-launch .vpl-char{position:relative;display:block;flex:none;width:var(--vpl-w);height:calc(var(--vpl-w) * 200 / 340);overflow:hidden;pointer-events:none}',
    '#vp-launch .vpl-lift{display:block;width:100%;height:calc(var(--vpl-w) * 216 / 340);transform:translate3d(0,0,0);transition:transform .5s cubic-bezier(.34,1.45,.5,1)}',
    '#vp-launch .vpl-lift>svg{display:block;width:100%;height:100%}',
    '#vp-launch .vpv-head{pointer-events:visiblePainted;cursor:pointer}',
    /* yield: the character ducks under the edge while scrolling, while the chat is open, or when it would cover a control */
    '#vp-launch.yield .vpl-lift,#vp-launch.open .vpl-lift,body.sheet-open #vp-launch .vpl-lift{transform:translate3d(0,100%,0);transition:transform .32s cubic-bezier(.5,0,.75,.4)}',
    '#vp-launch.yield .vpv-head,#vp-launch.open .vpv-head{pointer-events:none}',
    '#vp-launch .vpl-pill{pointer-events:auto;flex:none;position:relative;display:inline-flex;align-items:center;gap:7px;height:var(--vpl-ph);margin:0 0 var(--vpl-in);padding:0 14px 0 12px;border:0;border-radius:8px;background:#15263b;color:#fff;font:700 13px/1 Public Sans,system-ui,sans-serif;letter-spacing:0;white-space:nowrap;cursor:pointer;box-shadow:0 10px 24px -10px rgba(8,20,40,.6),inset 0 0 0 1px rgba(255,255,255,.08);-webkit-tap-highlight-color:transparent;transition:background-color .15s,transform .15s,opacity .2s,visibility .2s}',
    '#vp-launch .vpl-pill:hover{background:#1b3049}#vp-launch .vpl-pill:active{transform:scale(.97)}',
    '#vp-launch .vpl-pill:focus-visible{outline:3px solid light-dark(#7DD3FC, oklch(32% 0.1 230.3));outline-offset:2px}',
    '#vp-launch .vpl-dot{flex:none;width:8px;height:8px;border-radius:50%;background:#2DD4BF;box-shadow:0 0 0 3px rgba(45,212,191,.22)}',
    '#vp-launch .vpl-c{display:none;align-items:center;gap:6px}#vp-launch .vpl-c svg{width:14px;height:14px}',
    '#vp-launch.open .vpl-t,#vp-launch.open .vpl-dot{display:none}#vp-launch.open .vpl-c{display:inline-flex}',
    'body.sheet-open #vp-launch .vpl-pill{opacity:0;visibility:hidden}',
    /* the character (inputs/visor-avatar-animated.svg): the file keyframes and 20.5 s loop, unchanged, scoped to .vpv-loop */
    '.vpv .vpv-eye{transform-box:fill-box;transform-origin:center}',
    '.vpv-loop .vpv-head{animation:vpvRise 20.5s infinite}',
    '.vpv-loop .vpv-eyes{animation:vpvLook 20.5s infinite ease-in-out}',
    '.vpv-loop .vpv-eye{animation:vpvBlink 20.5s infinite}',
    '.vpv-loop .vpv-hand{animation:vpvGrip 20.5s infinite ease-out}',
    '.vpv-loop .vpv-hand-r{animation-delay:.09s}',
    '.vpv-loop .vpv-hand{animation-fill-mode:backwards}',
    '@keyframes vpvRise{0%,2.4%{transform:translateY(232px);animation-timing-function:cubic-bezier(.3,.75,.35,1)}14.1%,25.4%{transform:translateY(72px);animation-timing-function:cubic-bezier(.3,.75,.35,1)}33.2%,40%{transform:translateY(44px);animation-timing-function:cubic-bezier(.3,.75,.35,1)}48.3%,66.3%{transform:translateY(0);animation-timing-function:ease-in-out}74.6%,80%{transform:translateY(72px);animation-timing-function:cubic-bezier(.5,0,.75,.4)}89.3%,100%{transform:translateY(232px)}}',
    '@keyframes vpvLook{0%,14.1%{transform:translate(0,0)}15.5%,19.5%{transform:translate(-12px,-2px)}21%,24%{transform:translate(12px,-2px)}25.5%,50%{transform:translate(0,0)}51.5%,55%{transform:translate(-12px,3px)}56.5%,60%{transform:translate(12px,-4px)}61.5%,74.6%{transform:translate(0,0)}76%,79%{transform:translate(10px,-3px)}80.5%,100%{transform:translate(0,0)}}',
    '@keyframes vpvBlink{0%,25.6%,26.4%,34.4%,35.2%,35.8%,36.6%,63%,63.8%,100%{transform:scaleY(1)}26%,34.8%,36.2%,63.4%{transform:scaleY(.08)}}',
    '@keyframes vpvGrip{0%{opacity:0;translate:0 14px}2.4%,89.3%{opacity:1;translate:0 0}91.5%,100%{opacity:0;translate:0 16px}}',
    /* chat window: floating card above the pill (tablet/desktop), full-width bottom sheet on phones */
    '#vp-chat{position:fixed;right:var(--vpl-in);bottom:calc(var(--vpl-lift,0px) + var(--vpl-in) + var(--vpl-ph) + 14px);z-index:2147482501;box-sizing:border-box;width:clamp(340px,24vw + 40px,440px);max-width:calc(100vw - 2 * var(--vpl-in));height:min(clamp(480px,62vh,680px),calc(100dvh - var(--vpl-lift,0px) - var(--vpl-in) - var(--vpl-ph) - 26px - var(--vpk-w) * .6));min-height:min(320px,calc(100dvh - 24px));max-height:calc(100dvh - 24px);display:flex;flex-direction:column;background:light-dark(#fff, oklch(13% 0 89.9));border-radius:12px;border:1px solid light-dark(#dde3ec, oklch(25.4% 0.012 258.3));box-shadow:0 24px 60px -20px rgba(8,20,40,.5);font:500 13px/1.5 Public Sans,system-ui,sans-serif;color:light-dark(#0f1b2d, oklch(91.2% 0.028 258.3));transform-origin:100% 100%;transform:translateY(12px) scale(.96);opacity:0;visibility:hidden;transition:transform .26s cubic-bezier(.22,1,.36,1),opacity .18s,visibility .18s}',
    '#vp-chat.on{transform:none;opacity:1;visibility:visible}',
    '#vp-chat .vpc-h{position:relative;display:flex;align-items:center;gap:10px;padding:12px 12px 12px 14px;background:#15263b;color:#fff;border-radius:11px 11px 0 0}',
    '#vp-chat .vpc-av{flex:0 0 auto;width:36px;height:36px;border-radius:50%;background:light-dark(#fff, oklch(13% 0 89.9));display:grid;place-items:center;overflow:hidden}#vp-chat .vpc-av svg{width:31px;height:39px;margin-top:9px}',
    '#vp-chat .vpc-h b{display:block;font:800 14px Public Sans,system-ui,sans-serif}#vp-chat .vpc-h small{font-size:11.5px;color:#c7d2e2}',
    '#vp-chat .vpc-h button{margin-left:auto;flex:none;width:36px;height:36px;border-radius:6px;border:0;background:rgba(255,255,255,.12);color:#fff;font:400 22px/1 Public Sans,system-ui,sans-serif;cursor:pointer}',
    '#vp-chat .vpc-ms{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 0}',
    '#vp-chat .vpc-m{margin:6px 14px;max-width:84%;padding:9px 12px;border-radius:10px;overflow-wrap:anywhere}',
    '#vp-chat .vpc-m.vpc-u{margin-left:auto;background:#15263b;color:#fff;border-radius:10px 10px 2px 10px}',
    '#vp-chat .vpc-m.vpc-a{background:light-dark(#f1f4f8, oklch(18.1% 0.006 255.5));border-radius:10px 10px 10px 2px}',
    '#vp-chat .vpc-m.vpc-a button{margin-top:8px;min-height:32px;padding:0 10px;border-radius:6px;border:1px solid light-dark(#dde3ec, oklch(25.4% 0.012 258.3));background:light-dark(#fff, oklch(13% 0 89.9));font:700 12px Public Sans,system-ui,sans-serif;cursor:pointer;color:light-dark(#15263b, oklch(88.7% 0.047 254.4))}',
    '#vp-chat .vpc-ty i{display:inline-block;width:6px;height:6px;margin-right:3px;border-radius:50%;background:#7a889c;animation:vpTh 1s infinite}#vp-chat .vpc-ty i:nth-child(2){animation-delay:.2s}#vp-chat .vpc-ty i:nth-child(3){animation-delay:.4s}',
    '#vp-chat.vpc-home .vpc-sg{display:none}#vp-chat .vpc-hm{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:28px 18px 10px}#vp-chat .vpc-hm b{font:600 18px Public Sans,system-ui,sans-serif}#vp-chat .vpc-hm span{font-size:12.5px;color:#667180}#vp-chat .vpc-hc{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:10px}#vp-chat .vpc-hc button{min-height:34px;padding:4px 12px;border-radius:999px;border:1px solid #d5dbe3;background:#fff;color:#15263b;font:600 12.5px Public Sans,system-ui,sans-serif;cursor:pointer}#vp-chat .vpc-hc button:hover{border-color:#2563a8;color:#2563a8}',
    '#vp-chat .vpc-sg{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;max-height:40%;overflow:auto}',
    '#vp-chat .vpc-sg button{min-height:32px;max-width:100%;padding:4px 10px;border-radius:6px;border:1px solid rgba(46,92,255,.35);background:light-dark(#eef2ff, oklch(18.7% 0.01 272.3));color:light-dark(#2a4fd6, oklch(80.3% 0.14 266.4));font:600 12px/1.3 Public Sans,system-ui,sans-serif;text-align:left;cursor:pointer}',
    '#vp-chat form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid light-dark(#eef0f3, oklch(23.7% 0.006 255.5))}',
    '#vp-chat input{flex:1;min-width:0;height:40px;box-sizing:border-box;border-radius:8px;border:1px solid light-dark(#dde3ec, oklch(25.4% 0.012 258.3));padding:0 12px;font:500 14px Public Sans,system-ui,sans-serif}',
    '#vp-chat form button{flex:none;height:40px;padding:0 14px;border-radius:6px;border:0;background:#15263b;color:#fff;font:700 13px Public Sans,system-ui,sans-serif;cursor:pointer}',
    '@keyframes vpTh{0%,100%{opacity:.3}50%{opacity:1}}',
    /* What\u2019s this? answer card (owner board vs_ask): title, explanation, why it matters, source, a way to the step */
    '#vp-chat .vpc-card{margin:6px 14px;padding:12px 14px 14px;border:1px solid light-dark(#dde3ec, oklch(25.4% 0.012 258.3));border-radius:10px;background:light-dark(#fff, oklch(13% 0 89.9));box-shadow:0 1px 2px rgba(15,27,45,.04),0 8px 20px -14px rgba(15,27,45,.25);overflow-wrap:anywhere}',
    '#vp-chat .vpc-card b.vpc-ct{display:block;font:800 14px/1.35 Public Sans,system-ui,sans-serif;color:light-dark(#0f1b2d, oklch(91.2% 0.028 258.3));margin:0 0 6px}',
    '#vp-chat .vpc-card p{margin:0;font-size:13.5px;line-height:1.55;color:light-dark(#0f1b2d, oklch(91.2% 0.028 258.3))}',
    '#vp-chat .vpc-card .vpc-why{margin-top:10px;font-size:12.5px;line-height:1.5;color:light-dark(#4a5a70, oklch(81.5% 0.029 256.4))}#vp-chat .vpc-card .vpc-why b{display:block;font:800 12px Public Sans,system-ui,sans-serif;color:light-dark(#0f1b2d, oklch(91.2% 0.028 258.3));margin-bottom:2px}',
    '#vp-chat .vpc-card .vpc-src{margin-top:8px;font-size:11.5px;line-height:1.45;color:#6b7a90}',
    '#vp-chat .vpc-card button{display:inline-flex;align-items:center;gap:6px;margin-top:12px;min-height:34px;max-width:100%;padding:0 12px;border-radius:6px;border:1px solid #2e5cff;background:light-dark(#fff, oklch(13% 0 89.9));color:light-dark(#2a4fd6, oklch(80.3% 0.14 266.4));font:700 12.5px Public Sans,system-ui,sans-serif;text-align:left;cursor:pointer}',
    '#vp-chat .vpc-card button:hover{background:light-dark(#eef2ff, oklch(18.7% 0.01 272.3))}#vp-chat .vpc-card button svg{flex:none;width:14px;height:14px}',
    /* the same character peeks over the top edge of the window once per open: hands grip the edge, head rises, a look around, then a slow blink.
       Moods only through colour and motion: antenna teal = idle, pulsing = thinking, green + hop = answered, grey + dip = cannot answer. The smile never changes. */
    '#vp-chat .vpc-pk{position:absolute;right:clamp(16px,6%,30px);bottom:100%;width:var(--vpk-w);height:calc(var(--vpk-w) * 216 / 340);margin-bottom:calc(var(--vpk-w) * -16 / 340);pointer-events:none;z-index:2}',
    '#vp-chat .vpc-pk>svg{display:block;width:100%;height:100%;overflow:visible}',
    '#vp-chat .vpv-peek .vpv-head{transform:translateY(232px)}',
    '#vp-chat .vpv-peek .vpv-hand{opacity:0}',
    '#vp-chat.on .vpv-peek .vpv-head{animation:vpvPeek .95s cubic-bezier(.3,.75,.35,1) .22s both}',
    '#vp-chat.on .vpv-peek .vpv-hand{animation:vpvGripIn .32s ease-out .08s both}#vp-chat.on .vpv-peek .vpv-hand-r{animation-delay:.17s}',
    '#vp-chat.on .vpv-peek .vpv-eyes{animation:vpvPeekLook 2.2s ease-in-out 1.25s both}',
    '#vp-chat.on .vpv-peek .vpv-eye{animation:vpvPeekBlink 6.5s 3.5s infinite}',
    '@keyframes vpvPeek{from{transform:translateY(232px)}to{transform:translateY(0)}}',
    '@keyframes vpvGripIn{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}',
    '@keyframes vpvPeekLook{0%,100%{transform:translate(0,0)}14%,38%{transform:translate(-12px,-2px)}52%,78%{transform:translate(12px,-2px)}}',
    '@keyframes vpvPeekBlink{0%,3%,6%,100%{transform:scaleY(1)}4.5%{transform:scaleY(.08)}}',
    '#vp-chat .vpv-ant{transition:fill .3s}',
    '#vp-chat.vpc-ok .vpv-ant{fill:#22C55E}#vp-chat.vpc-nan .vpv-ant{fill:#94A3B8}',
    '#vp-chat.vpc-think .vpv-ant{animation:vpvAnt 1s ease-in-out infinite}',
    '#vp-chat.vpc-ok .vpv-peek .vpv-mood{animation:vpvHop .7s cubic-bezier(.3,1.5,.5,1)}',
    '#vp-chat.vpc-nan .vpv-peek .vpv-mood{animation:vpvDip 1.2s ease-in-out}',
    '@keyframes vpvAnt{50%{opacity:.3}}',
    '@keyframes vpvHop{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}}',
    '@keyframes vpvDip{0%,100%{transform:translateY(0)}35%,70%{transform:translateY(14px)}}',
    '.vp-hide-bot{display:none!important}',
    /* phones: the sheet owns the bottom of the screen, so the prototype control steps aside while it is open */
    '@media (max-width:767px){html.vp-chat-on #vp-mini,html.vp-chat-on #vp-bar{visibility:hidden}}',
    '@media (max-width:767px){#vp-chat{left:0;right:0;bottom:0;width:auto;max-width:none;height:min(640px,calc(100dvh - 20px - var(--vpk-w) * .6));min-height:0;max-height:calc(100dvh - 12px);border-radius:16px 16px 0 0;border-width:1px 0 0;padding-bottom:env(safe-area-inset-bottom);transform-origin:50% 100%;transform:translateY(24px)}' +
      '#vp-chat .vpc-h{border-radius:15px 15px 0 0}#vp-chat .vpc-h button,#vp-chat .vpc-sg button,#vp-chat .vpc-m.vpc-a button,#vp-chat .vpc-card button{min-height:40px;min-width:40px}#vp-chat .vpc-h button{width:40px;height:40px}#vp-chat input{height:44px;font-size:16px}#vp-chat form button{height:44px}}',
    /* reduced motion: a static, fully visible head, no loop, no peek motion (colour still shows the mood) */
    '@media (prefers-reduced-motion: reduce){#vp-launch *,#vp-chat .vpc-ty i,#vp-chat .vpc-pk *{animation:none!important;transition:none!important}#vp-launch .vpv-head,#vp-chat .vpv-peek .vpv-head{transform:none}#vp-launch .vpv-hand,#vp-chat .vpv-peek .vpv-hand{opacity:1}#vp-chat{transition:none}}'
  ].join('\n');
  document.head.appendChild(ccss);
  var AFTER = store.get('after', false);
  var QA = AFTER ? {
    'What is due next?': 'TDS Payment · Oct 2026 is overdue by 1 day. Next are EPF and ESI on 15 Nov.',
    'Which registrations are pending?': 'Two are with SBC: PT Registration (est. 12 Nov) and IEC (est. 14 Nov).',
    'When is FC-GPR due?': '2 Dec 2026, day 6 of the 30-day window. Upload the bank FIRC + KYC letter first.'
  } : {
    'What is my next step?': 'Step 7 · Registered office address is waiting for Northwind. Upload the utility bill and the owner NOC by 9 Oct, then approve. Steps 8 Proposed Directors and 9 Subscriber Details are also in progress with Northwind.',
    'Where is my incorporation now?': 'Northwind is in Phase 2 · Incorporation: 1 of 9 steps done, 6 of 14 SPICe+ steps overall (43%). Step 7 is waiting for Northwind, steps 8 and 9 are in progress with Northwind, and step 10 KYC Review & DSC is with SBC. The COI is expected on 28 Oct.',
    'Which documents are missing?': 'Two, both for step 7 · Registered office address: the office utility bill and the NOC from the owner. Both are due 9 Oct.'
  };
  function chatLog() { try { return JSON.parse(sessionStorage.getItem('vcfo.chat') || '[]'); } catch (e) { return []; } }
  function saveLog(l) { try { sessionStorage.setItem('vcfo.chat', JSON.stringify(l)); } catch (e) {} }
  var launch, win, lastFocus;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderLog() {
    var box = win.querySelector('.vpc-ms'); var l = chatLog();
    win.classList.toggle('vpc-home', !l.length);
    if (!l.length) { box.innerHTML = '<div class="vpc-hm"><b>What can I do for you?</b><span>Ask about Northwind, or start with one of these.</span><div class="vpc-hc">' + ['What is due this week?', 'Draft a reminder to Rohan', 'Explain a GST notice', 'Prepare the GST checklist'].map(function (q) { return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></div>'; setMood(); return; }
    box.innerHTML = '<div class="vpc-m vpc-a">Hello. Ask me anything about Northwind’s setup, or pick a question below.</div>' + l.map(function (m) {
      if (m.w) return wtCard(m.w);
      return '<div class="vpc-m ' + (m.r === 'u' ? 'vpc-u' : 'vpc-a') + '">' + esc(m.t) + (m.h ? '<br><button type="button" data-handoff>Hand off to Bharath</button>' : '') + '</div>';
    }).join('');
    box.scrollTop = 1e6;
    var lastK = l.filter(function (m) { return m.k; }).pop();
    setMood(lastK && lastK.k);
  }
  /* What's this? answers come from the screen (window.vcfoWhatsThis on the Incorporation pages) and render as the answer card */
  function whatsThis(q) { try { var w = typeof window.vcfoWhatsThis === 'function' && window.vcfoWhatsThis(q); return w && (w.title || w.text) ? { title: String(w.title || ''), text: String(w.text || ''), why: String(w.why || ''), source: String(w.source || ''), go: w.go ? String(w.go) : '' } : null; } catch (e) { return null; } }
  function wtCard(w) {
    var lbl = /^inc-step-\d+$/.test(w.go) ? 'Open this step' : 'Open ' + ((R[w.go] && R[w.go].t) || 'this page');
    return '<div class="vpc-card" role="group" aria-label="' + esc(w.title || 'Answer') + '">' + (w.title ? '<b class="vpc-ct">' + esc(w.title) + '</b>' : '') + (w.text ? '<p>' + esc(w.text) + '</p>' : '') +
      (w.why ? '<div class="vpc-why"><b>Why it matters to Northwind</b>' + esc(w.why) + '</div>' : '') + (w.source ? '<div class="vpc-src">Source: ' + esc(w.source) + '</div>' : '') +
      (w.go ? '<button type="button" data-wgo="' + esc(w.go) + '">' + esc(lbl) + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' : '') + '</div>';
  }
  /* mood = antenna colour + a small motion of the peeking character (never the mouth): ok = green + hop, nan = grey + dip */
  function setMood(k, replay) {
    win.classList.remove('vpc-think');
    if (replay) { win.classList.remove('vpc-ok', 'vpc-nan'); void win.offsetWidth; }
    win.classList.toggle('vpc-ok', k === 'ok'); win.classList.toggle('vpc-nan', k === 'nan');
  }
  /* the owner character (inputs/visor-avatar-animated.svg, smile included). Each instance gets its own gradient/filter/clip ids. */
  var VPV = 0;
  function vpvDefs(u, full) {
    return '<defs><linearGradient id="' + u + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C8DF8"/><stop offset="1" stop-color="#2563a8"/></linearGradient>' +
      (full ? '<linearGradient id="' + u + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C8DF8"/><stop offset="1" stop-color="#2563EB"/></linearGradient><clipPath id="' + u + 'c"><rect x="0" y="0" width="340" height="200"/></clipPath>' : '') +
      '<filter id="' + u + 'g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  }
  function vpvFace(u) {
    return '<line x1="120" y1="46" x2="120" y2="24" stroke="#1e5290" stroke-width="5" stroke-linecap="round"/><circle class="vpv-ant" cx="120" cy="18" r="8" fill="#2DD4BF"/>' +
      '<rect x="14" y="112" width="20" height="46" rx="10" fill="#1e5290"/><rect x="206" y="112" width="20" height="46" rx="10" fill="#1e5290"/>' +
      '<rect x="30" y="44" width="180" height="210" rx="56" fill="url(#' + u + 'h)"/><path d="M62 56 q30 -10 60 -8" stroke="#fff" stroke-opacity=".28" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<rect x="50" y="84" width="140" height="82" rx="36" fill="#0B1736"/><rect x="64" y="91" width="54" height="7" rx="3.5" fill="#fff" fill-opacity=".08"/>' +
      '<g class="vpv-eyes" filter="url(#' + u + 'g)" fill="#7DD3FC"><rect class="vpv-eye" x="88" y="109" width="22" height="30" rx="11"/><rect class="vpv-eye" x="130" y="109" width="22" height="30" rx="11"/>' +
      '<path class="vpv-smile" d="M103 148 Q120 161 137 148" fill="none" stroke="#7DD3FC" stroke-width="5" stroke-linecap="round"/></g>' +
      '<rect x="104" y="180" width="32" height="5" rx="2.5" fill="#1E3A8A" fill-opacity=".7"/>';
  }
  function vpvHand(u, cls, x) {
    return '<g class="' + cls + '" transform="translate(' + x + ' 178)"><rect x="2" y="4" width="46" height="22" rx="11" fill="url(#' + u + 'k)" stroke="#2563a8" stroke-opacity=".5"/>' +
      '<g fill="#2563a8"><rect x="6" y="18" width="8.5" height="17" rx="4.25"/><rect x="16" y="18" width="8.5" height="17" rx="4.25"/><rect x="26" y="18" width="8.5" height="17" rx="4.25"/><rect x="36" y="18" width="8.5" height="17" rx="4.25"/></g>' +
      '<path d="M12 10 h18" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/></g>';
  }
  /* full character: head clipped at the edge (y = 200), hands gripping it; cls picks the motion (vpv-loop = the file's 20.5 s loop, vpv-peek = one peek) */
  function charSVG(cls) {
    var u = 'vpv' + (++VPV);
    return '<svg class="vpv ' + cls + '" viewBox="0 0 340 216" aria-hidden="true" focusable="false">' + vpvDefs(u, true) +
      '<g clip-path="url(#' + u + 'c)"><g transform="translate(50 0)"><g class="vpv-head"><g class="vpv-mood">' + vpvFace(u) + '</g></g></g></g>' +
      vpvHand(u, 'vpv-hand', 4) + vpvHand(u, 'vpv-hand vpv-hand-r', 286) + '</svg>';
  }
  /* static head (no loop): chat header avatar and window.vcfoBotSVG (empty-state bots on the Incorporation pages). Same 240x302 box as v6. */
  function headSVG(u) { return '<svg class="vpv vpv-s" viewBox="0 0 240 302" aria-hidden="true" focusable="false">' + vpvDefs(u, false) + vpvFace(u) + '</svg>'; }
  var BOT = headSVG('vpvS');
  window.vcfoBotSVG = BOT;
  /* the character never covers a control: it ducks while a button/link/field sits under it, while scrolling, or while the chat is open */
  var ACT = 'a[href],button,[role=button],[role=link],[role=tab],[role=checkbox],[role=radio],[role=switch],[role=menuitem],[role=option],input,select,textarea,summary,label,[data-go],[onclick],[contenteditable=""],[contenteditable=true]';
  function coversControl() {
    var c = launch && launch.querySelector('.vpl-char'); if (!c) return false;
    var r = c.getBoundingClientRect(); if (!r.width || !r.height) return false;
    var seen = [];
    for (var i = 0; i < 6; i++) for (var j = 0; j < 4; j++) {
      var x = r.left + r.width * (0.08 + 0.168 * i), y = r.top + r.height * (0.08 + 0.28 * j);
      var st = document.elementsFromPoint(x, y);
      for (var k = 0; k < st.length; k++) {
        var e = st[k]; if (launch.contains(e)) continue;
        var a = e.closest && e.closest(ACT); if (!a || seen.indexOf(a) >= 0) break; seen.push(a);
        var b = a.getBoundingClientRect(), ow = Math.min(b.right, r.right) - Math.max(b.left, r.left), oh = Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top);
        if (ow > 0 && oh > 0 && (ow * oh) / Math.max(1, b.width * b.height) > 0.2) return true;
        break;
      }
    }
    return false;
  }
  /* bottom spacer, switched on only where it helps: the page already scrolls, a control sits under a floating pill,
     or an inner scroll panel ends under one. Controls inside fixed/sticky layers are left alone (a spacer cannot move them). */
  /* paint the spacer like the background right above it: from the lowest piece of content, the first edge-to-edge
     ancestor with a colour (cards have side margins, so they are skipped). Re-read for the first seconds while the screen renders. */
  var bgTicks = 0;
  function endPadBg() {
    var de = document.documentElement, b = document.body;
    var bg = '', low = null, cand = [];
    [].forEach.call(b.querySelectorAll('*'), function (k) {
      if (/^(SCRIPT|STYLE|TEMPLATE|LINK)$/.test(k.tagName)) return;
      var rk = k.getBoundingClientRect(); if (rk.height && rk.width) cand.push([Math.round(rk.bottom), k, cand.length]);
    });
    cand.sort(function (x, y) { return y[0] - x[0] || y[2] - x[2]; });   /* ties: the deepest (latest) element first */
    for (var ci = 0; ci < cand.length && ci < 400 && !low; ci++) {   /* lowest in-flow, visible element (not in a fixed/absolute layer such as a sheet) */
      var k = cand[ci][1], ok = getComputedStyle(k).visibility !== 'hidden';
      for (var a = k; ok && a && a !== b; a = a.parentElement) { var pa = getComputedStyle(a).position; if (pa === 'fixed' || pa === 'absolute' || /^vp-/.test(a.id)) ok = false; }
      if (ok) low = k;
    }
    for (var n2 = low; n2 && n2 !== de; n2 = n2.parentElement) {
      var rb = n2.getBoundingClientRect(), c = getComputedStyle(n2).backgroundColor;
      if (rb.right >= innerWidth - 2 && rb.width >= innerWidth * 0.6 && c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) { bg = c; break; }
    }
    if (bg && de.style.getPropertyValue('--vp-endpad-bg') !== bg) de.style.setProperty('--vp-endpad-bg', bg);
  }
  var padLock = false;
  function endPad(reset) {
    var de = document.documentElement, b = document.body; if (!b || !launch) return;
    if (reset) { padLock = false; bgTicks = 0; de.classList.remove('vp-endpad'); }
    /* a screen that lifts the launcher above its own bottom bar (sticky action bar) owns its bottom: no root spacer there,
       it would unstick that bar early and slide it under the lifted pill */
    if (innerHeight - launch.getBoundingClientRect().bottom > 1) { padLock = false; if (de.classList.contains('vp-endpad')) de.classList.remove('vp-endpad'); return; }
    var zones = [];
    [launch.querySelector('.vpl-pill'), document.getElementById('vp-mini'), document.getElementById('vp-bar')].forEach(function (e) {
      if (!e) return; var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return; var r = e.getBoundingClientRect(); if (r.width && r.height) zones.push(r);
    });
    var under = false, boxes = [];
    zones.forEach(function (r) {
      for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) {
        var st = document.elementsFromPoint(r.left + r.width * (0.15 + 0.35 * i), r.top + r.height * (0.25 + 0.5 * j)), e = null;
        for (var k = 0; k < st.length; k++) if (!st[k].closest('#vp-launch,#vp-chat,#vp-mini,#vp-bar,#vp-toast,#vp-tip')) { e = st[k]; break; }
        if (!e || e === b || e === de) continue;
        var fixed = false, sc = null;
        for (var n = e; n && n !== b && n !== de; n = n.parentElement) {
          var cs = getComputedStyle(n);
          if (cs.position === 'fixed' || cs.position === 'sticky') { fixed = true; break; }
          if (!sc && /(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1 && n.clientHeight > innerHeight * 0.3) sc = n;
        }
        if (fixed) continue;
        if (sc) { if (boxes.indexOf(sc) < 0) boxes.push(sc); } else if (e.closest(ACT)) under = true;
      }
    });
    boxes.forEach(function (n) { if (!n.classList.contains('vp-endpad-box') && getComputedStyle(n, '::after').content === 'none') n.classList.add('vp-endpad-box'); });
    if (de.classList.contains('vp-endpad')) { if (bgTicks++ < 8) endPadBg(); return; }
    if (getComputedStyle(b, '::after').content !== 'none') return;   // the screen uses body::after itself
    if (padLock || under || de.scrollHeight > innerHeight + 1) {
      endPadBg(); padLock = true; de.classList.add('vp-endpad');
    }
  }
  var scrolling = false;
  function updYield() {
    if (!launch) return;
    var y = scrolling || launch.classList.contains('open') || document.body.classList.contains('sheet-open') || coversControl();
    if (launch.classList.contains('yield') !== y) launch.classList.toggle('yield', y);
    if (win) { var lift = Math.max(0, Math.round(innerHeight - launch.getBoundingClientRect().bottom)) + 'px'; if (win.__lift !== lift) { win.__lift = lift; win.style.setProperty('--vpl-lift', lift); } }
  }
  function buildChat() {
    if (document.getElementById('vp-launch')) return;
    launch = document.createElement('div'); launch.id = 'vp-launch';
    launch.innerHTML = '<span class="vpl-char" aria-hidden="true"><span class="vpl-lift">' + charSVG('vpv-loop') + '</span></span>' +
      '<button type="button" class="vpl-pill" aria-label="Open Ask VCFO chat" aria-expanded="false"' + (CHAT_OWN ? '' : ' aria-controls="vp-chat"') + ' data-notip>' +
      '<i class="vpl-dot" aria-hidden="true"></i><span class="vpl-t">Ask VCFO</span><span class="vpl-c" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>Close</span></button>';
    var pill = launch.querySelector('.vpl-pill'), chr = launch.querySelector('.vpl-char');
    var scrollT, lastTop = new WeakMap(); addEventListener('scroll', function (e) { if (launch.classList.contains('open')) return; var tg = e.target && e.target.nodeType === 1 ? e.target : document.documentElement, top = tg === document.documentElement ? scrollY : tg.scrollTop; if (lastTop.get(tg) === top) return; lastTop.set(tg, top); scrolling = true; updYield(); clearTimeout(scrollT); scrollT = setTimeout(function () { scrolling = false; updYield(); var de = document.documentElement; if (de.classList.contains('vp-endpad') && innerHeight + scrollY >= de.scrollHeight - 240) endPadBg(); }, 650); }, { passive: true, capture: true });
    var rzT; addEventListener('resize', function () { updYield(); clearTimeout(rzT); rzT = setTimeout(function () { endPad(true); }, 250); }); setTimeout(updYield, 60); setTimeout(endPad, 400);
    setInterval(function () { if (!document.hidden) { updYield(); endPad(); } }, 1000);
    if (CHAT_OWN) { document.body.appendChild(launch); var own = function (e) { e.preventDefault(); e.stopPropagation(); var b = document.getElementById('botBtn'); b && b.click(); }; pill.addEventListener('click', own); chr.addEventListener('click', own); return; }
    win = document.createElement('section'); win.id = 'vp-chat'; win.setAttribute('role', 'dialog'); win.setAttribute('aria-label', 'Ask VCFO chat');
    win.innerHTML = '<span class="vpc-pk" aria-hidden="true">' + charSVG('vpv-peek') + '</span><div class="vpc-h"><span class="vpc-av">' + headSVG('vpvA') + '</span><span><b>Ask VCFO</b><small>Answers from Northwind’s project data</small></span><button type="button" aria-label="Close chat" data-close>×</button></div><div class="vpc-ms" aria-live="polite"></div><div class="vpc-sg">' +
      Object.keys(QA).map(function (q) { return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div><form><input aria-label="Type a question" placeholder="Type a question"><button type="submit">Send</button></form>';
    document.body.appendChild(win); document.body.appendChild(launch);
    var toggle = function (e) { e.preventDefault(); e.stopPropagation(); win.classList.contains('on') ? closeChat() : openChat(); };
    pill.addEventListener('click', toggle); chr.addEventListener('click', toggle);
    win.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('[data-close]')) return closeChat();
      var q = e.target.closest('[data-q]'); if (q) return ask(q.getAttribute('data-q'));
      var wg = e.target.closest('[data-wgo]'); if (wg) { var g = wg.getAttribute('data-wgo'); if (/[\/.]/.test(g)) vcfoNav(g); else go(g); return; }
      if (e.target.closest('[data-handoff]')) { var l = chatLog(); l.push({ r: 'a', t: 'Sent to Bharath. You will get a reply by email within 1 working day.' }); saveLog(l); renderLog(); toast('Handed off to Bharath', true); }
    });
    win.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var i = win.querySelector('input'); var v = i.value.trim(); if (v) { ask(v); i.value = ''; } else { i.focus(); toast('Type a question first, or pick one above'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && win.classList.contains('on')) closeChat(); });
    renderLog();
    if (/(^|[#&])chat\b/.test(location.hash) || store.get('openChat', false)) { store.set('openChat', false); setTimeout(openChat, 500); }
  }
  function openChat(q) {
    if (CHAT_OWN) { var b = document.querySelector('[aria-label="Chat with Ask VCFO"]'); b && b.click(); return; }
    if (!launch || !win) buildChat();   // a What's this? click can arrive before boot has built the chat
    if (!launch || !win) return;
    var pill = launch.querySelector('.vpl-pill');
    lastFocus = document.activeElement; win.classList.add('on'); launch.classList.add('open'); document.documentElement.classList.add('vp-chat-on'); updYield();
    pill.setAttribute('aria-expanded', 'true'); pill.setAttribute('aria-label', 'Close Ask VCFO chat');
    renderLog(); setTimeout(function () { win.querySelector('input').focus({ preventScroll: true }); }, 60);
    if (q) ask(q);
  }
  function closeChat() {
    if (!launch || !win) return;
    var pill = launch.querySelector('.vpl-pill');
    win.classList.remove('on'); launch.classList.remove('open'); document.documentElement.classList.remove('vp-chat-on'); updYield();
    pill.setAttribute('aria-expanded', 'false'); pill.setAttribute('aria-label', 'Open Ask VCFO chat');
    pill.focus({ preventScroll: true });
  }
  function ask(q) {
    var l = chatLog(); l.push({ r: 'u', t: q }); saveLog(l); renderLog();
    var box = win.querySelector('.vpc-ms'); box.insertAdjacentHTML('beforeend', '<div class="vpc-m vpc-a vpc-ty"><i></i><i></i><i></i></div>'); box.scrollTop = 1e6;
    win.classList.add('vpc-think');
    setTimeout(function () {
      var w = whatsThis(q), a = QA[q], l2 = chatLog(), m = w ? { r: 'a', t: w.title, w: w, k: 'ok' } : a ? { r: 'a', t: a, k: 'ok' } : { r: 'a', t: 'I can’t answer that one yet. I can pass it to Northwind’s project lead.', h: true, k: 'nan' };
      l2.push(m); saveLog(l2); renderLog(); setMood(m.k, true);
    }, reduce ? 0 : 900);
  }
  window.vcfoChat = function (q) { openChat(q); };
  /* hide robots drawn inside the boards: the global launcher replaces them */
  function hideBoardBots() {
    if (CHAT_OWN) return;
    [].forEach.call(document.querySelectorAll('[aria-label="Open Ask VCFO"], button.face, .bot > .face'), function (b) {
      if (b.closest('#vp-launch')) return;
      var n = b, hop = 0;
      while (n && n !== document.body && hop++ < 8) { var cs = getComputedStyle(n); if (cs.position === 'absolute' || cs.position === 'fixed') break; n = n.parentElement; }
      (n && n !== document.body ? n : b).classList.add('vp-hide-bot');
    });
    [].forEach.call(document.querySelectorAll('[aria-label="Ask VCFO chat"],#ask-panel'), function (p) { if (!p.closest('#vp-chat')) p.classList.add('vp-hide-bot'); });
  }

  /* ---------- fixed navigation: the sidebar and the top bar never scroll away ---------- */
  function unclip(el) { for (var a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) { var o = getComputedStyle(a); if (/hidden|auto|scroll/.test(o.overflow + o.overflowX + o.overflowY) && a !== document.body) a.style.overflow = 'clip'; } }
  function pinNav() {
    if (window.__vcfoNoPin) return true;
    var done = 0, all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (e.closest('#vp-chat,#vp-launch,#vp-bar,#tle-scrim,.vps,#vp-drawer-scrim')) continue;
      if (!e.__vpSide && e.getAttribute('data-vp') !== 'side') {
        var r = e.getBoundingClientRect(), cs;
        if (r.width >= 236 && r.width <= 260 && r.height >= 600 && r.left < 4 + (innerWidth > 1440 ? (innerWidth - 1440) / 2 : 0) && (cs = getComputedStyle(e)) && /^rgba?\(15, 42, 74/.test(cs.backgroundColor) && !e.parentElement.closest('[data-vp="side"]')) {
          e.setAttribute('data-vp', 'side'); unclip(e);
          e.style.position = 'sticky'; e.style.top = '0'; e.style.alignSelf = 'flex-start'; e.style.height = '100vh'; e.style.maxHeight = '100vh'; e.style.overflowY = 'auto'; e.style.overflowX = 'hidden'; e.style.zIndex = '30';
          [].forEach.call(e.querySelectorAll('*'), function (k) { var kr = k.getBoundingClientRect(); if (kr.width >= 236 && /min-height/.test(k.getAttribute('style') || '')) k.style.minHeight = '100vh'; });
          done++;
        }
      }
    }
    var h = [].find.call(document.querySelectorAll('header'), function (x) { var r = x.getBoundingClientRect(); return r.height >= 48 && r.height <= 60 && r.width > Math.min(600, innerWidth - 40) && r.top + scrollY < 4 && !x.closest('#vp-chat,#tle-scrim'); });
    if (h && !h.closest('[data-vp="top"]')) {
      var w = h; while (w.parentElement && w.parentElement !== document.body && Math.abs(w.parentElement.getBoundingClientRect().height - h.getBoundingClientRect().height) < 2) w = w.parentElement;
      w.setAttribute('data-vp', 'top'); unclip(w); w.style.position = 'sticky'; w.style.top = '0'; w.style.zIndex = '40';
      if (getComputedStyle(h).backgroundColor === 'rgba(0, 0, 0, 0)') h.style.background = '#fff';
      done++;
    }
    return done > 0 || !!document.querySelector('[data-vp]');
  }

  /* item 13: keep tooltips only where the meaning is not obvious (rule 17 spirit) */
  var OBVIOUS = /^(WhatsApp|Call|Email|Teams|Phone|Message)\b|^About\b|^More actions\b|^Notifications(,|$)|^(More information|Close|Ask VCFO|Open Ask VCFO|SBC home|Search( \(Ctrl K\))?|Details|Open|Open menu|Announcements|Photo placeholder|PDF file|Word document|Excel (sheet|file)|PowerPoint( deck| file)?|Text file|CSV file|Image \([A-Z]+\))$/i;
  function tidyTips() {
    [].forEach.call(document.querySelectorAll('[data-tip]'), function (e) {
      if (e.closest('.vps')) return;
      var t = e.getAttribute('data-tip') || '', txt = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (OBVIOUS.test(t) || (txt.length > 2 && txt.toLowerCase().indexOf(t.toLowerCase()) === 0)) { e.removeAttribute('data-tip'); e.classList.remove('tip'); e.setAttribute('data-notip', ''); }
    });
    [].forEach.call(document.querySelectorAll('[title]'), function (e) {
      if (e.closest('svg') || e.tagName === 'IFRAME' || e.tagName === 'LINK' || e.tagName === 'STYLE') return;
      var t = e.getAttribute('title'); if (!e.getAttribute('aria-label') && !(e.textContent || '').trim() && /^(A|BUTTON)$/.test(e.tagName)) e.setAttribute('aria-label', t);
      e.removeAttribute('title');
    });
    [].forEach.call(document.querySelectorAll('a[aria-label],button[aria-label],[role="button"][aria-label]'), function (e) { if (OBVIOUS.test(e.getAttribute('aria-label')) && !e.hasAttribute('data-notip')) e.setAttribute('data-notip', ''); });
  }
  var pinTries = 0;
  function upkeep() { countMuts(muObs.takeRecords()); buildChat(); hideBoardBots(); pinNav(); tidyTips(); muObs.takeRecords(); if (pinTries++ < 30) setTimeout(upkeep, 200); }

  function openTimeline() {
    if (window.vcfoTimeline) return window.vcfoTimeline.open();
    injectScript('tl-editor.js', function () { window.vcfoTimeline.open(); });
  }
  window.vcfoOpenTimeline = openTimeline;
  /* ---------- one drill-down pop-up for charts drawn outside the boards (rule 14) ---------- */
  var dcss = document.createElement('style');
  dcss.textContent = [
    '#vp-drill{width:min(600px,100%);max-height:calc(100vh - 120px);display:flex;flex-direction:column;background:light-dark(#fff, oklch(13% 0 89.9));border-radius:12px;box-shadow:0 30px 70px -20px rgba(8,20,40,.6);overflow:hidden;font:500 13px/1.45 Public Sans,system-ui,sans-serif;color:light-dark(#0f1b2d, oklch(91.2% 0.028 258.3));transform:translateY(10px) scale(.98);transition:transform .24s cubic-bezier(.22,1,.36,1)}',
    '#vp-drill-scrim.on #vp-drill{transform:none}',
    '#vp-drill .top{display:flex;align-items:center;gap:8px;padding:9px 18px;background:light-dark(#eef3ff, oklch(18.4% 0.01 267.8));border-bottom:1px solid light-dark(#e3e8ef, oklch(24.8% 0.011 256.7));font-size:12px;color:#667180}',
    '#vp-drill .top a{margin-left:auto;font-weight:800;font-size:12.5px;color:#2e5cff;text-decoration:none;white-space:nowrap}',
    '#vp-drill .hd{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid light-dark(#e3e8ef, oklch(24.8% 0.011 256.7))}',
    '#vp-drill .hd b{flex:1;font:700 15px Public Sans;color:light-dark(#15263b, oklch(88.7% 0.047 254.4))}',
    '#vp-drill .hd small{display:block;font:500 12px Public Sans;color:#667180}',
    '#vp-drill .x{width:32px;height:32px;border-radius:6px;border:1px solid light-dark(#e3e8ef, oklch(24.8% 0.011 256.7));background:light-dark(#fff, oklch(13% 0 89.9));color:#667180;cursor:pointer;font-size:18px;line-height:1}',
    '#vp-drill .tabs{display:flex;gap:2px;margin:14px 18px 0;padding:2px;border-radius:8px;background:light-dark(#f1f4f8, oklch(18.1% 0.006 255.5));box-shadow:inset 0 0 0 1px #e3e8ef}',
    '#vp-drill .tabs button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;border:0;border-radius:6px;background:none;font:600 12px Public Sans;color:#667180;cursor:pointer;white-space:nowrap}',
    '#vp-drill .tabs button i{width:8px;height:8px;border-radius:2px;display:inline-block}',
    '#vp-drill .tabs button span{font:600 11px "IBM Plex Mono",monospace;opacity:.75}',
    '#vp-drill .tabs button[aria-selected=true]{background:#15263b;color:#fff}',
    '#vp-drill .list{flex:1;min-height:0;overflow:auto;padding:8px 18px 6px;scrollbar-width:none}',
    '#vp-drill .list::-webkit-scrollbar{display:none}',
    '#vp-drill .r{display:grid;grid-template-columns:minmax(0,1fr) auto auto 16px;align-items:center;gap:12px;padding:9px 10px;margin:0 -10px;border-radius:6px;cursor:pointer;color:inherit;text-decoration:none}',
    '#vp-drill .r:hover{background:light-dark(#f7f9fc, oklch(16.7% 0.005 258.3))}',
    '#vp-drill .r b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#vp-drill .r em{font:500 12px "IBM Plex Mono",monospace;font-style:normal;color:#667180;white-space:nowrap}',
    '#vp-drill .r .c{font:700 11px Public Sans;padding:2px 7px;border-radius:6px;color:#fff;white-space:nowrap}',
    '#vp-drill .r .a{color:#2e5cff}',
    '#vp-drill .ft{padding:10px 18px;border-top:1px solid light-dark(#e3e8ef, oklch(24.8% 0.011 256.7));background:light-dark(#f7f9fc, oklch(16.7% 0.005 258.3));font-size:12px;color:#667180}',
    '@media (max-width:700px){#vp-drill-scrim{align-items:flex-end;padding:0}#vp-drill{width:100%;border-radius:14px 14px 0 0;max-height:86vh}}'
  ].join('\n');
  document.head.appendChild(dcss);
  function drill(cfg) {
    var old = document.getElementById('vp-drill-scrim'); if (old) old.remove();
    var tab = cfg.active || 0, last = document.activeElement;
    var sc = document.createElement('div'); sc.id = 'vp-drill-scrim';
    sc.innerHTML = '<div id="vp-drill" role="dialog" aria-modal="true" aria-labelledby="vp-drill-t">' +
      (cfg.link ? '<div class="top"><span>' + cfg.link.lead + '</span><a href="#" data-dlink>' + cfg.link.text + '</a></div>' : '') +
      '<div class="hd"><b id="vp-drill-t">' + cfg.title + (cfg.sub ? '<small>' + cfg.sub + '</small>' : '') + '</b><button type="button" class="x" aria-label="Close">×</button></div>' +
      '<div class="tabs" role="tablist"></div><div class="list"></div><div class="ft"></div></div>';
    document.body.appendChild(sc); requestAnimationFrame(function () { sc.classList.add('on'); });
    function paint() {
      sc.querySelector('.tabs').innerHTML = cfg.tabs.map(function (t, i) { return '<button type="button" role="tab" aria-selected="' + (i === tab) + '" data-t="' + i + '">' + (t.color ? '<i style="background:' + t.color + '"></i>' : '') + t.label + '<span>' + (t.n != null ? t.n : t.rows.length) + '</span></button>'; }).join('');
      var t = cfg.tabs[tab], rows = t.rows;
      sc.querySelector('.list').innerHTML = rows.length ? rows.map(function (r, i) { return '<a href="#" class="r" data-r="' + i + '"><b>' + r[0] + '</b><em>' + (r[1] || '') + '</em>' + (r[2] ? '<span class="c" style="background:' + (r[3] || '#667180') + '">' + r[2] + '</span>' : '<span></span>') + '<span class="a">→</span></a>'; }).join('') : '<div style="padding:16px 0;color:#667180">Nothing here.</div>';
      var total = t.n != null ? t.n : rows.length;
      sc.querySelector('.ft').textContent = rows.length < total ? 'Showing ' + rows.length + ' of ' + total + ' · the full list is in ' + (cfg.link ? cfg.link.where || 'the app' : 'the app') : 'Showing all ' + total;
    }
    function close() { document.removeEventListener('keydown', key, true); sc.classList.remove('on'); setTimeout(function () { sc.remove(); }, reduce ? 0 : 160); last && last.focus && last.focus({ preventScroll: true }); }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', key, true);
    sc.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target === sc || e.target.closest('.x')) { e.preventDefault(); return close(); }
      var b = e.target.closest('[data-t]'); if (b) { tab = +b.getAttribute('data-t'); paint(); return; }
      if (e.target.closest('[data-dlink]')) { e.preventDefault(); close(); if (cfg.link.go) go(cfg.link.go); else if (cfg.link.onClick) cfg.link.onClick(); return; }
      var r = e.target.closest('[data-r]'); if (r) { e.preventDefault(); var row = cfg.tabs[tab].rows[+r.getAttribute('data-r')]; close(); if (row[4]) go(row[4]); else toast('Opening ' + row[0] + '…'); }
    });
    paint(); setTimeout(function () { var f = sc.querySelector('.x'); f && f.focus({ preventScroll: true }); }, 40);
  }
  window.vcfoDrill = drill;
  /* a tooltip at a point, for charts drawn as pictures (rule 14 hover) */
  window.vcfoTipAt = function (x, y, txt) {
    if (!tip) { tip = document.createElement('div'); tip.id = 'vp-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    if (txt == null) { tip.classList.remove('on'); return; }
    tip.textContent = txt; tip.style.left = Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, x - tip.offsetWidth / 2)) + 'px'; tip.style.top = (y - 40 < 4 ? y + 18 : y - 40) + 'px'; tip.classList.add('on');
  };
  window.vcfoToast = function (m, u, cb) { toast(m, u, cb); };
  if (!LEADPG) injectScript('shell.js');   // Lead screens draw their own sidebar
  function botPops() {
    if (!LEADPG || !/^(lead|mgr)-home/.test(here() || '')) return;
    try { if (sessionStorage.getItem('vcfo.botpop')) return; sessionStorage.setItem('vcfo.botpop', '1'); } catch (e) {}
    var M = [
      { t: 'Kestrel Health is incorporated · COI 14 Oct 2026', b: 'It moved to Compliance. 6 filings are now on your calendar.', a: [['Open calendar', 'lead-compliances']] },
      { t: '2 steps are late, 6 filings need you.', b: 'Start with the red rows in the action queue, then the Tuesday GST and TDS filings.', a: [['Ask VCFO why', 'chat']] }
    ];
    var st = document.createElement('style');
    st.textContent = '.vp-pop{position:fixed;right:var(--vpl-in,20px);bottom:calc(var(--vp-launch-h,72px) + 8px);z-index:2147482600;width:min(340px,calc(100vw - 24px));display:flex;gap:10px;align-items:flex-start;background:#fff;color:#15263b;border:1px solid #d6e2f5;border-radius:14px 14px 4px 14px;box-shadow:0 18px 40px -14px rgba(15,42,74,.45);padding:12px 12px 12px 12px;font:13px/1.4 Public Sans,system-ui,sans-serif;opacity:0;transform:translateY(12px) scale(.98);transform-origin:bottom right;transition:opacity .28s ease,transform .28s ease}' +
      '.vp-pop.on{opacity:1;transform:none}.vp-pop img{width:36px;height:36px;flex:none}.vp-pop b{display:block;font-size:13px}.vp-pop p{margin:2px 0 8px;color:#667180;font-size:12px}' +
      '.vp-pop .vp-pa{display:flex;gap:6px;flex-wrap:wrap}.vp-pop .vp-pa button{height:28px;padding:0 10px;border-radius:8px;font:600 12px Public Sans,sans-serif;cursor:pointer;border:1px solid #d0d5dd;background:#fff;color:#15263b}.vp-pop .vp-pa button:first-child{background:#15263b;border-color:#15263b;color:#fff}' +
      '.vp-pop .vp-px{margin-left:auto;border:0;background:none;color:#98a1ae;font-size:15px;cursor:pointer;padding:0 2px;line-height:1}.vp-pop small{display:block;margin-top:8px;font:600 10.5px IBM Plex Mono,monospace;letter-spacing:.04em;color:#98a1ae}' +
      '@media (prefers-reduced-motion:reduce){.vp-pop{transition:none}}';
    document.head.appendChild(st);
    var bot = window.__binUrl ? window.__binUrl('s/home/assets/vcfo-bot-avatar.svg') : '';
    var i = 0;
    function next() {
      if (i >= M.length) return;
      var m = M[i++], el = document.createElement('div'), timer;
      el.className = 'vp-pop'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      el.innerHTML = (bot ? '<img alt="" src="' + bot + '">' : '') + '<div style="flex:1;min-width:0"><b></b><p></p><div class="vp-pa"></div><small>SAVED TO NOTIFICATIONS · CHATBOT</small></div><button type="button" class="vp-px" aria-label="Dismiss">×</button>';
      el.querySelector('b').textContent = m.t; el.querySelector('p').textContent = m.b;
      function hide() { clearTimeout(timer); el.classList.remove('on'); setTimeout(function () { el.remove(); setTimeout(next, 500); }, 320); }
      m.a.forEach(function (a) { var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = a[0];
        bt.onclick = function () { hide(); if (a[1] === 'chat') { if (window.vcfoChat) window.vcfoChat(m.t); } else go(a[1]); }; el.querySelector('.vp-pa').appendChild(bt); });
      el.querySelector('.vp-px').onclick = hide;
      el.onmouseenter = function () { clearTimeout(timer); };
      el.onmouseleave = function () { timer = setTimeout(hide, 2500); };
      document.body.appendChild(el);
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
      timer = setTimeout(hide, 6500);
    }
    setTimeout(next, 1200);
  }
  function boot() { buildBar(); upkeep(); botPops(); if ([].some.call(document.querySelectorAll('script'), function () { return true; }) && /\/s\/home\//.test(curPath())) { injectScript('tl-editor.js'); } setTimeout(function () { document.documentElement.classList.remove('vp-enter'); }, 400); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* design-system v1.2 layer and the lead sign-out (added by proto-fix/patch.mjs) */
(function () {
  var css = "/* VCFO Suite design system v1.2, applied on top of every prototype screen.\n   Appended last by proto.js, so it wins over each screen's own stylesheet; inline styles that\n   carry their own colours were already rewritten to the tokens by patch.mjs. */\n:root {\n  --ds-font: Public Sans, system-ui, -apple-system, \"Segoe UI\", sans-serif;\n  --ds-line: #e3e6eb; --ds-sunken: #eef0f3; --ds-ink: #15263b; --ds-ink-muted: #667180;\n}\nhtml, body { font-family: var(--ds-font); }\n\n/* Links in navigation never underline (fixes the leak on Analytics, Chat and the Work views). */\naside a, nav a, aside a *, nav a * { text-decoration: none !important; }\n\n/* Tables: uppercase label heads on surface-sunken under a 2px ink rule, 40px rows with hairlines,\n   every second row striped. Mono never sets a table head. */\ntable th {\n  font-family: var(--ds-font) !important; font-size: 11px !important; font-weight: 600 !important;\n  letter-spacing: .06em !important; text-transform: uppercase; color: var(--ds-ink-muted) !important;\n}\ntable.tbl, table.ds-table { border-collapse: collapse !important; }\ntable.tbl > thead th, table.ds-table > thead th {\n  background: var(--ds-sunken) !important; border-bottom: 1px solid #e3e6eb !important; padding: 8px 12px !important;\n}\ntable.tbl > tbody td, table.ds-table > tbody td {\n  height: 40px; padding-top: 4px !important; padding-bottom: 4px !important;\n  border-top: 1px solid var(--ds-line) !important; border-bottom: 0 !important;\n}\ntable.tbl > tbody > tr:nth-child(even) > td, table.ds-table > tbody > tr:nth-child(even) > td { background-color: rgba(238, 242, 247, .55); }\n\n/* Chips: 6px corners on the 6 / 8 / 10 / 12 scale; chips in a column share one width. */\n.chip, .tag, .new { border-radius: 6px !important; }\ntd .chip { min-width: 88px; justify-content: center; }\n\n/* Buttons: at least 84px wide, labels never wrap. */\n.btn, .btnp { min-width: 84px; white-space: nowrap; }\n.btn:not(.btn-sm) { height: 32px; }\n\n/* Shadows: the two tokens only. */\n.card { box-shadow: 0 1px 2px rgba(15, 42, 74, .06), 0 1px 1px rgba(15, 42, 74, .04) !important; }\n\n/* The heatmap and the filings grid sit on the same rows as every other table (see patch.mjs). */\n.ds-rows > .ds-row { border-top: 1px solid var(--ds-line); }\n.ds-rows > .ds-row:nth-child(odd) { background: rgba(238, 242, 247, .55); }\n.ds-head { background: var(--ds-sunken); border-bottom: 1px solid #e3e6eb; }\n.ds-head > span { font: 600 11px/16px var(--ds-font) !important; letter-spacing: .06em !important; text-transform: uppercase; color: var(--ds-ink-muted) !important; }\n\n/* Mono only on identifiers: proto.js marks every other mono element. */\n[data-ds-sans], [data-ds-sans] * { font-family: var(--ds-font) !important; font-variant-numeric: tabular-nums; letter-spacing: 0 !important; }\n\n/* Breadcrumb segments that lead somewhere. */\n.ds-crumb { cursor: pointer; border-radius: 4px; }\n.ds-crumb:hover, .ds-crumb:focus-visible { text-decoration: underline; color: #2563a8 !important; }\n\n/* Buttons on a navy ground (the client page header) keep their light-on-dark style: proto.js marks them\n   data-ds-ondark. Buttons follow the book (lead and manager screens carry html.ds-staff; the client portal has its own button CSS): 8px corners, 13px labels, brand blue primary, white secondary on a hairline.\n   The lead and manager screens drew primaries in navy (the ink colour); proto.js marks every navy-filled\n   control so these rules can recolour it: data-ds-primary for an action, data-ds-on for the selected\n   option of a segmented control or filter row, data-ds-count for a count pill. */\n.btn { border-radius: 8px !important; font-size: 13px !important; }\nhtml.ds-staff .btn:not(.btnp):not([data-ds-primary]):not([data-ds-on]):not([data-ds-ondark]) { background: #fff; border-color: #e3e6eb !important; box-shadow: 0 1px 2px rgba(15, 42, 74, .06), 0 1px 1px rgba(15, 42, 74, .04); }\nhtml.ds-staff .btnp, [data-ds-primary] { background: #1f3b5c !important; border-color: #1f3b5c !important; color: #fff !important; }\nhtml.ds-staff .btnp:hover, [data-ds-primary]:hover { background: #18304c !important; border-color: #18304c !important; }\n[data-ds-on] { background: #1f3b5c !important; border-color: #1f3b5c !important; color: #fff !important; box-shadow: none !important; }\n[data-ds-count] { background: #e6effa !important; color: #2563a8 !important; }\n\n/* Compact filters: a dropdown per filter that matters, its label naming the choice; brand-soft when not on\n   its default. One popover style for filters and the More menu. */\n.ds-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; position: relative; }\n.ds-bar-in { border-top: 1px solid #e3e6eb; padding-top: 10px; }\n.ds-ddw { position: relative; display: inline-flex; }\n.ds-dd { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px 0 12px; border-radius: 8px; border: 1px solid #e3e6eb; background: #fff; color: #15263b; font: 600 13px var(--ds-font); cursor: pointer; white-space: nowrap; box-shadow: 0 1px 2px rgba(15, 42, 74, .06); }\n.ds-dd:hover { background: #f7f9fc; }\n.ds-dd[data-active=\"true\"] { background: #e6effa; border-color: #c5d8f0; color: #2563a8; }\n.ds-chev { color: #667180; transition: transform .2s ease-out; }\n.ds-dd[data-active=\"true\"] .ds-chev { color: #2563a8; }\n.ds-dd[aria-expanded=\"true\"] .ds-chev { transform: rotate(180deg); }\n.ds-icon { width: 32px; padding: 0; justify-content: center; }\n.ds-dd:focus-visible, .ds-opt:focus-visible, .ds-lnk:focus-visible { outline: 2px solid #2563a8; outline-offset: 2px; }\n.ds-pop { position: absolute; top: calc(100% + 6px); left: 0; z-index: 41; min-width: 220px; background: #fff; border: 1px solid #e3e6eb; border-radius: 8px; box-shadow: 0 12px 32px -12px rgba(15, 42, 74, .35), 0 2px 6px rgba(15, 42, 74, .08); padding: 6px; display: flex; flex-direction: column; gap: 1px; }\n.ds-pop-r { left: auto; right: 0; }\n.ds-pop-h { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 6px; font: 600 11px var(--ds-font); letter-spacing: .06em; text-transform: uppercase; color: #667180; }\n.ds-lnk { border: 0; background: none; color: #2563a8; font: 600 12px var(--ds-font); cursor: pointer; padding: 2px 4px; border-radius: 4px; text-transform: none; letter-spacing: 0; }\n.ds-opt { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 32px; padding: 0 8px; border: 0; border-radius: 6px; background: none; color: #15263b; font: 500 13px var(--ds-font); cursor: pointer; text-align: left; white-space: nowrap; }\n.ds-opt:hover { background: #f7f9fc; }\n.ds-opt i { width: 8px; height: 8px; border-radius: 2px; flex: none; }\n.ds-opt[aria-pressed=\"true\"] { font-weight: 600; }\n.ds-cb { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid #b4bcc7; flex: none; display: grid; place-items: center; }\n.ds-opt[aria-pressed=\"true\"] .ds-cb { background: #2563a8; border-color: #2563a8; }\n.ds-opt[aria-pressed=\"true\"] .ds-cb::after { content: \"\"; width: 8px; height: 4px; border: 2px solid #fff; border-top: 0; border-right: 0; transform: translateY(-1px) rotate(-45deg); }\n.ds-rd { width: 16px; height: 16px; flex: none; display: grid; place-items: center; color: #2563a8; font-size: 13px; font-weight: 700; }\n.ds-opt[aria-pressed=\"true\"] .ds-rd::after { content: \"\\2713\"; }\n.ds-scrim { position: fixed; inset: 0; z-index: 40; }\n\n/* Sidebar folds: the real app's chevron, turned when the group is open. */\n.ds-fold { position: absolute; right: 6px; top: 6px; width: 24px; height: 24px; display: grid; place-items: center; border: 0; border-radius: 6px; background: none; color: #9fb0c6; cursor: pointer; padding: 0; }\n.ds-fold:hover { background: rgba(255, 255, 255, .08); color: #fff; }\n.ds-fold svg { transition: transform .3s ease-out; }\n.ds-fold[aria-expanded=\"true\"] svg { transform: rotate(180deg); }\n.ds-fold:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }\n/* Team tasks legend rows filter by status; the picked row takes the same selected look as a filter. */\n.mt-lg[aria-pressed=\"true\"] { background: #e6effa !important; box-shadow: inset 0 0 0 1px #c5d8f0 !important; color: #2563a8; }\n\n/* Admin assign dialog (admin/assign.js): one dialog, the float shadow, 8px fields. */\n.ds-dlg-scrim { position: fixed; inset: 0; z-index: 60; background: rgba(15, 42, 74, .32); display: grid; place-items: center; padding: 16px; }\n.ds-dlg { width: min(460px, 100%); background: #fff; border-radius: 12px; box-shadow: 0 24px 60px -20px rgba(15, 42, 74, .5); padding: 20px; display: flex; flex-direction: column; gap: 12px; font: 13px var(--ds-font); color: #15263b; }\n.ds-dlg h2 { margin: 0; font-size: 16px; font-weight: 600; }\n.ds-dlg-p { margin: -6px 0 2px; color: #667180; font-size: 12.5px; }\n.ds-f { display: flex; flex-direction: column; gap: 6px; }\n.ds-f > span { font-size: 12px; font-weight: 600; color: #667180; }\n.ds-f select, .ds-f input { height: 36px; border: 1px solid #c5ced9; border-radius: 8px; padding: 0 10px; font: 13px var(--ds-font); color: #15263b; background: #fff; }\n.ds-f select:focus, .ds-f input:focus { outline: 2px solid #2563a8; outline-offset: 1px; border-color: #2563a8; }\n.ds-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }\n.ds-mgrs { display: flex; flex-direction: column; gap: 6px; }\n.ds-mc { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid #e3e6eb; border-radius: 8px; cursor: pointer; }\n.ds-mc:has(input:checked) { border-color: #2563a8; background: #e6effa; }\n.ds-mc input { accent-color: #2563a8; }\n.ds-mc b { display: block; font-weight: 600; }\n.ds-mc em { font-style: normal; font-size: 12px; color: #667180; }\n.ds-mc .pt { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; background: #eef0f3; font-size: 10.5px; font-weight: 600; }\n.ds-dlg-f { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }\n\n/* Calm, professional surfaces on every staff portal (owner, 23 Oct: \"looks like a slide deck\").\n   Card titles read like product headings, not slide titles: sentence case, 14px, no icon tile.\n   Cards are flat with a hairline. */\nhtml.ds-staff .ch > .tile, html.ds-staff .pa-t { display: grid !important; place-items: center; width: 28px !important; height: 28px !important; border-radius: 8px !important; flex: none; }\nhtml.ds-staff .ch > .tile svg, html.ds-staff .pa-t svg { width: 15px; height: 15px; }\nhtml.ds-staff h2.st, html.ds-staff .pa-h h2 { text-transform: none !important; letter-spacing: 0 !important; font-size: 14px !important; font-weight: 600 !important; color: #15263b !important; }\nhtml.ds-staff .card, html.ds-staff .pa-c { box-shadow: none !important; border-radius: 8px !important; }\nhtml.ds-staff .ch > .new, html.ds-staff .ch .new { display: none !important; }\n/* Greeting (owner, 26 Oct, from the font-options artifact): a navy band holds the date and the name;\n   the numbers sit in a white strip under it, label above the number. Faint layered peaks (Haikei) add depth. */\nhtml.ds-staff [data-card=\"greeting\"], html.ds-staff .hero { background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 120' preserveAspectRatio='none'%3E%3Cpath d='M0 90 L70 60 L140 80 L230 40 L310 70 L400 30 L480 62 L600 36 L600 120 L0 120Z' fill='%23fff' fill-opacity='.05'/%3E%3Cpath d='M0 104 L90 78 L170 96 L260 70 L350 92 L440 64 L520 86 L600 72 L600 120 L0 120Z' fill='%23fff' fill-opacity='.06'/%3E%3C/svg%3E\") right bottom / 70% 100% no-repeat, linear-gradient(100deg, #1b3049, #15263b 70%) !important; color: #fff !important; border: 1px solid #15263b !important; box-shadow: none !important; border-radius: 10px !important; padding-bottom: 0 !important; overflow: hidden !important; }\nhtml.ds-staff [data-card=\"greeting\"] h1, html.ds-staff .hero h1 { font-size: 20px !important; color: #fff !important; }\nhtml.ds-staff [data-card=\"greeting\"] .mono, html.ds-staff .hero .when { color: #9fb2c8 !important; opacity: 1 !important; }\nhtml.ds-staff [data-card=\"greeting\"] > div[style*=\"height: 1px\"] { display: none !important; }\nhtml.ds-staff .gk, html.ds-staff .hero .kp { background: #fff !important; margin: 14px -20px 0 !important; padding: 0 20px !important; border-top: 0 !important; display: flex !important; flex-wrap: wrap; }\nhtml.ds-staff .gk > a, html.ds-staff .hero .kp > span { flex-direction: column-reverse !important; align-items: flex-start !important; gap: 2px !important; padding: 10px 22px 10px 0 !important; margin-right: 22px !important; border-right: 1px solid #e3e6eb !important; color: #15263b !important; text-decoration: none !important; }\nhtml.ds-staff .gk > a:last-child, html.ds-staff .hero .kp > span:last-child { border-right: 0 !important; }\nhtml.ds-staff .gk > a > span, html.ds-staff .hero .kp em { color: #667180 !important; font-size: 12px !important; }\nhtml.ds-staff .gk b, html.ds-staff .hero .kp b { color: #15263b !important; font-size: 20px !important; font-weight: 600 !important; }\nhtml.ds-staff .gk b[style*=\"ff9b8f\"], html.ds-staff .hero .kp b[style*=\"ff9b8f\"] { color: #be3434 !important; }\nhtml.ds-staff .hero .kp i.dl { order: -1; }\nhtml.ds-staff [data-card=\"greeting\"] .new { display: none !important; }\nhtml.ds-staff .ch > .tag { display: none !important; }\n\n/* Denser tables: 36px rows on every staff table and grid. */\nhtml.ds-staff .tbl td, html.ds-staff table.tbl > tbody td { padding-top: 10px !important; padding-bottom: 10px !important; font-size: 13.5px; }\nhtml.ds-staff table.tbl > tbody tr:hover td { background: #fafbfc; }\nhtml.ds-staff .cg td { height: 36px !important; padding-top: 4px !important; padding-bottom: 4px !important; }\nhtml.ds-staff .cg td > span.c, html.ds-staff .fg tbody td > span.fc { height: 26px !important; }\n/* A long list shows its state as a coloured word with a dot, not a filled chip (book: the busier the list, the lighter the mark). */\n.stw { display: inline-flex !important; align-items: center; justify-content: center; gap: 6px; width: auto; min-width: 108px !important; max-width: 160px; height: 22px !important; padding: 0 6px !important; border-radius: 5px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font: 600 11.5px var(--ds-font) !important; color: var(--c, #15263b) !important; background: color-mix(in srgb, var(--c, #15263b) 12%, #fff) !important; }\n.stw::before { content: \"\"; width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }\n/* This week: one thin strip; each day shows its count and its first item. */\nhtml.ds-staff [data-card=\"week\"] .wk > button { min-height: 0 !important; padding: 8px 10px !important; gap: 4px !important; }\nhtml.ds-staff [data-card=\"week\"] .wk > button > span ~ span ~ span { display: none !important; }\n/* Team tasks and Task status read as one card. */\nhtml.ds-staff [data-card=\"team-tasks\"].mt { background: #fff; border: 1px solid #e3e6eb; border-radius: 8px; gap: 0 !important; overflow: hidden; }\nhtml.ds-staff [data-card=\"team-tasks\"].mt > .card { border: 0 !important; border-radius: 0 !important; }\nhtml.ds-staff [data-card=\"team-tasks\"].mt > .card + .card { border-left: 1px solid #e3e6eb !important; }\n/* Inbox: triage and to-dos in one card with tabs; a triage row shows its actions when it is hovered or focused. */\n.ds-tabs { display: inline-flex; gap: 2px; margin-left: auto; padding: 2px; border-radius: 8px; background: #eef0f3; }\n.ds-tabs button { border: 0; background: none; height: 28px; padding: 0 10px; border-radius: 6px; font: 600 12.5px var(--ds-font); color: #667180; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }\n.ds-tabs button b { font-weight: 600; font-size: 11px; background: #fff; border-radius: 6px; padding: 0 6px; color: #15263b; }\n.ds-tabs button[aria-selected=\"true\"] { background: #fff; color: #2563a8; box-shadow: 0 1px 2px rgba(15, 42, 74, .12); }\n.ds-tabs button[aria-selected=\"true\"] b { background: #e6effa; color: #2563a8; }\n.ds-tabs button:focus-visible { outline: 2px solid #2563a8; outline-offset: 1px; }\nsection[data-inbox=\"triage\"] [data-inbox-pane=\"todos\"], section[data-inbox=\"todos\"] [data-inbox-pane=\"triage\"] { display: none; }\n[data-inbox-pane=\"triage\"] .tri-act { display: none !important; }\n[data-inbox-pane=\"triage\"] .tri-row:hover .tri-act, [data-inbox-pane=\"triage\"] .tri-row:focus-within .tri-act { display: flex !important; }\n[data-inbox-pane=\"triage\"] .tri-row { cursor: default; }\n[data-inbox-pane=\"triage\"] .tri-row:hover { background: #f7f9fc; }\n[data-inbox-pane=\"triage\"] .tri-row > .mut { margin-bottom: 0 !important; }\n[data-inbox-pane=\"triage\"] .tri-row:hover > .mut, [data-inbox-pane=\"triage\"] .tri-row:focus-within > .mut { margin-bottom: 7px !important; }\n/* A stuck step is one red mark in the Action queue header, not a card of its own. */\n.ds-stuck { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 8px; border-radius: 6px; background: #fbe6e6; color: #be3434 !important; font: 600 12px var(--ds-font); text-decoration: none !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; margin-left: 4px; }\n.ds-stuck::before { content: \"\"; width: 7px; height: 7px; border-radius: 50%; background: #be3434; flex: none; }\n.ds-stuck:hover { background: #f6d2d2; }\n.ds-stuck:focus-visible { outline: 2px solid #be3434; outline-offset: 1px; }\n/* Task rows (owner, 26 Oct, Linear style): a checkbox ticks the task done; one 14px icon gives its state;\n   a late task shows a red due date instead of the word \"Overdue\". */\n.tsi { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #98a1ae; display: inline-block; position: relative; flex: none; box-sizing: border-box; vertical-align: -2px; }\n.tsi[data-s=\"run\"] { border-color: #2563a8; background: linear-gradient(90deg, #2563a8 50%, transparent 50%); }\n.tsi[data-s=\"wait\"] { border-color: #a35f00; }\n.tsi[data-s=\"wait\"]::before { content: \"\"; position: absolute; left: 4.5px; top: 1.5px; width: 1.5px; height: 4px; background: #a35f00; }\n.tsi[data-s=\"wait\"]::after { content: \"\"; position: absolute; left: 4.5px; top: 5px; width: 3.5px; height: 1.5px; background: #a35f00; }\n.tsi[data-s=\"done\"] { border-color: #1e7f55; background: #1e7f55; }\n.tsi[data-s=\"done\"]::after { content: \"\"; position: absolute; left: 3.5px; top: 1.5px; width: 3px; height: 6px; border: solid #fff; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }\ntd.tk { width: 52px; white-space: nowrap; }\ntd.tk input { width: 15px; height: 15px; margin: 0 8px 0 0; accent-color: #1e7f55; vertical-align: -3px; }\n\n/* Table heads (owner, 26 Oct, from the font-options artifact): pale navy, navy text, sentence case. */\nhtml.ds-staff table > thead th, html.ds-staff .ds-head, html.ds-staff .cg thead th { background: #eef2f8 !important; color: #1f3b5c !important; text-transform: none !important; letter-spacing: 0 !important; font-size: 12px !important; font-weight: 600 !important; }\nhtml.ds-staff .ds-head > span, html.ds-staff .ds-head > span > span, html.ds-staff .mr .h, html.ds-staff .rk.h > span { color: #1f3b5c !important; text-transform: none !important; letter-spacing: 0 !important; font-size: 12px !important; }\nhtml.ds-staff .mr[style*=\"background: #eef0f3\"], html.ds-staff .rk.h { background: #eef2f8 !important; }\nhtml.ds-staff .cnt { white-space: pre; }\n/* Live status pill (owner pick, 26 Oct): one calm place at the top of the screen for work that is running. */\n#ds-island { position: fixed; top: 10px; left: 50%; transform: translateX(-50%) scale(.9); opacity: 0; z-index: 2147482000; display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 14px; border-radius: 999px; background: #15263b; color: #fff; font: 600 12.5px var(--ds-font); box-shadow: 0 6px 20px rgba(15, 42, 74, .25); transition: opacity .25s, transform .25s; pointer-events: none; white-space: nowrap; }\n#ds-island.on { opacity: 1; transform: translateX(-50%) scale(1); }\n#ds-island .sp { width: 12px; height: 12px; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; animation: dsspin .7s linear infinite; }\n#ds-island .ok { width: 14px; height: 14px; border-radius: 50%; background: #2fb37f; position: relative; }\n#ds-island .ok::after { content: \"\"; position: absolute; left: 4.5px; top: 2px; width: 3px; height: 6px; border: solid #fff; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }\n@keyframes dsspin { to { transform: rotate(360deg); } }\n@media (prefers-reduced-motion: reduce) { #ds-island { transition: none; } #ds-island .sp { animation: none; } }\n/* A new Inbox item slides in at the top and fades its highlight (owner pick: animated list). */\n.tri-row.nw { animation: dsin .45s ease, dshl 1.6s ease; }\n@keyframes dsin { from { transform: translateY(-8px); opacity: 0; } }\n@keyframes dshl { from { background: #e6effa; } to { background: transparent; } }\n@media (prefers-reduced-motion: reduce) { .tri-row.nw { animation: none; } }\n/* Client record tabs (owner pick from lcc Client 360): one row of tabs with counts under the client header. */\n.ds-rtabs { display: flex; gap: 2px; border-bottom: 1px solid #e3e6eb; margin-top: -4px; overflow-x: auto; }\n.ds-rtabs a { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; font: 600 13px var(--ds-font); color: #667180 !important; text-decoration: none !important; border-bottom: 2px solid transparent; white-space: nowrap; cursor: pointer; }\n.ds-rtabs a b { font-weight: 600; font-size: 11px; padding: 1px 6px; border-radius: 6px; background: #eef0f3; color: #667180; }\n.ds-rtabs a[aria-current=\"page\"] { color: #2563a8 !important; border-bottom-color: #2563a8; }\n.ds-rtabs a[aria-current=\"page\"] b { background: #e6effa; color: #2563a8; }\n\n/* ===== Portal refresh (owner, 26 Oct: claude.ai/artifact/RhNoYnFXSJgV1TU4fFrFws) =====\n   Colour lives in small shapes; each colour means one thing; one navy focus per screen; one typeface. */\n:root { --rf-canvas: #f5f6f8; --rf-line: #e3e6eb; --rf-line-soft: #eef0f3; --rf-ink: #16212f; --rf-ink-2: #3f4a59; --rf-muted: #667180;\n  --rf-accent: #2563a8; --rf-accent-soft: #e6effa; --rf-navy: #15263b; --rf-navy-2: #1b3049; --rf-navy-action: #1f3b5c; --rf-navy-tint: #eef2f8; --rf-brand: #e9792f;\n  --rf-ok: #1e7f55; --rf-ok-soft: #e2f3ea; --rf-warn: #a35f00; --rf-warn-soft: #fcefd8; --rf-bad: #be3434; --rf-bad-soft: #fbe6e6; --rf-idle: #56627a; --rf-idle-soft: #eceff4; }\n/* One typeface: Public Sans everywhere, with tabular figures; no mono, no display faces. */\n.mono, [data-ds-sans], [style*=\"Plex Mono\"], [style*=\"monospace\"], .sg, [style*=\"Space Grotesk\"], [style*=\"Manrope\"], [class*=\"mono\"] { font-family: var(--ds-font) !important; letter-spacing: 0 !important; }\nbody, table, td, th, .mono { font-variant-numeric: tabular-nums; }\n/* Sentence case: no uppercase labels anywhere. */\n.lbl, .cap, .eyebrow, .kicker, [style*=\"text-transform: uppercase\"], [style*=\"text-transform:uppercase\"], .vps .vps-lbl, .vps small { text-transform: none !important; letter-spacing: 0 !important; }\n/* Status as quiet chips: soft tint behind text of the same hue, with a dot (the design layer marks them). */\n.ds-soft { background: color-mix(in srgb, var(--c) 13%, #fff) !important; color: var(--c) !important; border-color: color-mix(in srgb, var(--c) 28%, #fff) !important; box-shadow: none !important; }\n.ds-soft * { color: inherit !important; }\n/* Cards: white, hairline, 10px corners, a calm head with a tinted 28px icon tile. */\nhtml.ds-staff .card, html.ds-staff .pa-c { border-radius: 10px !important; border-color: #e3e6eb !important; }\nhtml.ds-staff .ch { min-height: 52px; }\n/* Greeting: navy band, then a plain white number strip. No colour lines or markers (owner, 26 Oct). */\nhtml.ds-staff .gk, html.ds-staff .hero .kp { background: #fff !important; }\nhtml.ds-staff [data-card=\"greeting\"], html.ds-staff .hero, html.ds-staff .gk { border-color: #e3e6eb !important; }\n/* Floating layers: one small Ask VCFO launcher; the mascot lives inside the chat panel. */\n#vp-launch .vpl-char, .botup { display: none !important; }\n/* Dark mode is slate, not black. */\n:root[data-theme=\"dark\"] body, html.dark body { background: #111821; }\n/* Sentence case everywhere (refresh: \"replace uppercase mono headings with sentence case\"). */\n.st, .lbl, .h, th, .cg th, .tbl th, .mr .h, .page h3, .kcol h3, .cal7 .h, .v7c th, .v7c .st, .grp, .v7c .lbl, .v7c .dtile small, .v7c .dtile .m, .hd, .gh, .v7c .dow, .tlabel, .sth, .rh .k, .rd-g, .now .k, .eb, .sub-h, .pa-h h2, .h b, .asg-h, .vps .vps-lbl, .vps .vps-fh, .upper, .tlv-n > div.ar, .sec td, .scap, .narail h2, .ft-eye, .eye, .dtile small, .ds-head > span, .vh-crumb li { text-transform: none !important; letter-spacing: 0 !important; }\n/* Client summary card (refresh \"one summary card\"): navy name band, then the five numbers in a white strip;\n   one progress number only, so the SPICe+ ring goes (the sidebar keeps 6/14). */\n.vh-greet { background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 120' preserveAspectRatio='none'%3E%3Cpath d='M0 90 L70 60 L140 80 L230 40 L310 70 L400 30 L480 62 L600 36 L600 120 L0 120Z' fill='%23fff' fill-opacity='.05'/%3E%3C/svg%3E\") right bottom / 70% 100% no-repeat, linear-gradient(100deg, #1b3049, #15263b 70%) !important; padding-bottom: 0 !important; border: 1px solid #15263b; }\n.vh-greet .vh-gtop > div:last-child, .vh-greet > div[style*=\"height:1px\"], .vh-greet > span[style*=\"height:3px\"], .vh-greet > span[style*=\"height: 3px\"] { display: none !important; }\n.vh-greet { border-color: #e3e6eb !important; }\n.vh-greet .mono { color: #9fb2c8 !important; opacity: 1 !important; }\n.vh-greet .vh-stats { background: #fff; border-top: 0 !important; margin: 12px calc(-1 * clamp(14px, 2vw, 18px)) 0; padding: 0 clamp(14px, 2vw, 18px); }\n.vh-greet .vh-stat { flex-direction: column-reverse; align-items: flex-start !important; gap: 2px !important; padding: 10px 22px 10px 0 !important; border-right-color: #e3e6eb !important; }\n.vh-greet .vh-stat .metric { color: #16212f !important; font-size: 20px !important; }\n.vh-greet .vh-stat:nth-child(3) .metric { color: #be3434 !important; }\n.vh-greet .vh-stat > span:last-child { color: #667180; opacity: 1 !important; font-size: 12px !important; }\n.vp-pop small, #vp-chat *, .vps * { font-family: var(--ds-font) !important; letter-spacing: 0 !important; }\n/* 45 · Every card in the refresh's shape (owner, 26 Oct). */\n/* Card head: 52px, a hairline under it, 14.5px title in ink; the icon tile comes from the design layer. */\nsection.card > div:first-of-type:has(> h3) { padding: 12px 20px !important; min-height: 52px; box-sizing: border-box; border-bottom: 1px solid #eef0f3; align-items: center !important; }\nsection.card > div:first-of-type > h3 { font: 600 14.5px/1.3 var(--ds-font, 'Public Sans'), sans-serif !important; color: #16212f !important; }\nsection.card > div:first-of-type ~ div { padding-left: 20px !important; padding-right: 20px !important; }\nsection.card > div:first-of-type > .info, section.card > div:first-of-type > span.info { display: none !important; }\nhtml.ds-staff .ch h2, html.ds-staff .ch .st, html.ds-staff .pa-h h2, html.ds-staff section.ap h2 { font-size: 14.5px !important; font-weight: 600 !important; color: #16212f !important; }\n/* Segmented controls: small inline buttons on a quiet track; the picked one is navy; no sliding thumb. */\n.seg { display: inline-flex !important; width: auto !important; max-width: 100%; flex-wrap: wrap; gap: 2px; padding: 2px !important; border-radius: 8px !important; background: #f5f6f8 !important; box-shadow: none !important; border: 1px solid #e3e6eb; grid-template-columns: none !important; }\n.seg > .thumb, .seg > .th { display: none !important; }\n.seg button { flex: none; height: 28px !important; padding: 0 10px !important; border-radius: 6px !important; font: 600 12.5px var(--ds-font, 'Public Sans'), sans-serif !important; color: #667180 !important; background: none !important; gap: 5px !important; }\n.seg button.on, .seg button[aria-selected=\"true\"], .seg button[aria-pressed=\"true\"] { background: #1f3b5c !important; color: #fff !important; }\n.seg .cnt, .seg .c { font: 600 11.5px var(--ds-font, 'Public Sans'), sans-serif !important; color: #98a1ae !important; }\n.seg button.on .cnt, .seg button[aria-selected=\"true\"] .c, .seg button[aria-selected=\"true\"] .cnt { color: #afc3da !important; }\n/* Needs from the client: the tabs sit in the card head, on the right, as in the refresh. */\n[data-sc-name^=\"v7c_needs\"] section.card, [data-sc-name=\"v7c_reg\"] section.card { position: relative; }\n[data-sc-name^=\"v7c_needs\"] section.card > div:nth-of-type(2) > .seg:first-child, [data-sc-name=\"v7c_reg\"] section.card > div:nth-of-type(2) > .seg:first-child { position: absolute; top: 11px; right: 20px; }\n[data-sc-name^=\"v7c_needs\"] section.card > div:nth-of-type(2) > .seg:first-child + div, [data-sc-name=\"v7c_reg\"] section.card > div:nth-of-type(2) > .seg:first-child + div { margin-top: 0 !important; }\n[data-sc-name^=\"v7c_needs\"] section.card > div:nth-of-type(2) > div > div:first-child, [data-sc-name=\"v7c_reg\"] section.card > div:nth-of-type(2) > div > div:first-child { border-top: 0 !important; }\n/* What SBC is doing: soft bars in category colours; no info icons or link buttons in the rows. */\n[data-sc-name^=\"v7c_sbc\"] .info, [data-sc-name^=\"v7c_sbc\"] a[aria-label^=\"Open\"] { display: none !important; }\n[data-sc-name^=\"v7c_sbc\"] section.card > div:nth-of-type(2) > div:first-child { border-top: 0 !important; }\n[data-sc-name^=\"v7c_sbc\"] section.card > div:nth-of-type(2) > div:nth-child(5n+1) .bar > span { background: #2563a8 !important; }\n[data-sc-name^=\"v7c_sbc\"] section.card > div:nth-of-type(2) > div:nth-child(5n+2) .bar > span { background: #6a4fb6 !important; }\n[data-sc-name^=\"v7c_sbc\"] section.card > div:nth-of-type(2) > div:nth-child(5n+3) .bar > span { background: #0f7c86 !important; }\n[data-sc-name^=\"v7c_sbc\"] section.card > div:nth-of-type(2) > div:nth-child(5n+4) .bar > span { background: #46a87a !important; }\n/* Rows inside cards: the first row under a head has no extra rule. */\nsection.card > div:first-of-type + div > div:first-child[style*=\"border-top\"] { border-top: 0 !important; }\n/* Greeting numbers with an icon: the label sits above the number. */\n.vh-greet .vh-stat[data-ds-kic] { padding: 12px 24px 12px 0 !important; margin-right: 22px !important; }\nhtml.ds-staff .gk > a[data-ds-kic], html.ds-staff .hero .kp > span[data-ds-kic] { padding: 12px 24px 12px 0 !important; }\n/* Card heads never wrap: the title gives way before the tabs do. */\nsection.card > div:first-of-type:has(> h3) { flex-wrap: nowrap !important; }\nsection.card > div:first-of-type > h3 { min-width: 0; white-space: nowrap; }\nsection.card > div:first-of-type .seg button { padding: 0 8px !important; }\n/* Steps: phase rows are flat rows with a 6px bar and the count chip (refresh \"phase accordion\"). */\ndetails.stp-g { border: 0 !important; border-top: 1px solid #eef0f3 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; margin: 0 -20px !important; padding: 0 20px !important; }\ndetails.stp-g:first-child { border-top: 0 !important; }\ndetails.stp-g[open] { background: #fafbfd !important; }\ndetails.stp-g > summary { display: flex !important; align-items: center; gap: 12px !important; min-height: 46px; padding: 0 !important; background: none !important; border: 0 !important; }\ndetails.stp-g > summary > .rt { order: 1; }\ndetails.stp-g > summary::after { content: \"\"; order: 2; flex: none; width: 140px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--ds-pc, #2563a8) var(--ds-p, 0%), #eef0f3 var(--ds-p, 0%)); }\ndetails.stp-g > summary > .chip { order: 3; width: 108px !important; }\nsection.card > div:has(> details.stp-g) { gap: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; }\n/* Table heads: navy tint with a hairline under them, never a dark rule (owner, 26 Oct). */\nthead th, .ds-head, .cg th, .tbl th, .v7c th { border-bottom: 1px solid #e3e6eb !important; }\n/* Wide staff tables scroll inside their card instead of spilling past it. */\nhtml.ds-staff section.card > table, html.ds-staff section.card > div > table { max-width: 100%; }\n/* No accent line on top of cards (owner, 26 Oct). */\n.card.acc::before, .card.acc::after { display: none !important; }\n/* Incorporation: the four charts sit in one strip with hairline dividers (refresh \"stats strip\"). */\n.dg { gap: 0 !important; border: 1px solid #e3e6eb; border-radius: 10px; overflow: hidden; background: #fff; }\n.dg > .card { border: 0 !important; border-left: 1px solid #eef0f3 !important; border-radius: 0 !important; box-shadow: none !important; }\n.dg > .card:first-child { border-left: 0 !important; }\n/* Incorporation timeline rows: a small chevron opens the steps; the name opens the phase; no Open button. */\n.phh .stb { width: 24px !important; height: 24px !important; min-width: 0 !important; padding: 0 !important; font-size: 0 !important; gap: 0 !important; justify-content: center !important; border-radius: 6px !important; }\n.phh .stb svg { width: 14px; height: 14px; }\n.phh .ob { display: none !important; }\n.phh .pnm { cursor: pointer; }\n.phh .pnm:hover .tx { color: #2563a8; }\n/* Compliance calendar: hairline grid, navy-tint weekday row, today in soft blue with a blue inset (refresh calendar). */\n.cal .day { border-color: #e3e6eb !important; }\n.cal .day.today, .cal .day[aria-current=\"date\"] { box-shadow: inset 0 0 0 2px #2563a8 !important; background: #e6effa !important; }\n.cal .dow { background: #eef2f8 !important; color: #1f3b5c !important; border-color: #e3e6eb !important; }\n.cal-scroll, .cal { border-color: #e3e6eb !important; }\n/* Important alerts and What is next, as in the refresh \"attention list\": full-width rows with hairlines,\n   a 44px date tile tinted by urgency, the title, the chip on the right; the urgent row has a soft red wash\n   from the left with a red edge and a small navy action. */\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) { padding: 0 20px !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > * { margin: 0 -20px !important; padding: 13px 20px !important; border: 0 !important; border-top: 1px solid #eef0f3 !important; border-radius: 0 !important; gap: 12px !important; flex-wrap: nowrap !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > :first-child { border-top: 0 !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > .tipw:first-child { background: linear-gradient(90deg, #fbe6e6, rgba(251, 230, 230, 0) 65%) !important; box-shadow: inset 3px 0 0 #be3434 !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) .info { display: none !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) .rt { font: 600 13.5px/1.35 var(--ds-font, 'Public Sans'), sans-serif !important; color: #16212f !important; }\n/* Date tiles */\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"]) { width: 44px !important; height: auto !important; padding: 5px 0 4px !important; border: 1px solid color-mix(in srgb, var(--c) 30%, #fff) !important; border-radius: 6px !important; background: color-mix(in srgb, var(--c) 10%, #fff) !important; gap: 1px !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"]) .metric { font: 650 16px/1.1 var(--ds-font, 'Public Sans'), sans-serif !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"]) > span:last-child { font: 600 10.5px/1.1 var(--ds-font, 'Public Sans'), sans-serif !important; opacity: .85; }\n/* The urgent row's tile: the date (What is next) or the alert mark (Important alerts) in red. */\n[data-sc-name=\"v7c_next\"] section.card > div:nth-of-type(2) > .tipw:first-child > div:nth-of-type(1) { flex: none; width: 44px; box-sizing: border-box; text-align: center !important; padding: 5px 0 4px; border: 1px solid #f2c6c6; border-radius: 6px; background: #fbe6e6; }\n[data-sc-name=\"v7c_next\"] section.card > div:nth-of-type(2) > .tipw:first-child > div:nth-of-type(1) .metric { font: 650 16px/1.1 var(--ds-font, 'Public Sans'), sans-serif !important; color: #be3434 !important; }\n[data-sc-name=\"v7c_next\"] section.card > div:nth-of-type(2) > .tipw:first-child > div:nth-of-type(1) .lbl { font: 600 10.5px/1.1 var(--ds-font, 'Public Sans'), sans-serif !important; color: #be3434 !important; opacity: .85; }\n[data-sc-name^=\"v7c_alerts\"] section.card > div:nth-of-type(2) > .tipw:first-child > svg { flex: none; width: 44px !important; height: 40px !important; padding: 11px 13px; box-sizing: border-box; border: 1px solid #f2c6c6; border-radius: 6px; background: #fbe6e6; color: #be3434; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > .tipw:first-child > div { min-width: 0 !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) .tipw:first-child .btn-p { flex: none; height: 28px !important; padding: 0 12px !important; border-radius: 6px !important; background: #1f3b5c !important; border-color: #1f3b5c !important; color: #fff !important; font: 600 12.5px var(--ds-font, 'Public Sans'), sans-serif !important; box-shadow: none !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) .chip { flex: none; }\n/* Tabs in a card head never wrap; when the head is too narrow the counts give way (design layer adds .ds-tight). */\nsection.card > div:first-of-type .seg { flex-wrap: nowrap !important; flex: none; }\n.seg.ds-tight .cnt, .seg.ds-tight .c { display: none !important; }\nsection.card > div:first-of-type > h3 { overflow: hidden; text-overflow: ellipsis; }\n/* Date tile colour by urgency, read from the tile's own colour variable. */\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"]) { --c: #2563a8; color: var(--c) !important; box-shadow: none !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"])[style*=\"var(--due\"] { --c: #a35f00; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"])[style*=\"var(--over\"] { --c: #be3434; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"])[style*=\"var(--up\"], :is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"])[style*=\"var(--muted\"] { --c: #56627a; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"]) * { color: var(--c) !important; }\n/* Recent activity: the same full-width rows with hairlines. */\n[data-sc-name^=\"v7c_activity\"] section.card > div:nth-of-type(2) { padding: 0 20px !important; }\n[data-sc-name^=\"v7c_activity\"] section.card > div:nth-of-type(2) > div { margin: 0 -20px !important; padding: 11px 20px !important; border-top: 1px solid #eef0f3 !important; }\n[data-sc-name^=\"v7c_activity\"] section.card > div:nth-of-type(2) > div:first-child { border-top: 0 !important; }\n:is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) .tipw:first-child .btn-p { width: auto !important; min-width: 0 !important; }\n/* ---- Fixes for the ✗ and ◐ items in REFRESH-DIFF.md (owner, 26 Oct: \"fix everything\") ---- */\n/* 9, 47 · Main buttons are navy. */\n[data-ds-blue] { background: #1f3b5c !important; border-color: #1f3b5c !important; color: #fff !important; box-shadow: none !important; }\n[data-ds-blue]:hover { background: #18304c !important; }\n/* Owner chips: 96px, soft, with a dot. */\n[data-ds-own] { width: 96px !important; min-width: 0 !important; justify-content: center !important; display: inline-flex !important; align-items: center; gap: 6px; height: 22px; border-radius: 5px !important; font: 600 12px var(--ds-font, 'Public Sans'), sans-serif !important; box-sizing: border-box; flex: none; border: 0 !important; box-shadow: none !important; }\n[data-ds-own]::before { content: \"\"; width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }\n[data-ds-own=\"client\"] { background: #fcefd8 !important; color: #a35f00 !important; }\n[data-ds-own=\"firm\"] { background: #e6effa !important; color: #2563a8 !important; }\n[data-ds-own=\"mca\"] { background: #efeafb !important; color: #6a4fb6 !important; }\n.chip.stw[data-ds-own]::before { margin: 0; }\n/* 25 · Company IDs: \"Private\" is a quiet chip; the show button is soft navy. */\n[data-sc-name=\"v7c_ids\"] .chip[style*=\"var(--navy)\"] { background: #eceff4 !important; color: #56627a !important; }\n[data-sc-name=\"v7c_ids\"] button[aria-label^=\"Show\"], [data-sc-name=\"v7c_ids\"] button[aria-label^=\"Hide\"] { background: #eef2f8 !important; color: #1f3b5c !important; }\n/* 26, 28 and every client card: rows run the full width with a hairline between them. */\nsection.card > div:first-of-type ~ div > [style*=\"border-top\"][style*=\"var(--hair)\"] { margin-left: -20px !important; margin-right: -20px !important; padding-left: 20px !important; padding-right: 20px !important; border-top-color: #eef0f3 !important; }\nsection.card > div:first-of-type ~ div > [style*=\"var(--hair)\"]:first-child, section.card > div:first-of-type ~ div > .lbl + [style*=\"var(--hair)\"] { border-top-color: transparent !important; }\n.rd-r { margin: 0 -20px !important; padding: 10px 20px !important; border-radius: 0 !important; border-top: 1px solid #eef0f3; }\n.rd-g + .rd-r { border-top: 0; }\n.rd-g { margin: 10px 0 2px !important; font: 600 11.5px var(--ds-font, 'Public Sans'), sans-serif !important; color: #98a1ae !important; }\n.rd-ft { background: #fbe6e6 !important; color: #be3434 !important; border-radius: 5px !important; }\n/* 28 · Post-incorporation setup: 6px bars on a quiet track. */\n[data-sc-name=\"v7c_postinc\"] .tipw { height: 6px !important; border-radius: 3px !important; box-shadow: none !important; background: #eef0f3 !important; }\n[data-sc-name=\"v7c_postinc\"] .tipw > span:not(.tt) { border-radius: 3px !important; }\n[data-sc-name=\"v7c_postinc\"] .lbl { color: #667180 !important; font: 600 11.5px var(--ds-font, 'Public Sans'), sans-serif !important; }\n/* 40 · Action queue: empty cells are blank, counts are soft chips. */\n.ds-row button[style*=\"cursor: default\"] { background: transparent !important; }\n.ds-row button[style*=\"cursor: default\"]::after { content: \"–\"; color: #d5dbe3; font-weight: 500; }\n.ds-row button.ds-soft { font-weight: 650 !important; height: 26px !important; max-width: 64px; margin: 0 auto; }\n/* 45 · Phase progress: a 6px bar per phase with the count under it. */\n.ds-pcell { background: none !important; border: 0 !important; height: auto !important; display: flex !important; flex-direction: column; align-items: flex-start !important; gap: 4px; color: #3f4a59 !important; font: 600 12px var(--ds-font, 'Public Sans'), sans-serif !important; }\n.ds-pcell::before { content: \"\"; align-self: stretch; height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--pc) var(--p), #eef0f3 var(--p)); }\n.ds-pcell[data-done] { color: #1e7f55 !important; }\n/* 46 · Clients × filings: not applicable is blank; upcoming is a light cell. */\n.fc[style*=\"repeating-linear-gradient\"] { background: transparent !important; box-shadow: none !important; }\n.fc[style*=\"repeating-linear-gradient\"]::after { content: \"–\"; color: #d5dbe3; }\n.fc[style*=\"236, 239, 244\"] { background: #f5f6f8 !important; }\n/* 49 · Wide tables fit their card. */\nhtml.ds-staff .tbl { width: 100% !important; min-width: 0 !important; margin-left: 0 !important; margin-right: 0 !important; }\nhtml.ds-staff .tbl td, html.ds-staff .tbl th { padding-left: 10px !important; padding-right: 10px !important; }\nhtml.ds-staff .tbl .chip.sol { width: auto !important; min-width: 0 !important; max-width: 128px; }\n/* 17 · Client home timeline in the refresh Gantt shape: 46px rows with hairlines, a status circle before each\n   phase, 16px rounded bars (green done, blue current, grey planned) and an orange COI diamond. */\n.vh-tl div[style*=\"grid-template-columns: 150px\"] { grid-template-columns: 210px minmax(0, 1fr) !important; }\n.vh-tl div[style*=\"inset: 0px 0px 0px 150px\"] { left: 210px !important; }\n.vh-tl div[style*=\"grid-template-columns: 150px\"][style*=\"height: 30px\"] { height: 46px !important; border-top: 1px solid #eef0f3; }\n.vh-tl div[style*=\"grid-template-columns: 150px\"][style*=\"height: 30px\"] > div { height: 46px !important; }\n.vh-tl .rt { display: flex !important; align-items: center; gap: 10px; font: 600 13.5px var(--ds-font, 'Public Sans'), sans-serif !important; color: #16212f !important; }\n.vh-tl .rt::before { content: \"\"; flex: none; width: 20px; height: 20px; border-radius: 50%; box-sizing: border-box; box-shadow: inset 0 0 0 1.5px #d5dbe3; background: #fff center / 12px no-repeat; }\n.vh-tl div:has(> div > .tipw[style*=\"var(--ok)\"]) > .rt::before { box-shadow: none; background-color: #e2f3ea; background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e7f55' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 5 5L20 7'/%3E%3C/svg%3E\"); }\n.vh-tl div:has(> div > .tipw[style*=\"var(--prog)\"]) > .rt::before { box-shadow: inset 0 0 0 2px #2563a8; background: #e6effa radial-gradient(circle, #2563a8 0 3px, transparent 3.5px); }\n.vh-tl .tipw[style*=\"top: 5px\"] { top: 50% !important; bottom: auto !important; height: 16px !important; margin-top: -8px; border-radius: 6px !important; }\n.vh-tl .tipw[style*=\"var(--ok)\"] { background: #46a87a !important; }\n.vh-tl .tipw[style*=\"var(--prog)\"] { background: #2563a8 !important; }\n.vh-tl .tipw[style*=\"var(--up)\"] { background: #eceff4 !important; }\n.vh-tl .tipw[aria-label=\"COI\"] { width: 12px !important; height: 12px !important; margin: -6px 0 0 -6px; border-radius: 2px !important; transform: rotate(45deg); background: #e9792f !important; }\n.vh-tl .cap { font: 600 12.5px var(--ds-font, 'Public Sans'), sans-serif !important; color: #667180 !important; }\n.vh-tl .mono.cap { font-size: 11.5px !important; color: #98a1ae !important; }\nhtml.ds-staff section.card > .sc { padding-left: 0 !important; padding-right: 0 !important; }\nhtml.ds-staff section.card > .sc .tbl td:first-child, html.ds-staff section.card > .sc .tbl th:first-child { padding-left: 20px !important; }\nhtml.ds-staff section.card > .sc .tbl td:last-child, html.ds-staff section.card > .sc .tbl th:last-child { padding-right: 20px !important; }\n/* Card heads with an icon tile keep the title on one line. */\n[data-ds-ic] { white-space: nowrap; }\n/* Wide staff tables: cells wrap so every column fits in the card. */\nhtml.ds-staff .tbl td { white-space: normal !important; }\nhtml.ds-staff .tbl .pb, html.ds-staff .tbl .prog { min-width: 0 !important; }\n/* Team cards: contact buttons are soft, not solid. */\n.btn.wa, a[aria-label^=\"WhatsApp\"][style*=\"var(--ok)\"] { background: #e2f3ea !important; color: #1e7f55 !important; border-color: #c9e7d6 !important; }\n.btn.wa:hover { background: #d3ecdf !important; }\n/* 12 · Dark mode: slate surfaces, and every colour the refresh layer fixes in light mode has a dark twin. */\nhtml[data-theme=\"dark\"] { --ds-dk-ink: #eceff4; --ds-dk-mut: #9aa7b8; --ds-dk-line: #263140; --ds-dk-panel: #18202b; --ds-dk-raised: #1f2935; }\nhtml[data-theme=\"dark\"] :is(section.card > div:first-of-type > h3, .vh-tl .rt, .rt, .stp-ph, details.stp-g > summary, .vh-greet .vh-stat .metric, .cs-v, .cs-l div) { color: var(--ds-dk-ink) !important; }\nhtml[data-theme=\"dark\"] :is(.vh-greet .vh-stat > span:last-child, .vh-tl .cap, .rd-g, [data-sc-name=\"v7c_postinc\"] .lbl) { color: var(--ds-dk-mut) !important; }\nhtml[data-theme=\"dark\"] section.card > div:first-of-type:has(> h3), html[data-theme=\"dark\"] .rd-r, html[data-theme=\"dark\"] details.stp-g, html[data-theme=\"dark\"] .vh-tl div[style*=\"height: 30px\"], html[data-theme=\"dark\"] .phr, html[data-theme=\"dark\"] thead th, html[data-theme=\"dark\"] .ds-head { border-color: var(--ds-dk-line) !important; }\nhtml[data-theme=\"dark\"] section.card > div:first-of-type ~ div > [style*=\"var(--hair)\"], html[data-theme=\"dark\"] :is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"], [data-sc-name^=\"v7c_activity\"]) section.card > div:nth-of-type(2) > * { border-top-color: var(--ds-dk-line) !important; }\nhtml[data-theme=\"dark\"] .vh-greet { border-color: var(--ds-dk-line) !important; }\nhtml[data-theme=\"dark\"] .vh-greet .vh-stats { background: var(--ds-dk-panel) !important; }\nhtml[data-theme=\"dark\"] .vh-greet .vh-stat { border-right-color: var(--ds-dk-line) !important; }\nhtml[data-theme=\"dark\"] details.stp-g[open] { background: var(--ds-dk-raised) !important; }\nhtml[data-theme=\"dark\"] details.stp-g > summary::after, html[data-theme=\"dark\"] [data-sc-name=\"v7c_postinc\"] .tipw { background-color: #2a3442 !important; }\nhtml[data-theme=\"dark\"] details.stp-g > summary::after { background: linear-gradient(90deg, var(--ds-pc, #6fa3e0) var(--ds-p, 0%), #2a3442 var(--ds-p, 0%)) !important; }\n/* Tabs */\nhtml[data-theme=\"dark\"] .seg { background: var(--ds-dk-raised) !important; border-color: #2a3442 !important; }\nhtml[data-theme=\"dark\"] .seg button { color: var(--ds-dk-mut) !important; }\nhtml[data-theme=\"dark\"] .seg button.on, html[data-theme=\"dark\"] .seg button[aria-selected=\"true\"] { background: #2b4766 !important; color: #fff !important; }\n/* Chips, tiles and soft blocks mix with the dark panel, and their text is lifted so it reads. */\nhtml[data-theme=\"dark\"] .ds-soft, html[data-theme=\"dark\"] .stw { background: color-mix(in srgb, var(--c) 22%, #18202b) !important; color: color-mix(in srgb, var(--c) 55%, #fff) !important; border-color: color-mix(in srgb, var(--c) 40%, #18202b) !important; }\nhtml[data-theme=\"dark\"] [data-ds-own=\"client\"] { background: rgba(227, 160, 64, .16) !important; color: #f2c27a !important; }\nhtml[data-theme=\"dark\"] [data-ds-own=\"firm\"] { background: rgba(111, 163, 224, .16) !important; color: #9cc3ef !important; }\nhtml[data-theme=\"dark\"] [data-ds-own=\"mca\"] { background: rgba(160, 130, 230, .16) !important; color: #c4b2f2 !important; }\nhtml[data-theme=\"dark\"] :is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"]) { background: color-mix(in srgb, var(--c) 18%, #18202b) !important; border-color: color-mix(in srgb, var(--c) 40%, #18202b) !important; }\nhtml[data-theme=\"dark\"] :is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > div > :is(.tipw, div[style*=\"width: 44px\"]) * { color: color-mix(in srgb, var(--c) 55%, #fff) !important; }\nhtml[data-theme=\"dark\"] :is([data-sc-name^=\"v7c_alerts\"], [data-sc-name=\"v7c_next\"]) section.card > div:nth-of-type(2) > .tipw:first-child { background: linear-gradient(90deg, rgba(190, 52, 52, .22), rgba(190, 52, 52, 0) 65%) !important; }\nhtml[data-theme=\"dark\"] [data-sc-name=\"v7c_next\"] section.card > div:nth-of-type(2) > .tipw:first-child > div:nth-of-type(1), html[data-theme=\"dark\"] [data-sc-name^=\"v7c_alerts\"] section.card > div:nth-of-type(2) > .tipw:first-child > svg { background: rgba(190, 52, 52, .2) !important; border-color: rgba(221, 98, 98, .45) !important; }\nhtml[data-theme=\"dark\"] [data-sc-name=\"v7c_next\"] section.card > div:nth-of-type(2) > .tipw:first-child > div:nth-of-type(1) * { color: #f29b9b !important; }\nhtml[data-theme=\"dark\"] [data-sc-name=\"v7c_ids\"] .chip[style*=\"var(--navy)\"] { background: #2a3442 !important; color: var(--ds-dk-mut) !important; }\nhtml[data-theme=\"dark\"] [data-sc-name=\"v7c_ids\"] button[aria-label^=\"Show\"], html[data-theme=\"dark\"] [data-sc-name=\"v7c_ids\"] button[aria-label^=\"Hide\"] { background: #2a3442 !important; color: var(--ds-dk-ink) !important; }\nhtml[data-theme=\"dark\"] .rd-ft { background: rgba(190, 52, 52, .2) !important; color: #f29b9b !important; }\n/* Timelines */\nhtml[data-theme=\"dark\"] .vh-tl .rt::before { background-color: var(--ds-dk-panel); box-shadow: inset 0 0 0 1.5px #3a4656; }\nhtml[data-theme=\"dark\"] .vh-tl .tipw[style*=\"var(--up)\"], html[data-theme=\"dark\"] .gbar.s-up { background: #2a3442 !important; }\nhtml[data-theme=\"dark\"] .gbar.s-active { background: rgba(37, 99, 168, .2) !important; box-shadow: inset 0 0 0 1px rgba(111, 163, 224, .45) !important; }\nhtml[data-theme=\"dark\"] .si.up { background: transparent !important; box-shadow: inset 0 0 0 1.5px #3a4656 !important; }\nhtml[data-theme=\"dark\"] .si.done { background: rgba(70, 168, 122, .2) !important; color: #8fdcb4 !important; }\nhtml[data-theme=\"dark\"] .dg { background: var(--ds-dk-panel) !important; border-color: var(--ds-dk-line) !important; }\nhtml[data-theme=\"dark\"] .dg > .card { border-left-color: var(--ds-dk-line) !important; }\n/* Calendar */\nhtml[data-theme=\"dark\"] .cal .day { border-color: var(--ds-dk-line) !important; }\nhtml[data-theme=\"dark\"] .cal .day.today, html[data-theme=\"dark\"] .cal .day[aria-current=\"date\"] { background: rgba(37, 99, 168, .2) !important; box-shadow: inset 0 0 0 2px #6fa3e0 !important; }\nhtml[data-theme=\"dark\"] .cal .dow { background: var(--ds-dk-raised) !important; color: var(--ds-dk-mut) !important; border-color: var(--ds-dk-line) !important; }\nhtml[data-theme=\"dark\"] .cal-scroll, html[data-theme=\"dark\"] .cal { border-color: var(--ds-dk-line) !important; }\n/* Icon tiles sit a little quieter on slate. */\nhtml[data-theme=\"dark\"] [data-ds-ic]::before, html[data-theme=\"dark\"] [data-ds-kic]::before { filter: saturate(.85) brightness(.92); }\nhtml[data-theme=\"dark\"] section.ctd { background: var(--ds-dk-panel) !important; border-color: var(--ds-dk-line) !important; color: var(--ds-dk-ink) !important; }\nhtml[data-theme=\"dark\"] section.ctd * { color: inherit; }\n/* 14 · Phone screens: card heads in sentence case; the client greeting is a navy band with a white number strip. */\n.ch h2 { text-transform: none !important; letter-spacing: 0 !important; font-weight: 600 !important; font-size: 14.5px !important; color: #16212f; }\nsection.greet { display: flex; flex-direction: column; padding-bottom: 0 !important; }\nsection.greet::before { display: none !important; }\nsection.greet .ring { display: none !important; }\nsection.greet .top { order: 0; }\nsection.greet .rep { order: 1; margin: 12px 0 14px !important; }\nsection.greet .stats { order: 2; background: #fff; margin: 0 -14px !important; gap: 0 !important; }\nsection.greet .stats + .stats { margin-top: 0 !important; }\nsection.greet .stat { background: transparent !important; border: 0 !important; border-radius: 0 !important; border-top: 1px solid #eef0f3 !important; border-right: 1px solid #eef0f3 !important; padding: 10px 14px !important; text-align: left; display: flex !important; flex-direction: column-reverse; align-items: flex-start; gap: 2px; box-shadow: none !important; }\nsection.greet .stats .stat:last-child { border-right: 0 !important; }\nsection.greet .stat b { color: #16212f !important; font-size: 18px !important; }\nsection.greet .stat span { color: #667180 !important; }\nsection.greet .btn-g { background: #fff !important; color: #15263b !important; border-color: #fff !important; }\nhtml[data-theme=\"dark\"] section.greet .stats { background: var(--ds-dk-panel); }\nhtml[data-theme=\"dark\"] section.greet .stat { border-color: var(--ds-dk-line) !important; }\nhtml[data-theme=\"dark\"] section.greet .stat b, html[data-theme=\"dark\"] .ch h2 { color: var(--ds-dk-ink) !important; }\n.card.t::before { display: none !important; }\n.vh-tl [data-ds-done] > .rt::before { box-shadow: none; background-color: #e2f3ea; background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e7f55' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 5 5L20 7'/%3E%3C/svg%3E\"); }\n\n/* 45 · card heads and greeting numbers: tinted icon tiles (generated in patch.mjs) */\n[data-ds-ic]{line-height:28px}\n[data-ds-ic]::before{content:\"\";display:inline-block;vertical-align:middle;margin:-3px 10px 0 0;width:28px;height:28px;border-radius:8px;background:var(--hic-bg) var(--hic-img) center/15px no-repeat}\n[data-ds-ic=\"-\"]::before{display:none}\n[data-ds-kic]{display:grid!important;grid-template-columns:30px auto;grid-template-rows:auto auto;column-gap:10px!important;row-gap:1px!important;align-items:center;justify-content:start}\n[data-ds-kic]::before{content:\"\";grid-row:1 / span 2;grid-column:1;width:30px;height:30px;border-radius:8px;background:var(--kic-bg) var(--kic-img) center/16px no-repeat}\n[data-ds-kic] > :first-child{grid-row:2;grid-column:2}\n[data-ds-kic] > :last-child{grid-row:1;grid-column:2}\n[data-ds-ic=\"calendar\"]{--hic-bg:#e0f3f4;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f7c86%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2216%22%20rx%3D%222%22%2F%3E%3Cpath%20d%3D%22M3%2010h18M8%203v4M16%203v4%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"calendar\"]{background:#e0f3f4!important;color:#0f7c86!important;border-color:transparent!important}\n[data-ds-ic=\"bell\"]{--hic-bg:#fcefd8;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a35f00%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%208a6%206%200%201%201%2012%200c0%207%203%208%203%208H3s3-1%203-8%22%2F%3E%3Cpath%20d%3D%22M10%2020a2%202%200%200%200%204%200%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"bell\"]{background:#fcefd8!important;color:#a35f00!important;border-color:transparent!important}\n[data-ds-ic=\"list\"]{--hic-bg:#e6effa;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M9%206h11M9%2012h11M9%2018h11M4%206h.01M4%2012h.01M4%2018h.01%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"list\"]{background:#e6effa!important;color:#2563a8!important;border-color:transparent!important}\n[data-ds-ic=\"file\"]{--hic-bg:#fcefd8;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a35f00%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M14%203H6v18h12V7z%22%2F%3E%3Cpath%20d%3D%22M14%203v4h4%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"file\"]{background:#fcefd8!important;color:#a35f00!important;border-color:transparent!important}\n[data-ds-ic=\"clip\"]{--hic-bg:#e0f3f4;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f7c86%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%228%22%20y%3D%223%22%20width%3D%228%22%20height%3D%224%22%20rx%3D%221%22%2F%3E%3Cpath%20d%3D%22M16%205h2a2%202%200%200%201%202%202v12a2%202%200%200%201-2%202H6a2%202%200%200%201-2-2V7a2%202%200%200%201%202-2h2%22%2F%3E%3Cpath%20d%3D%22m9%2013%202%202%204-4%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"clip\"]{background:#e0f3f4!important;color:#0f7c86!important;border-color:transparent!important}\n[data-ds-ic=\"shield\"]{--hic-bg:#e2f3ea;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231e7f55%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%203l8%203v6c0%205-3.5%208-8%209-4.5-1-8-4-8-9V6z%22%2F%3E%3Cpath%20d%3D%22m9%2012%202%202%204-4%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"shield\"]{background:#e2f3ea!important;color:#1e7f55!important;border-color:transparent!important}\n[data-ds-ic=\"id\"]{--hic-bg:#efeafb;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236a4fb6%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2214%22%20rx%3D%222%22%2F%3E%3Ccircle%20cx%3D%229%22%20cy%3D%2212%22%20r%3D%222.5%22%2F%3E%3Cpath%20d%3D%22M14%2010h4M14%2014h4%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"id\"]{background:#efeafb!important;color:#6a4fb6!important;border-color:transparent!important}\n[data-ds-ic=\"clock\"]{--hic-bg:#efeafb;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236a4fb6%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%229%22%2F%3E%3Cpath%20d%3D%22M12%207v5l3%202%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"clock\"]{background:#efeafb!important;color:#6a4fb6!important;border-color:transparent!important}\n[data-ds-ic=\"inbox\"]{--hic-bg:#e6effa;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M22%2012h-6l-2%203h-4l-2-3H2%22%2F%3E%3Cpath%20d%3D%22M5.5%205%202%2012v6a2%202%200%200%200%202%202h16a2%202%200%200%200%202-2v-6l-3.5-7A2%202%200%200%200%2016.7%204H7.3a2%202%200%200%200-1.8%201z%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"inbox\"]{background:#e6effa!important;color:#2563a8!important;border-color:transparent!important}\n[data-ds-ic=\"user\"]{--hic-bg:#efeafb;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236a4fb6%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%228%22%20r%3D%224%22%2F%3E%3Cpath%20d%3D%22M4%2021a8%208%200%200%201%2016%200%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"user\"]{background:#efeafb!important;color:#6a4fb6!important;border-color:transparent!important}\n[data-ds-ic=\"chart\"]{--hic-bg:#e6effa;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M4%2020V10M10%2020V4M16%2020v-7M22%2020H2%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"chart\"]{background:#e6effa!important;color:#2563a8!important;border-color:transparent!important}\n[data-ds-ic=\"check\"]{--hic-bg:#e2f3ea;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231e7f55%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%229%22%2F%3E%3Cpath%20d%3D%22m8%2012%203%203%205-6%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"check\"]{background:#e2f3ea!important;color:#1e7f55!important;border-color:transparent!important}\n[data-ds-ic=\"alert\"]{--hic-bg:#fbe6e6;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23be3434%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%209v4M12%2017h.01M10.3%203.9%201.8%2018a2%202%200%200%200%201.7%203h17a2%202%200%200%200%201.7-3L13.7%203.9a2%202%200%200%200-3.4%200Z%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"alert\"]{background:#fbe6e6!important;color:#be3434!important;border-color:transparent!important}\n[data-ds-ic=\"grid\"]{--hic-bg:#e6effa;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%223%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2214%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"grid\"]{background:#e6effa!important;color:#2563a8!important;border-color:transparent!important}\n[data-ds-ic=\"mail\"]{--hic-bg:#e6effa;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2214%22%20rx%3D%222%22%2F%3E%3Cpath%20d%3D%22m3%207%209%206%209-6%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"mail\"]{background:#e6effa!important;color:#2563a8!important;border-color:transparent!important}\n[data-ds-ic=\"book\"]{--hic-bg:#e0f3f4;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f7c86%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M4%204h6a3%203%200%200%201%203%203v13a2%202%200%200%200-2-2H4z%22%2F%3E%3Cpath%20d%3D%22M20%204h-4a3%203%200%200%200-3%203%22%2F%3E%3Cpath%20d%3D%22M20%204v14h-5%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"book\"]{background:#e0f3f4!important;color:#0f7c86!important;border-color:transparent!important}\n[data-ds-ic=\"key\"]{--hic-bg:#efeafb;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236a4fb6%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%228%22%20cy%3D%2215%22%20r%3D%224%22%2F%3E%3Cpath%20d%3D%22m11%2012%209-9M17%206l3%203%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"key\"]{background:#efeafb!important;color:#6a4fb6!important;border-color:transparent!important}\n[data-ds-ic=\"pulse\"]{--hic-bg:#e2f3ea;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231e7f55%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M3%2012h4l3-8%204%2016%203-8h4%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"pulse\"]{background:#e2f3ea!important;color:#1e7f55!important;border-color:transparent!important}\n[data-ds-ic=\"flag\"]{--hic-bg:#e2f3ea;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231e7f55%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M5%2021V4h11l-2%204%202%204H5%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"flag\"]{background:#e2f3ea!important;color:#1e7f55!important;border-color:transparent!important}\n[data-ds-ic=\"building\"]{--hic-bg:#e6effa;--hic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%2216%22%20height%3D%2218%22%20rx%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M9%207h1M14%207h1M9%2011h1M14%2011h1M9%2015h1M14%2015h1%22%2F%3E%3C%2Fsvg%3E\")}\n.tile[data-ds-tone=\"building\"]{background:#e6effa!important;color:#2563a8!important;border-color:transparent!important}\n[data-ds-kic=\"waiting\"]{--kic-bg:#fcefd8;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a35f00%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%228%22%20r%3D%224%22%2F%3E%3Cpath%20d%3D%22M4%2021a8%208%200%200%201%2016%200%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"overdue\"]{--kic-bg:#fbe6e6;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23be3434%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%209v4M12%2017h.01M10.3%203.9%201.8%2018a2%202%200%200%200%201.7%203h17a2%202%200%200%200%201.7-3L13.7%203.9a2%202%200%200%200-3.4%200Z%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"soon\"]{--kic-bg:#fcefd8;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a35f00%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2216%22%20rx%3D%222%22%2F%3E%3Cpath%20d%3D%22M3%2010h18M8%203v4M16%203v4%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"reg\"]{--kic-bg:#efeafb;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236a4fb6%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2214%22%20rx%3D%222%22%2F%3E%3Ccircle%20cx%3D%229%22%20cy%3D%2212%22%20r%3D%222.5%22%2F%3E%3Cpath%20d%3D%22M14%2010h4M14%2014h4%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"coi\"]{--kic-bg:#e2f3ea;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231e7f55%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M5%2021V4h11l-2%204%202%204H5%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"action\"]{--kic-bg:#e6effa;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M9%206h11M9%2012h11M9%2018h11M4%206h.01M4%2012h.01M4%2018h.01%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"done\"]{--kic-bg:#e2f3ea;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231e7f55%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%229%22%2F%3E%3Cpath%20d%3D%22m8%2012%203%203%205-6%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"sbc\"]{--kic-bg:#e6effa;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%2216%22%20height%3D%2218%22%20rx%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M9%207h1M14%207h1M9%2011h1M14%2011h1M9%2015h1M14%2015h1%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"clients\"]{--kic-bg:#e6effa;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%228%22%20r%3D%224%22%2F%3E%3Cpath%20d%3D%22M4%2021a8%208%200%200%201%2016%200%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"inc\"]{--kic-bg:#e6effa;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%2216%22%20height%3D%2218%22%20rx%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M9%207h1M14%207h1M9%2011h1M14%2011h1M9%2015h1M14%2015h1%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"comp\"]{--kic-bg:#e2f3ea;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231e7f55%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%203l8%203v6c0%205-3.5%208-8%209-4.5-1-8-4-8-9V6z%22%2F%3E%3Cpath%20d%3D%22m9%2012%202%202%204-4%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"people\"]{--kic-bg:#efeafb;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236a4fb6%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%228%22%20r%3D%224%22%2F%3E%3Cpath%20d%3D%22M4%2021a8%208%200%200%201%2016%200%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"svc\"]{--kic-bg:#e2f3ea;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231e7f55%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M3%2012h4l3-8%204%2016%203-8h4%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"conn\"]{--kic-bg:#fcefd8;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a35f00%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%223%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2214%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"msg\"]{--kic-bg:#fbe6e6;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23be3434%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2214%22%20rx%3D%222%22%2F%3E%3Cpath%20d%3D%22m3%207%209%206%209-6%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"job\"]{--kic-bg:#fbe6e6;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23be3434%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%209v4M12%2017h.01M10.3%203.9%201.8%2018a2%202%200%200%200%201.7%203h17a2%202%200%200%200%201.7-3L13.7%203.9a2%202%200%200%200-3.4%200Z%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"secret\"]{--kic-bg:#fbe6e6;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23be3434%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%228%22%20cy%3D%2215%22%20r%3D%224%22%2F%3E%3Cpath%20d%3D%22m11%2012%209-9M17%206l3%203%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"ver\"]{--kic-bg:#e6effa;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563a8%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M5%2021V4h11l-2%204%202%204H5%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"docs\"]{--kic-bg:#e0f3f4;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f7c86%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M14%203H6v18h12V7z%22%2F%3E%3Cpath%20d%3D%22M14%203v4h4%22%2F%3E%3C%2Fsvg%3E\")}\n[data-ds-kic=\"week\"]{--kic-bg:#e0f3f4;--kic-img:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f7c86%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2216%22%20rx%3D%222%22%2F%3E%3Cpath%20d%3D%22M3%2010h18M8%203v4M16%203v4%22%2F%3E%3C%2Fsvg%3E\")}\n";
  function add() { var s = document.getElementById('ds-layer'); if (!s) { s = document.createElement('style'); s.id = 'ds-layer'; s.textContent = css; } (document.head || document.documentElement).appendChild(s); }
  add(); document.addEventListener('DOMContentLoaded', add); window.addEventListener('load', add);
  // Mono is for identifiers only (CIN, PAN, DIN, GSTIN, SRN, step codes, file names). Anything else
  // set in mono by a screen (dates, times, counts, labels) is switched to Public Sans with tabular figures.
  var ID = /^(?:[A-Z]{1,4}\d[A-Z0-9]{4,}|[A-Z]{5}\d{4}[A-Z]|U\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}|(?:Pre|Post|Reg|Step)[- ]?\d+|SRN\b.*|[A-Z]{2,5}-\d+[A-Z]?|.+\.(?:pdf|docx?|xlsx?|zip|png|jpe?g))$/;
  // Navy-filled controls on the lead and manager screens: an action becomes the brand primary, the picked
  // option of a group becomes brand-soft, a count pill becomes the brand count. The sidebar and the
  // greeting card keep their navy.
  var NAVY = 'rgb(21, 38, 59)';
  if (/(^|\/)s\/(lead|mgr|admin|super|dev)\//.test(String(window.__VPATH || ''))) document.documentElement.classList.add('ds-staff');
  function buttons() {
    if (!isLead) return;
    var dk = document.querySelectorAll('.btn:not(.btnp)');
    for (var j = 0; j < dk.length; j++) { if (getComputedStyle(dk[j]).color === 'rgb(255, 255, 255)') dk[j].setAttribute('data-ds-ondark', ''); else dk[j].removeAttribute('data-ds-ondark'); }
    var els = document.querySelectorAll('button, a.btn, [role="button"], .chip, .fc');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest('aside, #vp-bar, #vp-toast, [data-vp="side"]')) continue;
      el.removeAttribute('data-ds-primary'); el.removeAttribute('data-ds-on'); el.removeAttribute('data-ds-count');
      if (getComputedStyle(el).backgroundColor !== NAVY) continue;
      var tag = el.tagName, p = el.parentElement;
      if (tag !== 'BUTTON' && !el.matches('a.btn, [role="button"], .fc')) {
        if (el.matches('.chip') && (el.textContent || '').trim().length < 40) el.setAttribute('data-ds-count', '');
        continue;
      }
      var group = el.hasAttribute('aria-pressed') || el.matches('.fc') || (p && (p.matches('.seg, [role="group"], [role="tablist"]') || p.querySelectorAll(':scope > button').length > 1 && !el.matches('.btnp')));
      el.setAttribute(group ? 'data-ds-on' : 'data-ds-primary', '');
    }
  }
  // Portal refresh: status is a quiet chip on every screen. Anything painted as a solid block with white text
  // (chips, date tiles, grid cells, heatmap counts) becomes a soft tint with text of the same hue. Real buttons,
  // the sidebar and the one navy focus block per screen stay as they are.
  var BGRE = /background(?:-color)?:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|var\(--[a-z-]+\))/;
  var SOFTSEL = '.chip, .pill, td .sol, .stw, .ds-soft, .dn .dt, .dtile, [style*="color:#fff"], [style*="color: #fff"], [style*="color:#FFF"], [style*="color: rgb(255, 255, 255)"]';
  var KEEP = '[data-ds-keep], aside, .vps, #vp-bar, #vp-toast, #ds-island, #vp-chat, #vp-launch, .vp-pop, [data-card="greeting"], .hero, .summary, .it-band, .ds-dlg, header, nav, .vh-top, [role="dialog"]';
  function words() {
    var els = document.querySelectorAll(SOFTSEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.classList.contains('stw') || el.classList.contains('ds-soft')) {
        if (!el.style.getPropertyValue('--c')) { var m0 = BGRE.exec(el.getAttribute('style') || ''); if (m0) el.style.setProperty('--c', m0[1]); }
        continue;
      }
      if (el.closest(KEEP)) continue;
      var tag = el.tagName;
      if ((tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') && !el.closest('.ds-row, .wk, td')) continue;
      if (el.matches('.btn, .btnp, .it-btn, .ap-b, [data-ds-primary], [data-ds-on], [data-ds-count], .rg-strip button')) continue;
      var cs = getComputedStyle(el); if (cs.color !== 'rgb(255, 255, 255)') continue;
      var bgc = cs.backgroundColor, m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(bgc);
      if (m) { if (m[4] !== undefined && +m[4] < .6) continue; var lum = (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255; if (lum < .06 || lum > .92) continue; }
      else { var ok = /oklch\(([\d.]+)%?\s+[\d.]+\s+[\d.]+(?:\s*\/\s*([\d.]+%?))?\)/.exec(bgc); if (!ok) continue; var L = +ok[1] > 1 ? +ok[1] / 100 : +ok[1]; if (L < .3 || L > .95) continue; if (ok[2] && parseFloat(ok[2]) < (ok[2].indexOf('%') > 0 ? 60 : .6)) continue; }
      el.style.setProperty('--c', cs.backgroundColor);
      el.classList.add(el.matches('.chip, .pill, td .sol, td > span, td > b') && !el.matches('.cg td > span, .fg td > span') ? 'stw' : 'ds-soft');
    }
  }
  // Table heads are sentence case (owner, 26 Oct). Heads typed in capitals are rewritten once, keeping
  // acronyms (GSTR-1, TDS, COI) and single letters (Part A) as they are.
  var ACR = /^(COI|TDS|TCS|PF|ECR|ESI|PT|GST|GSTR|GSTIN|DIR|ADT|FC|GPR|MCA|ROC|SRN|ARN|DIN|PAN|TAN|KYC|DSC|LLP|FEMA|RBI|CIN|IEC|LUT|MSME|AGM|AOC|MGT|SPICE|NIC|UAN|IP|ID|FY|AY|OTP|SLA)$/;
  var MD = /^(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)$/;
  var PN = /^(northwind|pranay|bharath|rohan|kumar|mei|tanaka|karnataka|india|bengaluru|krishna|mithilesh|farhath|sneha|meera|priya|arjun)$/;
  function sentence(t) {
    var first = true;
    return t.replace(/[A-Za-z0-9’'+.-]+/g, function (w) {
      var core = w.replace(/[’'].*$/, ''), lw = w.toLowerCase(), lc = core.toLowerCase(), out;
      if (/\d/.test(w) || ACR.test(core.toUpperCase().replace(/[^A-Z]/g, '')) || core.length === 1 || /^(AM|PM|IST|SPICE\+)$/.test(core.toUpperCase())) out = w;
      else if (MD.test(lc) || PN.test(lc)) out = lw.charAt(0).toUpperCase() + lw.slice(1);
      else out = first ? lw.charAt(0).toUpperCase() + lw.slice(1) : lw;
      first = false; return out;
    });
  }
  function heads() {
    var els = document.querySelectorAll('thead th, .ds-head > span, .ds-head > span > span, .mr .h, .rk.h > span, .mono, .when, .eyebrow, .lbl, .cap, .kicker, [data-ds-sans], [data-card="greeting"] div, .vh-crumb li, h2, h3, b, small, span, div');
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.children.length || el.closest('#vp-bar, svg, code, kbd, .vps-logo, .cs')) continue;
      var t = el.textContent; if (t.length > 70 || t !== t.toUpperCase() || !/[A-Z]{3}/.test(t) || (!/\s/.test(t.trim()) && !el.matches('thead th, .ds-head span, .mr .h, .rk.h > span, .lbl, .cap, .eyebrow'))) continue;
      var n = sentence(t); if (n !== t) el.textContent = n;
    }
  }
  // Card heads: a tinted icon tile picked from the title (refresh "card-h .hic"). A head that already has an
  // icon tile keeps it, recoloured by the same rule. Greeting numbers get the same treatment.
  var HIC = [[/risk|stuck|overdue|incident|escalat|broken/i, 'alert'], [/alert|update|notification|announcement/i, 'bell'], [/approv|decision|granted/i, 'check'],
    [/timeline|week|calendar|what is next|coming|deadline|schedule|renewal|plan/i, 'calendar'], [/inbox|triage|message/i, 'inbox'],
    [/need|document|docs\b|vault|upload|file/i, 'file'], [/compliance|filing|obligation|statute|status/i, 'shield'], [/sbc is doing|holds|pending with|progress flow/i, 'clip'],
    [/waiting|client|people|lead|manager|team|who/i, 'user'], [/registration|\bids\b|identit|credential/i, 'id'], [/activity|audit|recent|history|log/i, 'clock'],
    [/step|queue|work|task|action|post-incorporation/i, 'list'], [/phase|practice|analytics|growth|report|chart|health|area|service/i, 'chart'], [/email|mail/i, 'mail'], [/library|knowledge|sop|book/i, 'book']];
  var KIC = [[/waiting/i, 'waiting'], [/overdue|late|failed|failing/i, 'overdue'], [/due soon|this week|due in/i, 'soon'], [/registration/i, 'reg'], [/incorporated|coi/i, 'coi'], [/action|open|needs/i, 'action'],
    [/done|filed|on time/i, 'done'], [/with sbc/i, 'sbc'], [/incorporat/i, 'inc'], [/complian/i, 'comp'], [/client/i, 'clients'], [/manager|lead|staff|people|team/i, 'people'], [/service/i, 'svc'],
    [/connection/i, 'conn'], [/message/i, 'msg'], [/job/i, 'job'], [/secret/i, 'secret'], [/version/i, 'ver'], [/document/i, 'docs'], [/week/i, 'week']];
  function pick(list, t) { for (var i = 0; i < list.length; i++) if (list[i][0].test(t)) return list[i][1]; return null; }
  var CARDSEL = 'section.card, .pa-c, section.ap, section.mt, section.rg-card, .cp .card';
  function cards() {
    var cs = document.querySelectorAll(CARDSEL);
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i]; if (c.closest('.cs, [role="dialog"], aside, .vh-greet, [data-card="greeting"], .hero')) continue;
      var h = c.querySelector(':scope > div:first-of-type > h3, :scope > div:first-of-type > h2, :scope > .ch h2, :scope > .ch h3, :scope > .pa-h h2, :scope > h2, :scope > header h2, :scope > div:first-of-type > div > h2');
      if (!h || h.hasAttribute('data-ds-ic')) continue;
      var r = h.getBoundingClientRect(), cr = c.getBoundingClientRect(); if (r.top - cr.top > 64) continue;
      var key = pick(HIC, h.textContent || '') || 'grid';
      var row = h.parentElement, tile = row && row.querySelector(':scope > .tile, :scope > .pa-ic, :scope > span > svg');
      if (tile && tile.compareDocumentPosition(h) & 4) { var t = tile.matches('svg') ? tile.parentElement : tile; if (t.classList.contains('tile')) t.setAttribute('data-ds-tone', key); h.setAttribute('data-ds-ic', '-'); continue; }
      h.setAttribute('data-ds-ic', key);
    }
    // Main buttons are navy (refresh "btn primary"): any solid blue button with white text.
    var bl = document.querySelectorAll('button, a.btn, a[class*="btn"], [role="button"]');
    for (var u = 0; u < bl.length; u++) {
      var be = bl[u]; if (be.hasAttribute('data-ds-blue') || be.closest('aside, .vps, #vp-bar, .cs-rail, [data-ds-keep]')) continue;
      var bcs = getComputedStyle(be); if (bcs.color !== 'rgb(255, 255, 255)') continue;
      if (/^rgb\((37, 99, 168|47, 111, 208|30, 82, 144|27, 79, 148)\)$/.test(bcs.backgroundColor)) be.setAttribute('data-ds-blue', '');
    }
    // Owner chips (who holds it): one width, a dot, the owner's soft colour.
    var oc = document.querySelectorAll('.chip:not([data-ds-own]), .own:not([data-ds-own])');
    for (var v = 0; v < oc.length; v++) { var ot = (oc[v].textContent || '').trim(); if (/^(Northwind|SBC|MCA|Client|You|Bharath|Pranay)$/.test(ot)) oc[v].setAttribute('data-ds-own', /^(Northwind|Client|You)$/.test(ot) ? 'client' : ot === 'MCA' ? 'mca' : 'firm'); }
    // Phase progress: each phase cell becomes a 6px bar with its count under it.
    var pcs = document.querySelectorAll('section.card');
    for (var w = 0; w < pcs.length; w++) {
      var hh = pcs[w].querySelector('h2, h3'); if (!hh || !/^Phase progress/.test((hh.textContent || '').trim())) continue;
      var cells = pcs[w].querySelectorAll('.ds-row > span:nth-child(2) > span:not(.ds-pcell)');
      for (var x2 = 0; x2 < cells.length; x2++) {
        var ce = cells[x2], tx = (ce.textContent || '').trim(), mm = /(\d+)\s*\/\s*(\d+)/.exec(tx), pv = tx === '✓' ? 100 : mm ? Math.round(+mm[1] / Math.max(1, +mm[2]) * 100) : 0;
        var cc = getComputedStyle(ce).backgroundColor, dashed = /dashed/.test(ce.getAttribute('style') || '');
        ce.classList.add('ds-pcell'); ce.style.setProperty('--p', (pv && pv < 6 ? 6 : pv) + '%');
        ce.style.setProperty('--pc', tx === '✓' ? '#46a87a' : dashed ? '#d5dbe3' : (/190, 52, 52/.test(cc) || /be3434/i.test(ce.style.getPropertyValue('--c'))) ? '#dd6262' : '#2563a8');
        if (tx === '✓') ce.setAttribute('data-done', '');
      }
    }
    // Client timeline: once the card says Completed, the COI row is ticked too.
    var tls = document.querySelectorAll('.vh-tl');
    for (var z = 0; z < tls.length; z++) {
      var card = tls[z].closest('section.card'); if (!card || !/Completed/.test((card.querySelector(':scope > div') || {}).textContent || '')) continue;
      var coi = tls[z].querySelector('.tipw[aria-label="COI"]'); if (coi) { var rw = coi.closest('div[style*="grid-template-columns"]'); if (rw && !rw.hasAttribute('data-ds-done')) rw.setAttribute('data-ds-done', ''); }
    }
    var sg = document.querySelectorAll('section.card > div:first-of-type .seg:not(.ds-tight)');
    for (var q = 0; q < sg.length; q++) { var hd = sg[q].closest('section.card > div'), h3 = hd && hd.querySelector(':scope > h3'); if (hd && (hd.scrollWidth > hd.clientWidth + 1 || (h3 && h3.scrollWidth > h3.clientWidth + 1))) sg[q].classList.add('ds-tight'); }
    var ph = document.querySelectorAll('details.stp-g > summary:not([data-ds-p])');
    for (var p = 0; p < ph.length; p++) {
      var ch = ph[p].querySelector('.chip'), m = ch && /(\d+)\s*(?:of|\/)\s*(\d+)/.exec(ch.textContent || ''); if (!m) continue;
      var pc = Math.round(+m[1] / Math.max(1, +m[2]) * 100); ph[p].setAttribute('data-ds-p', pc);
      ph[p].style.setProperty('--ds-p', pc + '%'); ph[p].style.setProperty('--ds-pc', pc >= 100 ? '#46a87a' : '#2563a8');
    }
    var ks = document.querySelectorAll('.vh-greet .vh-stat, html.ds-staff .gk > a, html.ds-staff .hero .kp > span');
    for (var j = 0; j < ks.length; j++) {
      var k = ks[j]; if (k.hasAttribute('data-ds-kic')) continue;
      var lab = (k.lastElementChild || k).textContent || '';
      k.setAttribute('data-ds-kic', pick(KIC, lab) || 'action');
    }
  }
  function sweep() {
    buttons(); words(); heads(); cards();
    var els = document.querySelectorAll('.mono,[style*="Plex Mono"],[style*="monospace"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.closest('#vp-bar,#vp-toast,#vp-tip')) continue;
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t && !ID.test(t)) el.setAttribute('data-ds-sans', ''); else el.removeAttribute('data-ds-sans');
    }
  }
  // Breadcrumbs navigate: every segment except the current page becomes a link to its route.
  var isLead = /(^|\/)s\/(lead|mgr|admin|super|dev)\//.test(String(window.__VPATH || ''));
  var pre = /(^|\/)s\/dev\//.test(String(window.__VPATH || '')) ? 'dev-' : /(^|\/)s\/super\//.test(String(window.__VPATH || '')) ? 'super-' : /(^|\/)s\/admin\//.test(String(window.__VPATH || '')) ? 'admin-' : (/(^|\/)s\/mgr\//.test(String(window.__VPATH || '')) ? 'mgr-' : 'lead-');
  var CR = [['today', 'home'], ['home', 'home'], ['overview', 'home'], ['work', 'work'], ['clients', 'clients'], ['docs', 'vault'], ['vault', 'vault'], ['knowledge bank', 'knowledge-bank'], ['library', 'knowledge-bank'], ['updates', 'announcements'], ['announcements', 'announcements'], ['notifications', 'notifications'], ['compliances', 'compliances'], ['calendar', 'compliances'], ['filings', 'filings'], ['analytics', 'analytics'], ['audit', 'audit'], ['settings', 'settings'], ['email', 'email'], ['incorporation', 'incorporation'], ['documents', 'documents'], ['team', 'team'], ['credentials', 'credentials'], ['board resolution', 'board-resolution'], ['my work', 'work'], ['my leads', 'leads'], ['project leads', 'leads'], ['managers', 'managers'], ['registrations', 'registrations'], ['obligations', 'obligations']];
  function crumbRoute(t) {
    t = t.toLowerCase().replace(/\s+/g, ' ').trim();
    var R = window.__VCFO_ROUTES || {}, r = null;
    for (var i = 0; i < CR.length; i++) if (t === CR[i][0]) { r = CR[i][1]; break; }
    if (!r && /^phase \d/.test(t)) r = 'inc-phase';
    if (!r && /pvt ltd|technologies|foods|analytics|robotics|logistics|health|fintech|bio\b/.test(t)) r = isLead ? 'overview' : 'incorporation';
    if (!r) return null;
    if (isLead) { if (r === 'home') return pre + 'home'; return R[pre + r] ? pre + r : (R['lead-' + r] ? 'lead-' + r : null); }
    return R[r] ? r : null;
  }
  function crumbs() {
    var navs = document.querySelectorAll('nav[aria-label="Location"], nav[aria-label="Breadcrumb"], nav.vh-crumb, nav.crumb, nav.cr-trail');
    for (var n = 0; n < navs.length; n++) {
      var nav = navs[n], list = nav.querySelector('ol, ul'), kids = [].slice.call((list || nav).children);
      var segs = kids.filter(function (el) { var t = (el.textContent || '').replace(/\s+/g, ' ').trim(); return t && !/^[\/›>·|]$/.test(t); });
      for (var i = 0; i < segs.length - 1; i++) {
        var el = segs[i]; if (el.hasAttribute('data-crumb-go') || el.matches('a[data-go]')) continue;
        var route = crumbRoute(el.textContent || ''); if (!route) continue;
        el.setAttribute('data-crumb-go', route); el.setAttribute('role', 'link'); el.setAttribute('tabindex', '0'); el.classList.add('ds-crumb');
      }
    }
  }
  // Live status pill: vcfoStatus(['Filing GSTR-3B · Kestrel · 1 of 4', ...], 'Filed · ARN AA2910…').
  window.vcfoStatus = function (steps, doneText) {
    var el = document.getElementById('ds-island');
    if (!el) { el = document.createElement('div'); el.id = 'ds-island'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    var i = 0; clearTimeout(el._t);
    function step() {
      if (i < steps.length) { el.innerHTML = '<span class="sp" aria-hidden="true"></span><span></span>'; el.lastChild.textContent = steps[i++]; el.classList.add('on'); el._t = setTimeout(step, 800); return; }
      el.innerHTML = '<span class="ok" aria-hidden="true"></span><span></span>'; el.lastChild.textContent = doneText; el._t = setTimeout(function () { el.classList.remove('on'); }, 2200);
    }
    step();
  };
  // Rolling numbers in the greeting strip: they count up once when the page opens.
  function roll() {
    if (!isLead || roll.done) return; var els = document.querySelectorAll('.gk b, .hero .kp b'); if (!els.length) return; roll.done = true;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    [].forEach.call(els, function (el) {
      var host = el.querySelector('.sc-interp') || el, node = host.firstChild; if (!node || node.nodeType !== 3) return;
      var t = node.nodeValue, m = /^(\D*)(\d[\d,]*)(.*)$/.exec(t.trim()); if (!m) return;
      var to = +m[2].replace(/,/g, ''), k = 0; if (!to || to > 100000) return;
      var iv = setInterval(function () { k++; if (node.nodeValue !== t && k > 1 && !node.parentNode) { clearInterval(iv); return; } node.nodeValue = m[1] + Math.round(to * k / 14).toLocaleString('en-IN') + m[3]; if (k >= 14) { clearInterval(iv); node.nodeValue = t; } }, 32);
    });
  }
  window.addEventListener('load', function () { setTimeout(roll, 700); });
  window.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-notes]'); if (!t) return; e.preventDefault(); e.stopPropagation();
    if (window.vcfoToast) window.vcfoToast('Notes · staff only: Rohan prefers calls after 4 pm · Mei handles payroll data');
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.hasAttribute || !t.hasAttribute('data-vault-client')) return;
    if (window.vcfoToast) window.vcfoToast('Showing ' + t.value + ' · this prototype keeps Northwind\'s files');
  }, true);
  window.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-pick-item]'); if (!t) return;
    try { sessionStorage.setItem('vcfo.item', t.getAttribute('data-pick-item')); } catch (x) {}
  }, true);
  window.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-inbox-tab]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    var sec = t.closest('[data-inbox]'); if (!sec) return;
    sec.setAttribute('data-inbox', t.getAttribute('data-inbox-tab'));
    [].forEach.call(sec.querySelectorAll('[data-inbox-tab]'), function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
  }, true);
  window.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pick-mgr]'); if (!b) return;
    try { sessionStorage.setItem('vcfo.mgr', b.getAttribute('data-pick-mgr')); } catch (x) {}
    if (/(^|\/)s\/admin\/Managers\./.test(String(window.__VPATH || ''))) { e.preventDefault(); e.stopPropagation(); window.dispatchEvent(new CustomEvent('vcfo:mgr')); }
  }, true);
  window.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('[data-nav-fold]'); if (!f) return;
    e.preventDefault(); e.stopPropagation();
    var key = 'vcfo.nav.' + f.getAttribute('data-nav-fold');
    try { sessionStorage.setItem(key, f.getAttribute('aria-expanded') === 'true' ? '0' : '1'); } catch (x) {}
    window.dispatchEvent(new CustomEvent('vcfo:nav'));
  }, true);
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var sc = document.querySelector('.ds-scrim'); if (!sc) return;
    e.preventDefault(); e.stopPropagation(); sc.click();
    var b = document.querySelector('.ds-dd[aria-expanded="true"]'); if (b) b.focus();
  }, true);
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('aside a[aria-label]'); if (!a) return;
    var m = /^(Bharath|Sneha|Meera) /.exec(a.getAttribute('aria-label') || ''); if (!m) return;
    if (!/(^|\/)s\/mgr\/Leads\./.test(String(window.__VPATH || ''))) return;
    e.preventDefault(); e.stopPropagation();
    try { sessionStorage.setItem('vcfo.lead', m[1]); } catch (x) {}
    window.dispatchEvent(new CustomEvent('vcfo:lead', { detail: m[1] }));
  }, true);
  // Incorporation timeline: the phase name opens the phase (the per-row Open button is gone).
  document.addEventListener('click', function (e) {
    var n = e.target.closest && e.target.closest('.phh .pnm'); if (!n) return;
    var o = n.closest('.phh').querySelector('.ob'); if (o) { e.preventDefault(); o.click(); }
  }, true);
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-crumb-go]'); if (!c) return;
    e.preventDefault(); e.stopPropagation(); if (window.vcfoGo) window.vcfoGo(c.getAttribute('data-crumb-go'));
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target.hasAttribute || !e.target.hasAttribute('data-crumb-go')) return;
    e.preventDefault(); if (window.vcfoGo) window.vcfoGo(e.target.getAttribute('data-crumb-go'));
  }, true);
  var pend = 0; function later() { if (pend) return; pend = setTimeout(function () { pend = 0; sweep(); crumbs(); }, 60); }
  document.addEventListener('DOMContentLoaded', crumbs); window.addEventListener('load', crumbs);
  document.addEventListener('DOMContentLoaded', sweep); window.addEventListener('load', sweep);
  try { new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style'] }); } catch (e) {}
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-signout]');
    if (!b || b.closest('.vps')) return;
    e.preventDefault(); e.stopPropagation();
    if (window.vcfoToast) window.vcfoToast('Signed out · this is a prototype, so you stay on the page');
  }, true);
})();
