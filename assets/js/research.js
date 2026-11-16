// Research page: fuzziness lab, thesis figures, one visual per paper, and the Kaprekar playground.
(() => {
  const C0 = "#7cf3d0", C1 = "#a99cff", C2 = "#ffb86b", C3 = "#ff7aa6", LINE = "#1d2638", MUTED = "#8b93a7", INK = "#e8ecf5";
  const COLS = [C0, C1, C2];
  // Canvases draw in a 520-wide coordinate system; scale text up on narrow screens so it stays ~12px.
  const ref = document.querySelector(".pv canvas, .lab canvas");
  const FS = Math.round(12 * Math.max(1, 520 / ((ref && ref.clientWidth) || 520)));
  const FONT = FS + "px JetBrains Mono, monospace";
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const gn = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v) };
  const fit = (c, w, h) => { const dpr = Math.min(window.devicePixelRatio || 1, 2); c.width = w * dpr; c.height = h * dpr; const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); return g };
  const svgEl = (tag, attrs, parent) => { const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e };

  /* ================= fuzziness lab ================= */
  const sc = document.getElementById("lab-scatter"), cv = document.getElementById("lab-curve"), tIn = document.getElementById("lab-t");
  if (sc && cv && tIn) {
    const W = 520, H = 360, CW = 520, CH = 220;
    const g = fit(sc, W, H), h = fit(cv, CW, CH);
    const M = [[-1, -0.55], [1, -0.55], [0, 1.05]];      // base class means (a triangle)
    const N = 70, Z = M.map(() => Array.from({ length: N }, () => [gn(), gn()]));
    const SIG0 = 0.85;
    const RATES = { mean: [[.6, .6, .6], [.25, .6, 1.1]], sd: [[.6, .6, .6], [.25, .6, 1.1]] };
    let scen = 1;
    const params = tau => {
      const a = scen === 1 || scen === 5 ? RATES.mean[0] : scen === 2 ? RATES.mean[1] : [0, 0, 0];
      const b = scen === 3 || scen === 5 ? RATES.sd[0] : scen === 4 ? RATES.sd[1] : [0, 0, 0];
      return M.map((m, k) => ({ mx: m[0] * (1 + a[k] * tau), my: m[1] * (1 + a[k] * tau), s: SIG0 / (1 + b[k] * tau) }));
    };
    const points = tau => params(tau).flatMap((p, k) => Z[k].map(([zx, zy]) => [p.mx + p.s * zx, p.my + p.s * zy, k]));
    // D = Tr(Sw · Sb^-1) for 2D data.
    function fuzz(pts) {
      const n = pts.length, mu = [0, 0], cm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      pts.forEach(([x, y, k]) => { mu[0] += x; mu[1] += y; cm[k][0] += x; cm[k][1] += y; cm[k][2]++ });
      mu[0] /= n; mu[1] /= n; cm.forEach(c => { c[0] /= c[2]; c[1] /= c[2] });
      let w = [0, 0, 0], b = [0, 0, 0];
      pts.forEach(([x, y, k]) => { const dx = x - cm[k][0], dy = y - cm[k][1]; w[0] += dx * dx; w[1] += dx * dy; w[2] += dy * dy });
      cm.forEach(c => { const dx = c[0] - mu[0], dy = c[1] - mu[1]; b[0] += c[2] * dx * dx; b[1] += c[2] * dx * dy; b[2] += c[2] * dy * dy });
      w = w.map(v => v / n); b = b.map(v => v / n);
      const det = b[0] * b[2] - b[1] * b[1]; const ib = [b[2] / det, -b[1] / det, b[0] / det];
      return w[0] * ib[0] + w[1] * ib[1] + w[1] * ib[1] + w[2] * ib[2];
    }
    const T = i => i / 100 * 8;  // slider 0..100 -> tau 0..8
    let curve = [];
    const build = () => { curve = Array.from({ length: 101 }, (_, i) => fuzz(points(T(i)))) };
    function drawScatter(i) {
      const pts = points(T(i)), ps = params(T(i));
      const spread = ps.reduce((a, p) => a + Math.hypot(p.mx, p.my), 0) / 3;   // keep the view stable as means move
      const k = Math.min(W, H) * 0.26 / spread;
      g.clearRect(0, 0, W, H);
      g.strokeStyle = LINE; g.lineWidth = 1;
      for (let x = 40; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke() }
      for (let y = 40; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }
      pts.forEach(([x, y, c]) => { g.fillStyle = COLS[c]; g.globalAlpha = .85; g.beginPath(); g.arc(W / 2 + x * k, H / 2 - y * k + 10, 3.2, 0, 6.283); g.fill() });
      g.globalAlpha = 1;
      ps.forEach((p, c) => { const x = W / 2 + p.mx * k, y = H / 2 - p.my * k + 10; g.strokeStyle = COLS[c]; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.moveTo(x, y - 7); g.lineTo(x, y + 7); g.stroke() });
    }
    function drawCurve(i) {
      h.clearRect(0, 0, CW, CH);
      const L = curve.map(Math.log10), lo = Math.min(...L), hi = Math.max(...L);
      const X = j => 40 + j / 100 * (CW - 56), Y = v => 16 + (hi - v) / (hi - lo || 1) * (CH - 48);
      h.strokeStyle = LINE; h.beginPath(); h.moveTo(40, 10); h.lineTo(40, CH - 28); h.lineTo(CW - 10, CH - 28); h.stroke();
      h.fillStyle = MUTED; h.font = FONT; h.fillText("log D", 2, FS + 2); h.textAlign = "right"; h.fillText("training time →", CW - 6, CH - 8); h.textAlign = "left";
      h.strokeStyle = "rgba(169,156,255,.35)"; h.lineWidth = 2; h.beginPath(); L.forEach((v, j) => j ? h.lineTo(X(j), Y(v)) : h.moveTo(X(j), Y(v))); h.stroke();
      h.strokeStyle = C1; h.lineWidth = 2.5; h.beginPath(); L.slice(0, i + 1).forEach((v, j) => j ? h.lineTo(X(j), Y(v)) : h.moveTo(X(j), Y(v))); h.stroke();
      h.fillStyle = C1; h.beginPath(); h.arc(X(i), Y(L[i]), 5, 0, 6.283); h.fill();
    }
    const dOut = document.getElementById("lab-d"), oOut = document.getElementById("lab-o"), tOut = document.getElementById("lab-t-out");
    function render() { const i = +tIn.value; drawScatter(i); drawCurve(i); dOut.textContent = curve[i].toFixed(curve[i] < 0.01 ? 4 : 3); tOut.textContent = i; oOut.textContent = scen === 5 ? "t⁻⁴" : "t⁻²" }
    document.querySelectorAll("#lab-seg button").forEach(b => b.addEventListener("click", () => {
      scen = +b.dataset.s; document.querySelectorAll("#lab-seg button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); build(); render();
    }));
    tIn.addEventListener("input", () => { tIn.dataset.touched = 1; render() });
    build(); render();
    LK.whenVisible(sc, () => { if (LK.reduce) return; const t0 = performance.now(); const f = now => { if (tIn.dataset.touched) return; const k = Math.min(1, (now - t0) / 3500); tIn.value = Math.round(k * 100); render(); if (k < 1) requestAnimationFrame(f) }; requestAnimationFrame(f) }, 0.4);
  }

  /* ================= thesis mini figures ================= */
  const spike = document.getElementById("spike");
  if (spike) {
    const vals = [0.36, 1, 0.74, 0.53, 0.38, 0.27, 0.2, 0.15, 0.12];
    const X = i => 30 + i * 34, Y = v => 140 - v * 115;
    svgEl("line", { x1: 30, y1: 140, x2: 310, y2: 140, stroke: LINE }, spike);
    const d = vals.map((v, i) => `${i ? "L" : "M"}${X(i)},${Y(v)}`).join(" ");
    const path = svgEl("path", { d, fill: "none", stroke: C1, "stroke-width": 2.5 }, spike);
    vals.forEach((v, i) => svgEl("circle", { cx: X(i), cy: Y(v), r: 3.5, fill: i === 1 ? C3 : C1 }, spike));
    const t1 = svgEl("text", { x: X(1) + 8, y: Y(1) + 4, fill: C3, "font-size": 11, "font-family": "JetBrains Mono" }, spike); t1.textContent = "spike";
    const t2 = svgEl("text", { x: 30, y: 160, fill: MUTED, "font-size": 11, "font-family": "JetBrains Mono" }, spike); t2.textContent = "embed → block 1 … block 7 → head";
    const L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
    LK.whenVisible(spike, () => { path.style.transition = LK.reduce ? "none" : "stroke-dashoffset 1.6s ease"; path.style.strokeDashoffset = 0 });
  }
  const fitSvg = document.getElementById("fit");
  if (fitSvg) {
    const X = e => 20 + e / 150 * 290, Y = v => 110 - (v - 2.6) / 3.9 * 95, f = e => 2.6 + 3.9 * Math.exp(-e / 38);
    svgEl("line", { x1: 20, y1: 112, x2: 312, y2: 112, stroke: LINE }, fitSvg);
    for (let e = 0; e <= 150; e += 5) svgEl("circle", { cx: X(e), cy: Y(f(e) + (rnd() - .5) * .12), r: 2.2, fill: C0, opacity: .8 }, fitSvg);
    let d = ""; for (let e = 0; e <= 150; e += 2) d += `${e ? "L" : "M"}${X(e)},${Y(f(e))} `;
    svgEl("path", { d, fill: "none", stroke: C1, "stroke-width": 2 }, fitSvg);
    const t = svgEl("text", { x: 230, y: 126, fill: MUTED, "font-size": 11, "font-family": "JetBrains Mono" }, fitSvg); t.textContent = "epochs →";
  }
  const dims = document.getElementById("dims");
  if (dims) {
    const data = [[32, .99], [64, 1], [128, .97], [256, .53], [512, .19]];
    const bw = 44, gap = 16;
    data.forEach(([d, r], i) => {
      const x = 22 + i * (bw + gap), hgt = r * 115, bad = r < .9;
      const rect = svgEl("rect", { x, y: 135, width: bw, height: 0, rx: 4, fill: bad ? C3 : C1 }, dims);
      const v = svgEl("text", { x: x + bw / 2, y: 128, "text-anchor": "middle", fill: bad ? C3 : INK, "font-size": 12, "font-family": "JetBrains Mono" }, dims); v.textContent = r.toFixed(2);
      const l = svgEl("text", { x: x + bw / 2, y: 155, "text-anchor": "middle", fill: MUTED, "font-size": 11, "font-family": "JetBrains Mono" }, dims); l.textContent = d;
      LK.whenVisible(dims, () => LK.tween(900 + i * 120, t => { rect.setAttribute("y", 135 - hgt * t); rect.setAttribute("height", hgt * t); v.setAttribute("y", 128 - hgt * t) }));
    });
    const cap = svgEl("text", { x: 22, y: 172, fill: MUTED, "font-size": 10.5, "font-family": "JetBrains Mono" }, dims); cap.textContent = "embedding dim · fit R²";
  }

  /* ================= paper 1: ViT layers over epochs ================= */
  const vl = document.getElementById("vitlayers");
  if (vl) {
    const W = 520, H = 260, g = fit(vl, W, H), base = [0.36, 1, 0.74, 0.53, 0.38, 0.27, 0.2, 0.15, 0.12];
    const X = i => 40 + i * (W - 70) / 8, Y = v => H - 34 - v * (H - 60);
    const drawAt = k => {
      g.clearRect(0, 0, W, H); g.strokeStyle = LINE; g.beginPath(); g.moveTo(40, 14); g.lineTo(40, H - 34); g.lineTo(W - 20, H - 34); g.stroke();
      g.fillStyle = MUTED; g.font = FONT; g.fillText("fuzziness", 4, FS); g.textAlign = "right"; g.fillText("layer →", W - 6, H - 12); g.textAlign = "left";
      for (let e = 0; e <= k; e++) {
        const decay = Math.exp(-e * 0.42), a = 0.2 + 0.8 * (e / 6);
        g.strokeStyle = e === k ? C1 : `rgba(169,156,255,${a * 0.5})`; g.lineWidth = e === k ? 2.6 : 1.4; g.beginPath();
        base.forEach((v, i) => { const y = Y(v * (i === 0 ? 1 : decay * (0.55 + 0.45 * Math.exp(-i * 0.05)))); i ? g.lineTo(X(i), y) : g.moveTo(X(i), y) }); g.stroke();
      }
      g.fillStyle = C1; g.textAlign = "right"; g.fillText("epoch " + [1, 10, 25, 50, 80, 120, 150][k], W - 6, FS + 8); g.textAlign = "left";
    };
    let k = 0; drawAt(LK.reduce ? 6 : 0);
    let last = 0;
    if (!LK.reduce) LK.loop(vl, () => { const now = performance.now(); if (now - last > 900) { last = now; k = (k + 1) % 7; drawAt(k) } });
  }

  /* ================= paper 2: OT vs uniform quantization ================= */
  const qc = document.getElementById("quant");
  if (qc) {
    const W = 520, H = 230, g = fit(qc, W, H);
    seed = 5; const wts = Array.from({ length: 5000 }, () => { const s = rnd() < .5 ? -1 : 1; return s * -Math.log(1 - rnd()) * 0.35 + gn() * 0.05 }).filter(v => Math.abs(v) < 2).sort((a, b) => a - b);
    const lo = wts[0], hi = wts[wts.length - 1];
    let mode = "ot", bits = 3;
    function quantize() {
      const L = 2 ** bits; let edges = [];
      if (mode === "uniform") for (let i = 0; i <= L; i++) edges.push(lo + (hi - lo) * i / L);
      else { edges.push(lo); for (let i = 1; i < L; i++) edges.push(wts[Math.floor(i / L * wts.length)]); edges.push(hi) }
      const recon = []; let err = 0;
      for (let b = 0; b < L; b++) {
        const inBin = wts.filter((w, j) => w >= edges[b] && (b === L - 1 ? w <= edges[b + 1] : w < edges[b + 1]));
        const c = mode === "uniform" ? (edges[b] + edges[b + 1]) / 2 : (inBin.reduce((a, v) => a + v, 0) / (inBin.length || 1));
        recon.push(c); inBin.forEach(w => { err += Math.abs(w - c) });
      }
      return { edges, recon, err: err / wts.length, L };
    }
    const X = v => 20 + (v - lo) / (hi - lo) * (W - 40);
    function draw() {
      const { edges, recon, err, L } = quantize();
      g.clearRect(0, 0, W, H);
      const bins = 90, hist = new Array(bins).fill(0); wts.forEach(v => hist[Math.min(bins - 1, Math.floor((v - lo) / (hi - lo) * bins))]++);
      const mx = Math.max(...hist), bw = (W - 40) / bins;
      hist.forEach((c, i) => { g.fillStyle = "#24304a"; const hh = c / mx * (H - 70); g.fillRect(20 + i * bw, H - 40 - hh, bw - 1, hh) });
      edges.forEach(e => { g.strokeStyle = mode === "ot" ? C1 : C2; g.globalAlpha = .7; g.beginPath(); g.moveTo(X(e), 14); g.lineTo(X(e), H - 40); g.stroke() });
      g.globalAlpha = 1;
      recon.forEach(r => { g.fillStyle = mode === "ot" ? C1 : C2; g.beginPath(); g.arc(X(r), H - 28, 4, 0, 6.283); g.fill() });
      g.fillStyle = MUTED; g.font = FONT; g.fillText("● levels", 20, H - 6); g.textAlign = "right"; g.fillText("weight →", W - 6, H - 6); g.textAlign = "left";
      document.getElementById("q-levels").textContent = L; document.getElementById("q-err").textContent = err.toFixed(3);
      document.getElementById("q-bits-out").textContent = bits;
    }
    document.querySelectorAll("#q-mode button").forEach(b => b.addEventListener("click", () => { mode = b.dataset.m; document.querySelectorAll("#q-mode button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); draw() }));
    document.getElementById("q-bits").addEventListener("input", e => { bits = +e.target.value; draw() });
    draw();
  }

  /* ================= paper 3: on-edge ViTs ================= */
  const ec = document.getElementById("edge");
  if (ec) {
    const W = 520, H = 250, g = fit(ec, W, H);
    const models = [["MobileViT_V2_175", 27.47, 0.9534, 677.2, C1], ["MobileViT_V2_050", 2.89, 0.9033, 80.8, C0]];
    const draw = t => {
      g.clearRect(0, 0, W, H); g.font = FONT;
      g.fillStyle = MUTED; g.fillText("model size (MB)", 0, 14); g.fillText("CPU inference: first to finish", 0, 130);
      models.forEach(([n, mb, f1, ms, col], i) => {
        g.font = FONT; const LX = g.measureText("V2_175 ").width + 6, BW = W - LX - g.measureText("27.47 MB · F1 0.9534").width - 14, y = 26 + i * 40, bw = BW * mb / 27.47 * Math.min(1, t * 1.5);
        g.fillStyle = LINE; g.fillRect(LX, y, BW, 18); g.fillStyle = col; g.fillRect(LX, y, bw, 18);
        g.fillStyle = INK; g.fillText(n.replace("MobileViT_", ""), 0, y + 13); g.fillStyle = MUTED; g.fillText(`${mb} MB · F1 ${f1}`, LX + BW + 8, y + 13);
        // Bar length = inference time, so the gap between 81 ms and 677 ms stays visible at rest.
        const ry = 142 + i * 40, RW = W - LX - g.measureText("✓ 677.2 ms").width - 14, elapsed = t * 700, len = ms / 677.2, p = Math.min(elapsed, ms) / 677.2;
        g.fillStyle = col; g.fillRect(LX, ry, RW * p, 18);
        g.fillStyle = INK; g.fillText(n.replace("MobileViT_", ""), 0, ry + 13);
        if (elapsed >= ms) { g.fillStyle = col; g.fillText(`✓ ${ms} ms`, LX + RW * len + 6, ry + 13) }
      });
    };
    draw(LK.reduce ? 1 : 0);
    LK.whenVisible(ec, () => { if (LK.reduce) return; const t0 = performance.now(); const f = now => { const t = Math.min(1, (now - t0) / 2600); draw(t); if (t < 1) requestAnimationFrame(f) }; requestAnimationFrame(f) });
  }

  /* ================= paper 4: leak detection network ================= */
  const lc = document.getElementById("leak");
  if (lc) {
    const W = 520, H = 260, g = fit(lc, W, H); seed = 23;
    const nodes = Array.from({ length: 13 }, (_, i) => ({ x: 40 + (i % 5) * 108 + (rnd() - .5) * 46, y: Math.min(H - 44, 36 + Math.floor(i / 5) * 86 + (rnd() - .5) * 30) }));
    const edges = []; nodes.forEach((a, i) => nodes.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y)]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2).forEach(([j]) => { if (!edges.some(([p, q]) => (p === j && q === i))) edges.push([i, j]) }));
    let leak = 7, tick = 0;
    const draw = () => {
      g.clearRect(0, 0, W, H);
      edges.forEach(([a, b]) => { g.strokeStyle = "#24304a"; g.lineWidth = 3; g.beginPath(); g.moveTo(nodes[a].x, nodes[a].y); g.lineTo(nodes[b].x, nodes[b].y); g.stroke() });
      edges.forEach(([a, b], k) => { const p = ((tick / 90) + k * .17) % 1; const x = nodes[a].x + (nodes[b].x - nodes[a].x) * p, y = nodes[a].y + (nodes[b].y - nodes[a].y) * p; g.fillStyle = C0; g.globalAlpha = .7; g.beginPath(); g.arc(x, y, 2.2, 0, 6.283); g.fill(); g.globalAlpha = 1 });
      nodes.forEach((n, i) => {
        const isLeak = i === leak && (tick % 240) > 80;
        g.fillStyle = isLeak ? C3 : "#0e1320"; g.strokeStyle = isLeak ? C3 : C0; g.lineWidth = 2; g.beginPath(); g.arc(n.x, n.y, 8, 0, 6.283); g.fill(); g.stroke();
        if (isLeak) { const r = 8 + ((tick % 40) / 40) * 22; g.strokeStyle = `rgba(255,122,166,${1 - (tick % 40) / 40})`; g.beginPath(); g.arc(n.x, n.y, r, 0, 6.283); g.stroke(); g.fillStyle = C3; g.font = FONT; const tw = g.measureText("leak flagged").width; g.fillText("leak flagged", Math.max(4, Math.min(n.x + 14, W - tw - 6)), Math.max(FS + 2, n.y - 12)) }
      });
      g.fillStyle = MUTED; g.font = FONT; g.fillText("pressure · flow · chlorine sensors", 10, H - 3);
      tick++; if ((tick % 240) === 0) leak = Math.floor(rnd() * 13);
    };
    draw();
    if (LK.reduce) { tick = 120; draw() } else LK.loop(lc, draw);
  }

  /* ================= Kaprekar playground ================= */
  const kf = document.getElementById("kap-form");
  if (kf) {
    const inp = document.getElementById("kap"), out = document.getElementById("kap-steps");
    let runId = 0;
    const run = async () => {
      const id = ++runId;
      const s = inp.value.replace(/\D/g, "").padStart(4, "0").slice(0, 4); inp.value = s;
      out.innerHTML = "";
      if (new Set(s).size < 2) { out.innerHTML = '<div class="on">all four digits are the same, so it collapses to 0000. pick another.</div>'; return }
      let n = s, step = 0;
      while (n !== "6174" && step < 8) {
        const d = n.split("").sort(), asc = d.join(""), desc = d.slice().reverse().join(""), next = String(+desc - +asc).padStart(4, "0");
        step++;
        const row = document.createElement("div"); row.innerHTML = `<span class="note">${step}.</span> ${desc} − ${asc} = <b>${next}</b>`; out.appendChild(row);
        await new Promise(r => setTimeout(r, LK.reduce ? 0 : 330)); if (id !== runId) return; row.classList.add("on"); n = next;
      }
      const fin = document.createElement("div"); fin.className = "fix";
      fin.textContent = step === 0 ? "already at 6174, Kaprekar's constant." : `reached 6174 in ${step} step${step > 1 ? "s" : ""}. it never needs more than 7.`;
      out.appendChild(fin); await new Promise(r => setTimeout(r, 60)); fin.classList.add("on");
    };
    kf.addEventListener("submit", e => { e.preventDefault(); run() });
    document.getElementById("kap-rand").addEventListener("click", () => { let s; do { s = String(Math.floor(Math.random() * 10000)).padStart(4, "0") } while (new Set(s).size < 2); inp.value = s; run() });
    LK.whenVisible(kf, run);
  }
})();
