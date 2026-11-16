// Shared on every page: nav state, scroll reveals, count-up numbers, and a "when visible" helper.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.LK = window.LK || {};
  LK.reduce = reduce;
  LK.css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  // Run fn once when el scrolls into view (immediately without IntersectionObserver).
  LK.whenVisible = (el, fn, threshold = 0.35) => {
    if (!el) return;
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); fn() } }, { threshold });
    io.observe(el);
  };
  // Run an endless frame loop only while el is on screen and the tab is visible.
  LK.loop = (el, frame) => {
    if (reduce) { frame(); return }
    let on = false, raf = 0;
    const tick = () => { frame(); raf = requestAnimationFrame(tick) };
    const set = v => { if (v && !on) { on = true; raf = requestAnimationFrame(tick) } else if (!v && on) { on = false; cancelAnimationFrame(raf) } };
    let vis = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => { vis = en.isIntersecting; set(vis && !document.hidden) }).observe(el); else set(true);
    document.addEventListener("visibilitychange", () => set(vis && !document.hidden));
  };
  // Animate t from 0 to 1 over ms, calling step(eased t). Instant under reduced motion.
  LK.tween = (ms, step) => new Promise(done => {
    if (reduce) { step(1); return done() }
    const t0 = performance.now();
    const f = now => { const t = Math.min(1, (now - t0) / ms); step(1 - Math.pow(1 - t, 3)); t < 1 ? requestAnimationFrame(f) : done() };
    requestAnimationFrame(f);
  });
  // A crisp canvas at device pixel ratio. Returns {g, w, h}.
  LK.canvas = (c, h) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth || c.parentElement.clientWidth;
    const hh = h || c.clientHeight || 120;
    c.width = Math.round(w * dpr); c.height = Math.round(hh * dpr);
    const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, w, h: hh };
  };

  /* nav */
  const nav = document.querySelector(".nav");
  if (nav && !nav.classList.contains("solid")) {
    const onScroll = () => nav.classList.toggle("scrolled", scrollY > 30);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* count-up: <b data-count="1300" data-prefix="~" data-suffix="%"> */
  document.querySelectorAll("[data-count]").forEach(el => {
    const end = +el.dataset.count, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const fmt = v => pre + Math.round(v).toLocaleString("en-US") + suf;
    LK.whenVisible(el, () => LK.tween(1400, t => { el.textContent = fmt(end * t) }));
  });

  /* reveal */
  if ("IntersectionObserver" in window && !reduce) {
    const rv = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); rv.unobserve(en.target) } }), { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".head, .card, .num, .portal, .step, .vizcard, .paper, .course, .lab, .arch, .trace, .stat-strip").forEach(t => { t.classList.add("reveal"); rv.observe(t) });
  }
})();
