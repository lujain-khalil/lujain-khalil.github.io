// Hero: four classes of particles that start mixed and learn to separate.
(() => {
  const canvas = document.getElementById("latent");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const labels = [...document.querySelectorAll(".cl")];
  const COLORS = ["#7cf3d0", "#a99cff", "#ffb86b", "#ff7aa6"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SETTLE_FRAMES = 260; // about 4.5 s at 60 fps; frame-based so slow devices still settle cleanly

  let W = 0, H = 0, dpr = 1, P = [], f = 0, running = false, visible = true, raf = 0;
  const mouse = { x: -1e4, y: -1e4 };

  // Cluster centres as fractions of the hero. Desktop keeps the right side, phones the top.
  function centres() {
    // Phones: a 2x2 grid above the copy. Tablets: one row above the copy. Desktop: right-hand side.
    const pts = W < 760
      ? [[0.27, 0.15], [0.73, 0.13], [0.30, 0.26], [0.74, 0.24]]
      : W < 1000
        ? [[0.14, 0.2], [0.38, 0.17], [0.62, 0.2], [0.86, 0.17]]
        : [[0.66, 0.30], [0.86, 0.56], [0.64, 0.68], [0.87, 0.25]];
    return pts.map(([a, b]) => [a * W, b * H]);
  }

  function spreadOf() { return W < 760 ? Math.min(W, H) * 0.065 : W < 1000 ? 42 : Math.min(W, H) * 0.11 }

  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    placeLabels();
  }

  function seed() {
    const n = Math.round(Math.min(1100, Math.max(380, (W * H) / 1500)));
    P = Array.from({ length: n }, (_, i) => ({
      k: i % 4, x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
      r: Math.random() * 1.5 + 0.5, ph: Math.random() * 6.28, ox: gauss(), oy: gauss(),
    }));
    f = 0;
    labels.forEach(l => l.classList.remove("show"));
  }

  function placeLabels() {
    const C = centres(), spread = spreadOf();
    labels.forEach(l => {
      const [cx, cy] = C[+l.dataset.c];
      l.style.left = cx + "px";
      l.style.top = cy - spread - 14 + "px";
    });
  }

  function frame(now) {
    const s = Math.min(1, ++f / SETTLE_FRAMES), e = s * s * (3 - 2 * s);
    const C = centres(), spread = spreadOf();
    // Fade old frames to transparent (not to a colour) so trails never leave grey residue.
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    for (const p of P) {
      const [cx, cy] = C[p.k];
      // Each particle has its own home inside its class cloud, which drifts in a slow orbit.
      const a = now * 0.00012 * (p.k % 2 ? 1 : -1);
      const ca = Math.cos(a), sa = Math.sin(a);
      const tx = cx + (p.ox * ca - p.oy * sa) * spread, ty = cy + (p.ox * sa + p.oy * ca) * spread;
      p.vx += (tx - p.x) * 0.0016 * e + Math.cos(now / 900 + p.ph) * 0.05 * (1 - e) + Math.cos(now / 700 + p.ph * 3) * 0.006;
      p.vy += (ty - p.y) * 0.0016 * e + Math.sin(now / 1100 + p.ph) * 0.05 * (1 - e) + Math.sin(now / 800 + p.ph * 2) * 0.006;
      const mx = p.x - mouse.x, my = p.y - mouse.y, d2 = mx * mx + my * my;
      if (d2 < 16000) { const f = 60 / (d2 + 200); p.vx += mx * f; p.vy += my * f }
      p.vx *= 0.93; p.vy *= 0.93;
      p.x += p.vx; p.y += p.vy;
      ctx.globalAlpha = 0.3 + 0.65 * e;
      ctx.fillStyle = COLORS[p.k];
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (e > 0.85) labels.forEach(l => l.classList.add("show"));
    raf = requestAnimationFrame(frame);
  }

  // Reduced motion: draw the settled state once, no animation.
  function drawStatic() {
    const C = centres(), spread = spreadOf();
    ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      const [cx, cy] = C[p.k];
      p.x = cx + gauss() * spread; p.y = cy + gauss() * spread;
      ctx.globalAlpha = 0.85; ctx.fillStyle = COLORS[p.k];
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    labels.forEach(l => l.classList.add("show"));
  }

  function start() { if (!running && visible && !document.hidden) { running = true; raf = requestAnimationFrame(frame) } }
  function stop() { running = false; cancelAnimationFrame(raf) }

  resize(); seed();
  if (reduce) { drawStatic() } else { start() }

  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { const oldW = W; resize(); if (Math.abs(W - oldW) > 80) { seed(); if (reduce) drawStatic() } }, 150);
  });
  canvas.parentElement.addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -1e4 });
  const remix = document.getElementById("remix");
  if (remix) remix.addEventListener("click", () => { seed(); if (reduce) drawStatic() });

  if ("IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop() }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => { if (reduce) return; document.hidden ? stop() : start() });
})();
