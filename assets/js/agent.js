// lujain-agent terminal: a live Claude Haiku agent (via the Cloudflare Worker in LK_AGENT_URL),
// with shell-style commands and a scripted offline fallback. Mounts on every [data-agent] element
// and on a global drawer opened with the launcher button or the "/" key.
(() => {
  const ROOT = document.body.dataset.root || "./";
  const URL_ = (window.LK_AGENT_URL || "").replace(/\/+$/, "");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const KEY = "lk-agent-v1";
  const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const PAGES = { home: "", engineering: "engineering/", research: "research/", teaching: "teaching/" };

  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(KEY) || "[]") } catch {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-12))) } catch {} };
  let live = !!URL_;

  const CHIPS = [
    "who is lujain?",
    "what does she build?",
    "explain her thesis like I'm five",
    "what's the coolest paper?",
    "what does she do for fun?",
    "how do I reach her?",
  ];

  // ---------- offline fallback (scripted, from the site's own content) ----------
  const OFFLINE = [
    [/\b(build|builds|engineer\w*|agents?|rag|harness|emaar|work|ship\w*)\b/, "She leads the revamp of an enterprise agent platform used by about 1,300 people a week: a provider-neutral streaming agent loop, RAG and text-to-SQL analysts, long-term memory, MCP connectors, guardrails, sandboxed code execution and an LLM-as-a-judge eval harness. Full tour: /engineering"],
    [/\b(thesis|fuzz\w*|separab\w*|five)\b/, "Imagine sorting coloured marbles that start all mixed up. As a network trains, marbles of the same colour huddle together and the colours drift apart. Her thesis measures that with one number, separation fuzziness D = Tr(SSw SSb+), and works out when it has to shrink. Play with it: /research"],
    [/\b(papers?|research\w*|publications?|scholar)\b/, "Four papers: class separation dynamics in vision transformers (IEEE Access), optimal-transport quantization for flow matching (arXiv), on-edge ViTs for medical images (Applied Sciences) and spatial ML for water leak detection (Applied Sciences). /research"],
    [/\b(fun|hobb\w*|outside|free time|guitar|horse\w*|gym|read\w*)\b/, "Off the clock: reading, the gym, horse riding and guitar. Also, she will absolutely get nerd-sniped by a maths problem."],
    [/\b(teach\w*|ta|kids|courses?|literacy)\b/, "Eight university courses as a graduate TA, two years teaching kids to code (including a camp with the Museum of the Future), and AI literacy sessions for colleagues. /teaching"],
    [/\b(contact|email|reach|hire|linkedin|cv|resume)\b/, "Email: lujain.osama.4@gmail.com · linkedin.com/in/lujain-khalil · github.com/lujain-khalil. Type `cat cv` to grab the CV."],
  [/\b(who|herself|introduce|hello|hi|hey)\b/, "Lujain Khalil: AI engineer in Sharjah, UAE. She builds production LLM agents (harnesses, RAG, memory, MCP, guardrails, evals) and researches how neural networks learn to separate classes. M.Sc. in Machine Learning, four papers, and a habit of teaching everyone around her."],
  ];
  const offline = q => (OFFLINE.find(([re]) => re.test(q.toLowerCase())) || [0, "I'm running in offline mode, so I only know the basics. Try `help`, or ask about her work, research, teaching or hobbies."])[1];

  // ---------- rendering ----------
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // One pass over the raw text: URLs, emails and /page links become anchors; everything else is escaped.
  const TOKEN = /(https?:\/\/[^\s<>"')]+)|([\w.+-]+@[\w-]+\.[\w.]+)|((?:^|(?<=\s))\/(?:engineering|research|teaching)\b)/g;
  const linkify = s => {
    let out = "", last = 0, m;
    while ((m = TOKEN.exec(s))) {
      out += esc(s.slice(last, m.index));
      const t = m[0];
      if (m[1]) out += `<a href="${esc(t)}" target="_blank" rel="noopener">${esc(t)}</a>`;
      else if (m[2]) out += `<a href="mailto:${esc(t)}">${esc(t)}</a>`;
      else out += `<a href="${ROOT}${PAGES[t.slice(1)]}">${esc(t)}</a>`;
      last = m.index + t.length;
    }
    return out + esc(s.slice(last));
  };

  const terms = [];
  function line(t, cls, text, html) {
    const p = document.createElement("p"); p.className = cls;
    if (html != null) p.innerHTML = html; else p.textContent = text || "";
    t.log.appendChild(p); t.log.scrollTop = t.log.scrollHeight; return p;
  }
  const all = (cls, text, html) => terms.map(t => line(t, cls, text, html));

  const BANNER = [
    "╭────────────────────────────────────╮",
    "│  ▞▚  lujain-agent  v1.0            │",
    "│  ▚▞  knows everything about lujain │",
    "╰────────────────────────────────────╯",
  ].join("\n");

  function boot(t) {
    t.log.innerHTML = "";
    const a = document.createElement("pre"); a.className = "ascii"; a.textContent = BANNER; a.setAttribute("aria-hidden", "true"); t.log.appendChild(a);
    line(t, "t-dim", live ? "model: claude-haiku-5-5 · kb: cvs, papers, thesis, github" : "mode: offline (scripted) · live agent not connected");
    line(t, "t-dim", "type a question, or `help` for commands");
    history.forEach(m => m.role === "user" ? line(t, "t-you", "› " + m.content) : line(t, "t-say", null, linkify(m.content)));
    line(t, "t-dim", " ");
  }

  // ---------- commands ----------
  const HELP = [
    "help            this list",
    "ls              pages on this site",
    "cd <page>       engineering, research, teaching, ~",
    "cat cv          download the CV",
    "whoami          who you are talking to",
    "clear           wipe the screen and memory",
    "anything else   ask the agent",
  ].join("\n");
  function command(q) {
    const [cmd, ...rest] = q.trim().split(/\s+/); const arg = (rest[0] || "").toLowerCase().replace(/\/$/, "");
    switch (cmd.toLowerCase()) {
      case "help": all("t-dim", HELP); return true;
      case "ls": all("t-ok", "home/  engineering/  research/  teaching/  cv.pdf"); return true;
      case "cd":
        if (arg in PAGES || arg === "~" || arg === "") { try { if (drawer.classList.contains("open")) sessionStorage.setItem("lk-drawer", "1") } catch {} location.href = ROOT + PAGES[arg in PAGES ? arg : "home"]; return true }
        all("t-err", `cd: no such page: ${arg}`); return true;
      case "cat":
        if (/cv/.test(arg)) { const a = document.createElement("a"); a.href = ROOT + "cv/Lujain-Khalil-CV.pdf"; a.download = ""; a.click(); all("t-ok", "✓ downloading cv.pdf"); return true }
        all("t-err", `cat: ${arg || "?"}: try \`cat cv\``); return true;
      case "whoami": all("t-say", "a curious visitor with excellent taste in portfolios"); return true;
      case "clear": history = []; save(); terms.forEach(boot); return true;
      case "sudo": all("t-say", "nice try. permission denied, but you can always email her."); return true;
      case "exit": closeDrawer(); return true;
    }
    return false;
  }

  // ---------- asking ----------
  let busy = false;
  function setBusy(v) { busy = v; terms.forEach(t => { t.form.querySelector("button").disabled = v; t.chips.querySelectorAll("button").forEach(b => b.disabled = v) }) }

  async function ask(q) {
    q = q.trim().slice(0, 600); if (!q || busy) return;
    all("t-you", "› " + q);
    if (command(q)) { all("t-dim", " "); return }
    setBusy(true);
    history.push({ role: "user", content: q });
    const t0 = performance.now();
    all("t-tool", live ? "→ claude-haiku-5-5 · reading kb" : "→ offline script");
    const outs = all("t-say caret", "");
    let text = "";
    const write = () => outs.forEach(o => { o.textContent = text; o.parentElement.scrollTop = o.parentElement.scrollHeight });
    try {
      if (!live) throw new Error("offline");
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 30000);
      let finished = false;
      const res = await fetch(URL_ + "/chat", { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12) }) });
      if (res.status === 429) { const j = await res.json().catch(() => ({})); throw Object.assign(new Error("rate"), { msg: j.message }) }
      if (!res.ok || !res.body) throw new Error("http " + res.status);
      const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
      try { for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
          const data = chunk.replace(/^data: /, ""); if (!data) continue;
          let ev; try { ev = JSON.parse(data) } catch { continue }
          if (ev.t) { text += ev.t; write() }
          if (ev.done) finished = true;
          if (ev.error) throw Object.assign(new Error("agent"), { msg: ev.error });
        }
      } } finally { clearTimeout(timer); reader.cancel().catch(() => {}) }
      if (!finished) throw Object.assign(new Error("agent"), { msg: "the connection dropped mid-answer. try again?" });
      if (!text.trim()) throw Object.assign(new Error("agent"), { msg: "I came back empty-handed. try asking another way?" });
    } catch (e) {
      if (e.message === "rate" || e.message === "agent") { text = (text ? text + "\n" : "") + "[" + (e.msg || "something glitched. try again in a moment.") + "]" }
      else if (live && text) { text += "\n[the connection dropped. try again?]" }
      else {
        // Network trouble: answer from the offline script this time, and retry live on the next question.
        if (live && e.message !== "offline") all("t-err", "! live agent unreachable, answering offline for now");
        text = "";
        for (const w of offline(q).split(/(\s+)/)) { text += w; write(); await sleep(14) }
      }
      write();
    }
    outs.forEach(o => { o.classList.remove("caret"); o.innerHTML = linkify(text) });
    history.push({ role: "assistant", content: text }); save();
    all("t-ok", `✓ ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    all("t-dim", " ");
    setBusy(false);
  }

  // ---------- mounting ----------
  function mount(el, { closable } = {}) {
    el.classList.add("term");
    el.innerHTML = `
      <div class="term-bar"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><span class="ttl">lujain-agent: ~/</span>
        <span class="stat"><i class="led"></i><span class="st"></span></span>${closable ? '<button class="x" type="button" aria-label="Close terminal">×</button>' : ""}</div>
      <div class="term-log" role="log" aria-live="polite" aria-label="Agent conversation"></div>
      <div class="term-chips"></div>
      <form class="term-input" autocomplete="off"><span aria-hidden="true">❯</span>
        <label class="sr-only">Ask lujain-agent</label><input type="text" maxlength="600" placeholder="ask me anything about lujain, or type help" aria-label="Ask lujain-agent">
        <button type="submit">run</button></form>`;
    const t = { el, log: el.querySelector(".term-log"), chips: el.querySelector(".term-chips"), form: el.querySelector("form") };
    t.setStatus = () => { el.querySelector(".led").classList.toggle("live", live); el.querySelector(".st").textContent = live ? "live · haiku" : "offline · scripted" };
    t.setStatus();
    CHIPS.forEach(c => { const b = document.createElement("button"); b.type = "button"; b.textContent = c; b.onclick = () => ask(c); t.chips.appendChild(b) });
    t.form.onsubmit = e => { e.preventDefault(); const i = t.form.querySelector("input"); const q = i.value; i.value = ""; ask(q) };
    const x = el.querySelector(".x"); if (x) x.onclick = closeDrawer;
    terms.push(t); boot(t); return t;
  }

  document.querySelectorAll("[data-agent]").forEach(el => mount(el));

  // global drawer + launcher
  const drawer = document.createElement("div"); drawer.className = "drawer"; drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-label", "lujain-agent terminal");
  const inner = document.createElement("div"); drawer.appendChild(inner); document.body.appendChild(drawer);
  let dt = null, opener = null;
  const launcher = document.createElement("button"); launcher.type = "button"; launcher.className = "launcher"; launcher.innerHTML = '❯<span class="lt"> ask lujain-agent</span>'; launcher.setAttribute("aria-label", "Ask lujain-agent");
  document.body.appendChild(launcher);
  function openDrawer() {
    const home = document.querySelector("[data-agent]");
    if (home) { home.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); home.querySelector("input").focus({ preventScroll: true }); return }
    opener = document.activeElement;
    if (!dt) dt = mount(inner, { closable: true });
    drawer.classList.add("open"); launcher.style.display = "none"; dt.form.querySelector("input").focus();
  }
  function closeDrawer() { drawer.classList.remove("open"); launcher.style.display = ""; (opener && opener !== document.body ? opener : launcher).focus() }
  launcher.onclick = openDrawer;
  document.querySelectorAll("[data-open-agent]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); openDrawer() }));
  addEventListener("keydown", e => {
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName || "");
    if (e.key === "/" && !typing) { e.preventDefault(); openDrawer() }
    if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
  });
  try { if (sessionStorage.getItem("lk-drawer")) { sessionStorage.removeItem("lk-drawer"); if (!document.querySelector("[data-agent]")) openDrawer() } } catch {}
  // Hide the launcher while the embedded home terminal is on screen.
  const home = document.querySelector("[data-agent]");
  if (home && "IntersectionObserver" in window) new IntersectionObserver(([en]) => { if (!drawer.classList.contains("open")) launcher.style.display = en.isIntersecting ? "none" : "" }).observe(home);
})();
