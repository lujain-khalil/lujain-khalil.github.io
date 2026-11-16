// Teaching page: audience mini-visuals and the course map's prerequisite wires.
(() => {
  const C0 = "#7cf3d0", C1 = "#a99cff", C2 = "#ffb86b", LINE = "#1d2638";

  /* audiences */
  const aud = {
    // Kids: lots of small, bouncy dots.
    kids(c) {
      const { g, w, h } = LK.canvas(c, 70); const dots = Array.from({ length: 36 }, (_, i) => ({ x: 8 + (i % 18) * (w - 16) / 17, y: 20 + Math.floor(i / 18) * 26, p: Math.random() * 6.28 }));
      let t = 0; LK.loop(c, () => { g.clearRect(0, 0, w, h); dots.forEach(d => { g.fillStyle = C2; g.beginPath(); g.arc(d.x, d.y + Math.sin(t + d.p) * 4, 3.4, 0, 6.283); g.fill() }); t += 0.06 });
    },
    // University: eight course nodes on a line, lighting up in turn.
    uni(c) {
      const { g, w, h } = LK.canvas(c, 70); const n = 8, xs = Array.from({ length: n }, (_, i) => 14 + i * (w - 28) / (n - 1));
      LK.tween(1600, t => { g.clearRect(0, 0, w, h); g.strokeStyle = LINE; g.lineWidth = 2; g.beginPath(); g.moveTo(xs[0], 35); g.lineTo(xs[n - 1], 35); g.stroke();
        g.strokeStyle = C2; g.beginPath(); g.moveTo(xs[0], 35); g.lineTo(xs[0] + (xs[n - 1] - xs[0]) * t, 35); g.stroke();
        xs.forEach((x, i) => { const on = t >= i / (n - 1) - 0.001; g.fillStyle = on ? C2 : "#0e1320"; g.strokeStyle = C2; g.beginPath(); g.arc(x, 35, 7, 0, 6.283); g.fill(); g.stroke() }) });
    },
    // Work: a pulse spreading out from one trainer to a room.
    work(c) {
      const { g, w, h } = LK.canvas(c, 70); const cx = w / 2, cy = 35; const ppl = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.283; return [cx + Math.cos(a) * (w * 0.38), cy + Math.sin(a) * 24] });
      let t = 0; LK.loop(c, () => { g.clearRect(0, 0, w, h); const r = (t % 1) * w * 0.42;
        g.strokeStyle = `rgba(255,184,107,${1 - (t % 1)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, r, r * 0.63, 0, 0, 6.283); g.stroke();
        ppl.forEach(([x, y]) => { const lit = Math.hypot((x - cx) / 1, (y - cy) / 0.63) < r; g.fillStyle = lit ? C2 : "#3a3020"; g.beginPath(); g.arc(x, y, 3.4, 0, 6.283); g.fill() });
        g.fillStyle = C2; g.beginPath(); g.arc(cx, cy, 5, 0, 6.283); g.fill(); t += 0.008 });
    },
  };
  document.querySelectorAll("canvas[data-aud]").forEach(c => LK.whenVisible(c, () => aud[c.dataset.aud](c), 0.2));

  /* course map: draw the learning path between courses */
  const wrap = document.querySelector(".coursewrap");
  if (!wrap) return;
  const EDGES = [["p1", "p2", C2], ["p2", "dsa", C2], ["p2", "web", C2], ["dig", "sys", C1], ["p2", "mob", C0], ["ai", "mob", C0]];
  let svg;
  function draw() {
    if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "cwires"); svg.setAttribute("aria-hidden", "true"); wrap.prepend(svg) }
    const box = wrap.getBoundingClientRect(); svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`); svg.innerHTML = "";
    const r = id => wrap.querySelector(`[data-c="${id}"]`).getBoundingClientRect();
    EDGES.forEach(([a, b, col]) => {
      const A = r(a), B = r(b);
      const x1 = A.left + A.width / 2 - box.left, y1 = A.top + A.height / 2 - box.top, x2 = B.left + B.width / 2 - box.left, y2 = B.top + B.height / 2 - box.top;
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const mx = (x1 + x2) / 2;
      p.setAttribute("d", `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`); p.setAttribute("class", "cwire"); p.setAttribute("stroke", col);
      p.setAttribute("stroke-dasharray", "5 6"); svg.appendChild(p);
    });
  }
  draw(); let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 120) }); document.fonts?.ready.then(draw);
})();
