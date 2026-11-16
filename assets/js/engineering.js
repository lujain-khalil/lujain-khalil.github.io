// AI Engineering page: number visuals, the architecture explorer with live wires, and a sample agent trace.
(() => {
  const C0 = "#7cf3d0", C1 = "#a99cff", C2 = "#ffb86b", C3 = "#ff7aa6", LINE = "#1d2638", MUTED = "#8b93a7";

  /* ---------- number visuals ---------- */
  const viz = {
    // ~1,300 weekly users: one dot per user, lighting up.
    users(c) {
      const { g, w, h } = LK.canvas(c, 96); const n = +c.dataset.n || 1300, cols = Math.floor(w / 4.2), size = 2.2;
      const pts = Array.from({ length: n }, (_, i) => [(i % cols) * (w / cols) + 1, Math.floor(i / cols) * 4.4 + 2]).filter(p => p[1] < h);
      const order = pts.map((_, i) => i).sort(() => Math.random() - .5);
      LK.tween(1600, t => { g.clearRect(0, 0, w, h); const k = Math.floor(t * pts.length);
        pts.forEach(([x, y], i) => { g.fillStyle = LINE; g.fillRect(x, y, size, size) });
        for (let j = 0; j < k; j++) { const [x, y] = pts[order[j]]; g.fillStyle = C0; g.fillRect(x, y, size, size) } });
    },
    // 88% cache hit: ring.
    ring(c, pct, col) {
      const { g, w, h } = LK.canvas(c, 96); const r = 38, cx = 46, cy = h / 2;
      LK.tween(1400, t => { g.clearRect(0, 0, w, h); g.lineWidth = 10; g.lineCap = "round";
        g.strokeStyle = LINE; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.stroke();
        g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, r, -1.571, -1.571 + 6.283 * pct * t); g.stroke();
        g.fillStyle = MUTED; g.font = "12px JetBrains Mono, monospace";
        g.fillText("cached", 104, cy - 6); g.fillStyle = col; g.fillText("■ hit " + Math.round(pct * 100 * t) + "%", 104, cy + 12); });
    },
    // 75% lower input cost: a bar shrinking from 100 to 25.
    shrink(c) {
      const { g, w, h } = LK.canvas(c, 96);
      LK.tween(1500, t => { g.clearRect(0, 0, w, h); g.font = "12px JetBrains Mono, monospace";
        g.fillStyle = "rgba(139,147,167,.45)"; g.fillRect(0, 22, w, 18); g.fillStyle = MUTED; g.fillText("uncached input cost", 0, 14);
        const bw = w * (1 - (+c.dataset.cut) * t); g.fillStyle = C3; g.fillRect(0, 62, bw, 18); g.fillStyle = MUTED; g.fillText("with caching + context engineering", 0, 56); });
    },
    // 40% faster time to first token: a race.
    // Bar length = time to first token; "after" is 40% shorter, so it lands first.
    race(c) {
      const { g, w, h } = LK.canvas(c, 96); const full = w - 60;
      LK.tween(2200, t => { g.clearRect(0, 0, w, h); g.font = "12px JetBrains Mono, monospace";
        [["before", 1, MUTED, 22], ["after", 1 - (+c.dataset.faster), C0, 64]].forEach(([l, len, col, y]) => {
          const p = Math.min(t, len); g.fillStyle = col; g.fillRect(56, y, full * p, 12);
          g.fillStyle = MUTED; g.fillText(l, 0, y + 11);
          if (t >= len) { g.fillStyle = col; g.fillRect(56 + full * len - 2, y - 6, 2, 24); g.fillText("1st token", Math.min(56 + full * len + 6, w - 70), y - 4) } }); });
    },
    // 30% weekly usage growth: a rising line.
    grow(c) {
      const { g, w, h } = LK.canvas(c, 96); const pts = [], n = 24;
      const gr = +c.dataset.growth;
      for (let i = 0; i < n; i++) { const base = i < 12 ? 1 : 1 + gr * ((i - 11) / (n - 12)); pts.push(base + Math.sin(i * 1.7) * 0.025) }
      const y = v => h - 12 - (v - 0.9) / (gr + 0.2) * (h - 24);
      LK.tween(1600, t => { g.clearRect(0, 0, w, h); const k = Math.max(2, Math.floor(n * t));
        g.strokeStyle = LINE; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(0, y(1)); g.lineTo(w, y(1)); g.stroke(); g.setLineDash([]);
        g.strokeStyle = C1; g.lineWidth = 2.5; g.beginPath(); pts.slice(0, k).forEach((v, i) => { const x = i / (n - 1) * w; i ? g.lineTo(x, y(v)) : g.moveTo(x, y(v)) }); g.stroke();
        g.fillStyle = MUTED; g.font = "12px JetBrains Mono, monospace"; g.fillText("launch", w / 2 - 20, h - 2); });
    },
    // 35% fewer failed turns: a grid of failures fading out.
    fails(c) {
      const { g, w, h } = LK.canvas(c, 96); const cols = 20, rows = 5, cw = w / cols, ch = h / rows, N = 20, fixed = Math.round(N * (+c.dataset.cut));
      const failIdx = Array.from({ length: cols * rows }, (_, i) => i).sort(() => Math.random() - .5).slice(0, N);
      LK.tween(1600, t => { g.clearRect(0, 0, w, h);
        for (let i = 0; i < cols * rows; i++) { const x = (i % cols) * cw, y = Math.floor(i / cols) * ch; const fi = failIdx.indexOf(i);
          const fixedNow = fi >= 0 && fi < fixed && t > fi / fixed * 0.9;
          if (fixedNow) { g.fillStyle = "#16304a"; g.fillRect(x + 2, y + 2, cw - 4, ch - 4); g.strokeStyle = C0; g.lineWidth = 1.5; g.strokeRect(x + 2.5, y + 2.5, cw - 5, ch - 5) }
          else { g.fillStyle = fi >= 0 ? C3 : "#16304a"; g.fillRect(x + 2, y + 2, cw - 4, ch - 4) } } });
    },
  };
  document.querySelectorAll("[data-viz]").forEach(c => LK.whenVisible(c, () => {
    const k = c.dataset.viz;
    if (k === "ring") viz.ring(c, +c.dataset.pct, C0); else viz[k](c);
  }));

  /* ---------- architecture explorer ---------- */
  const nodes = [...document.querySelectorAll(".node[data-node]")];
  function select(id, focusPanel) {
    nodes.forEach(n => n.setAttribute("aria-pressed", String(n.dataset.node === id)));
    document.querySelectorAll(".node-detail").forEach(d => d.classList.toggle("active", d.id === "node-" + id));
    if (focusPanel && innerWidth < 900) document.getElementById("node-" + id)?.scrollIntoView({ behavior: LK.reduce ? "auto" : "smooth", block: "nearest" });
  }
  const diagram = document.querySelector(".arch-diagram");
  const EDGES = [["users", "guardrails"], ["guardrails", "harness"], ["harness", "mcp"], ["harness", "rag"], ["harness", "memory"], ["harness", "sandbox"],
    ["harness", "models"], ["control", "harness", 1], ["evals", "harness", 1]];
  const PATH = { users: [0], guardrails: [0, 1], harness: [0, 1], mcp: [0, 1, 2], rag: [0, 1, 3], memory: [0, 1, 4], sandbox: [0, 1, 5], models: [0, 1, 6], control: [7], evals: [8] };
  let svg, wires = [], current = "harness";
  function drawWires() {
    if (!diagram) return;
    if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "arch-wires"); svg.setAttribute("aria-hidden", "true"); diagram.prepend(svg) }
    const box = diagram.getBoundingClientRect(), el = id => diagram.querySelector(`[data-node="${id}"]`).getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`); svg.innerHTML = "";
    wires = EDGES.map(([a, b, dashed]) => {
      const A = el(a), B = el(b);
      if (dashed && A.left <= B.right - 4 && A.top > B.bottom) return null;
      let d;
      if (dashed && A.left > B.right - 4) {
        const x1 = A.left - box.left, y1 = A.top + A.height / 2 - box.top, x2 = B.right - box.left, y2 = B.top + B.height / 2 - box.top, mx = (x1 + x2) / 2;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      } else {
        const y1 = (A.bottom > B.top + 2 ? A.top : A.bottom) - box.top;
        const x2 = B.left + B.width / 2 - box.left, y2 = (A.bottom > B.top + 2 ? B.bottom : B.top) - box.top;
        const sx = A.left + A.width / 2 - box.left, my = (y1 + y2) / 2;
        d = `M${sx},${y1} C${sx},${my} ${x2},${my} ${x2},${y2}`;
        if (a === "harness" && b !== "models" && B.top - A.bottom > 60 && (B.right - box.left < sx || B.left - box.left > sx)) {
          const yb = B.top + B.height / 2 - box.top, ex = B.right - box.left < sx ? B.right - box.left : B.left - box.left, dir = ex < sx ? -1 : 1;
          d = `M${sx},${y1} L${sx},${yb - 8} Q${sx},${yb} ${sx + dir * 8},${yb} L${ex},${yb}`;
        }
      }
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d); p.setAttribute("class", "wire" + (dashed ? " dashed" : "")); svg.appendChild(p); return p;
    });
    heat(current);
  }
  function heat(id) { current = id; wires.forEach((w, i) => w && w.classList.toggle("hot", (PATH[id] || []).includes(i))) }
  nodes.forEach(n => n.addEventListener("click", () => { select(n.dataset.node, true); heat(n.dataset.node) }));
  document.querySelectorAll(".cap[data-go]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.go; select(id, false); heat(id);
    document.querySelector(".arch").scrollIntoView({ behavior: LK.reduce ? "auto" : "smooth", block: "start" });
  }));
  if (nodes.length) { select("harness", false); drawWires() }
  let wt; addEventListener("resize", () => { clearTimeout(wt); wt = setTimeout(drawWires, 120) });
  document.fonts?.ready.then(drawWires);

  /* ---------- sample agent trace ---------- */
  const trace = document.getElementById("trace");
  if (trace) {
    const rows = [...trace.querySelectorAll(".row")];
    let run = 0;
    const play = async () => { const id = ++run; for (const r of rows) { if (id !== run) return; r.classList.add("on"); await new Promise(res => setTimeout(res, LK.reduce ? 0 : 420)) } };
    LK.whenVisible(trace, play);
    document.getElementById("replay")?.addEventListener("click", () => { run++; rows.forEach(r => r.classList.remove("on")); setTimeout(play, 200) });
  }
})();
