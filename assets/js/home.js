// Home: tiny live visuals on the three portal cards.
(() => {
  const draw = {
    // An agent loop: a dot orbiting think -> tool -> observe.
    loop(c) {
      const { g, w, h } = LK.canvas(c, 120); const cx = w / 2, cy = h / 2, r = Math.min(38, h / 2 - 22);
      const labels = ["plan", "tool", "observe", "answer"];
      let a = 0;
      const f = () => {
        g.clearRect(0, 0, w, h);
        g.strokeStyle = "#1d2638"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.stroke();
        labels.forEach((l, i) => { const t = i / 4 * 6.283 - 1.571, x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r;
          g.fillStyle = "#0e1320"; g.beginPath(); g.arc(x, y, 5, 0, 6.283); g.fill(); g.strokeStyle = "#7cf3d0"; g.stroke();
          g.fillStyle = "#8b93a7"; g.font = "11px JetBrains Mono, monospace"; g.textAlign = Math.cos(t) > .3 ? "left" : Math.cos(t) < -.3 ? "right" : "center";
          g.fillText(l, x + Math.cos(t) * 12, y + Math.sin(t) * 14 + 4) });
        const x = cx + Math.cos(a - 1.571) * r, y = cy + Math.sin(a - 1.571) * r;
        g.fillStyle = "#7cf3d0"; g.shadowColor = "#7cf3d0"; g.shadowBlur = 12; g.beginPath(); g.arc(x, y, 4, 0, 6.283); g.fill(); g.shadowBlur = 0;
        a += 0.025;
      }; LK.loop(c, f);
    },
    // Fuzziness decaying over epochs.
    decay(c) {
      const { g, w, h } = LK.canvas(c, 120);
      LK.tween(1800, t => { g.clearRect(0, 0, w, h); g.strokeStyle = "#1d2638"; g.beginPath(); g.moveTo(0, h - 10); g.lineTo(w, h - 10); g.stroke();
        g.strokeStyle = "#a99cff"; g.lineWidth = 2.5; g.beginPath();
        for (let i = 0; i <= 60 * t; i++) { const x = i / 60 * w, y = 12 + (h - 30) * Math.exp(-i / 14); i ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke();
        g.fillStyle = "#8b93a7"; g.font = "11px JetBrains Mono, monospace"; g.textAlign = "right"; g.fillText("fuzziness D vs epochs", w - 6, 14); g.textAlign = "left" });
    },
    // Three audiences: kids, students, colleagues.
    dots(c) {
      const { g, w, h } = LK.canvas(c, 120); const groups = [["kids", 22], ["students", 34], ["colleagues", 16]]; const gw = w / 3;
      LK.tween(1500, t => { g.clearRect(0, 0, w, h);
        groups.forEach(([l, n], k) => { for (let i = 0; i < Math.round(n * t); i++) { const x = k * gw + 14 + (i % 6) * 12, y = 14 + Math.floor(i / 6) * 12;
          g.fillStyle = "#ffb86b"; g.globalAlpha = .45 + .55 * (i % 3) / 2; g.beginPath(); g.arc(x, y, 3.5, 0, 6.283); g.fill() }
          g.globalAlpha = 1; g.fillStyle = "#8b93a7"; g.font = "11px JetBrains Mono, monospace"; g.fillText(l, k * gw + 10, h - 6) }) });
    },
  };
  document.querySelectorAll("canvas[data-mini]").forEach(c => LK.whenVisible(c, () => draw[c.dataset.mini](c), 0.2));
})();
