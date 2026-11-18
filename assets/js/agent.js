// layla, the terminal agent: a live Claude Haiku agent (via the Cloudflare Worker in LK_AGENT_URL),
// with shell-style commands, /clear and /compact slash commands, and a scripted offline fallback.
// Mounts on every [data-agent] element and on a global drawer opened with the launcher button or the "/" key.
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
    "explain her thesis like i'm five",
    "what's the coolest paper?",
    "what does she do for fun?",
    "how do i reach her?",
  ];

  // ---------- offline fallback (scripted, from the site's own content) ----------
  const OFFLINE = [
    [/\b(build|builds|engineer\w*|agents?|rag|harness|emaar|work|ship\w*)\b/, "she leads the revamp of an enterprise agent platform used by about 1,300 people a week: a provider-neutral streaming agent loop, RAG and text-to-sql analysts, long-term memory, MCP connectors, guardrails, sandboxed code execution and an LLM-as-a-judge eval suite. full tour: /engineering"],
    [/\b(thesis|fuzz\w*|separab\w*|five)\b/, "imagine sorting coloured marbles that start all mixed up. as a network trains, marbles of the same colour huddle together and the colours drift apart. her thesis measures that with one number, separation fuzziness D = Tr(SSw SSb+), and works out when it has to shrink. play with it: /research"],
    [/\b(papers?|research\w*|publications?|scholar)\b/, "four papers: class separation dynamics in vision transformers (IEEE access), optimal-transport quantization for flow matching (arxiv), on-edge ViTs for medical images (applied sciences) and spatial ML for water leak detection (applied sciences). /research"],
    [/\b(fun|hobb\w*|outside|free time|guitar|horse\w*|gym|read\w*)\b/, "outside work she likes reading, the gym, horse riding and guitar. she also cannot leave a maths problem alone."],
    [/\b(teach\w*|ta|kids|courses?|literacy)\b/, "she was a graduate TA for eight university courses and taught kids to code for two years, including a camp with the museum of the future. she also runs AI literacy sessions for colleagues. /teaching"],
    [/\b(contact|email|reach|hire|linkedin|cv|resume)\b/, "email: lujain.osama.4@gmail.com · linkedin.com/in/lujain-khalil · github.com/lujain-khalil. type `cat cv` to grab the CV."],
  [/\b(who|herself|introduce|hello|hi|hey)\b/, "lujain khalil is an AI engineer in sharjah, UAE. she builds production LLM agents (agent loops, RAG, memory, MCP, guardrails, evals) and researches how neural networks learn to separate classes. she has an m.sc. in machine learning and four papers, and she teaches at university, at kids' camps and at work."],
  ];
  const offline = q => (OFFLINE.find(([re]) => re.test(q.toLowerCase())) || [0, "i'm running in offline mode, so i only know the basics. try /help, or ask about her work, research, teaching or hobbies."])[1];

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

  // layla as a 12x14 pixel sprite. H hair, h hair highlight, S skin, E eyes (they blink), B blush, M mouth,
  // C shirt, D shirt shade. Drawn as SVG rects so it stays crisp at any size.
  const SPRITE = [
    "...HHHHHH...",
    "..HHHHHHHH..",
    ".HHhHHHHHHH.",
    ".HHSSSSSSHH.",
    "HHSSSSSSSSHH",
    "HHSESSSSESHH",
    "HHSESSSSESHH",
    "HHBSSMMSSBHH",
    ".HHSSSSSSHH.",
    ".H..CCCC..H.",
    "...CCCCCCC..",
    "..CCCDDCCC..",
    "..SCCCCCCS..",
    "...CC..CC...",
  ];
  const PAL = { H: "#4b3b8f", h: "#a99cff", S: "#f6cfb0", E: "#0a0e17", B: "#ff7aa6", M: "#c2416b", C: "#7cf3d0", D: "#3fb79a" };
  const spriteSvg = () => {
    let body = "", eyes = "";
    SPRITE.forEach((row, y) => [...row].forEach((k, x) => {
      if (k === ".") return;
      const r = `<rect x="${x}" y="${y}" width="1" height="1" fill="${PAL[k]}"/>`;
      if (k === "E") eyes += r; else body += r;
    }));
    return `<svg class="layla-px" viewBox="-1 -2 14 17" width="56" height="68" shape-rendering="crispEdges" aria-hidden="true">
      <rect class="spark" x="12" y="-1" width="1" height="1" fill="#ffb86b"/><g class="bob">${body}<g class="eyes">${eyes}</g></g></svg>`;
  };

  function boot(t) {
    t.log.innerHTML = "";
    const hi = document.createElement("div"); hi.className = "layla-hi";
    hi.innerHTML = `${spriteSvg()}<div><p class="layla-name">layla</p><p class="t-dim">lujain's portfolio agent. ask me anything about her.</p><p class="t-dim">type a question, or /help for commands</p></div>`;
    t.log.appendChild(hi);
    history.forEach(m => {
      if (m.summary) { if (m.role === "user") line(t, "t-dim", "✻ earlier conversation, compacted: " + m.content.replace(SUMMARY_PREFIX, "")); return }
      m.role === "user" ? line(t, "t-you", "› " + m.content) : line(t, "t-say", null, linkify(m.content));
    });
    line(t, "t-dim", " ");
  }

  // ---------- commands ----------
  const SLASH = [
    ["/help", "show commands"],
    ["/clear", "clear the screen and the conversation"],
    ["/compact", "summarise the conversation to free up context"],
  ];
  const HELP = [
    "/help             this list",
    "/clear            clear the screen and the conversation",
    "/compact [focus]  summarise the conversation so far and continue from the summary",
    "ls                pages on this site",
    "cd <page>         engineering, research, teaching, ~",
    "cat cv            download the CV",
    "whoami            who you are talking to",
    "anything else     ask layla",
  ].join("\n");
  function command(q) {
    const [cmd, ...rest] = q.trim().split(/\s+/); const arg = (rest[0] || "").toLowerCase().replace(/\/$/, "");
    const c = cmd.toLowerCase();
    if (c.startsWith("/") && !["/help", "/clear", "/compact", "/exit"].includes(c)) { all("t-err", `unknown command: ${c}. try /help`); return true }
    switch (c.replace(/^\//, "")) {
      case "help": all("t-dim", HELP); return true;
      case "compact": compact(rest.join(" ")); return true;
      case "ls": all("t-ok", "home/  engineering/  research/  teaching/  cv.pdf"); return true;
      case "cd":
        if (arg in PAGES || arg === "~" || arg === "") { try { if (drawer.classList.contains("open")) sessionStorage.setItem("lk-drawer", "1") } catch {} location.href = ROOT + PAGES[arg in PAGES ? arg : "home"]; return true }
        all("t-err", `cd: no such page: ${arg}`); return true;
      case "cat":
        if (/cv/.test(arg)) { const a = document.createElement("a"); a.href = ROOT + "cv/Lujain-Khalil-CV.pdf"; a.download = ""; a.click(); all("t-ok", "✓ downloading cv.pdf"); return true }
        all("t-err", `cat: ${arg || "?"}: try \`cat cv\``); return true;
      case "whoami": all("t-say", "a curious visitor with excellent taste in portfolios"); return true;
      case "clear": history = []; save(); terms.forEach(boot); all("t-ok", "✓ conversation cleared"); return true;
      case "sudo": all("t-say", "nice try. permission denied, but you can always email her."); return true;
      case "exit": closeDrawer(); return true;
    }
    return false;
  }

  // ---------- asking ----------
  let busy = false;
  function setBusy(v) { busy = v; terms.forEach(t => { t.form.querySelector("button").disabled = v; t.chips.querySelectorAll("button").forEach(b => b.disabled = v) }) }

  // Streams one reply from the Worker. Calls onText(fullTextSoFar) as tokens arrive and returns the full text.
  // Only role and content go over the wire, so local flags such as `summary` never reach the Worker.
  async function streamChat(messages, onText = () => {}) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 30000);
    let text = "", finished = false;
    const body = JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) });
    const res = await fetch(URL_ + "/chat", { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json" }, body });
    if (res.status === 429) { clearTimeout(timer); const j = await res.json().catch(() => ({})); throw Object.assign(new Error("rate"), { msg: j.message }) }
    if (!res.ok || !res.body) { clearTimeout(timer); throw new Error("http " + res.status) }
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
    try { for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = chunk.replace(/^data: /, ""); if (!data) continue;
        let ev; try { ev = JSON.parse(data) } catch { continue }
        if (ev.t) { text += ev.t; onText(text) }
        if (ev.done) finished = true;
        if (ev.error) throw Object.assign(new Error("agent"), { msg: ev.error, partial: text });
      }
    } } finally { clearTimeout(timer); reader.cancel().catch(() => {}) }
    if (!finished) throw Object.assign(new Error("agent"), { msg: "the connection dropped mid-answer. try again?", partial: text });
    if (!text.trim()) throw Object.assign(new Error("agent"), { msg: "i came back empty-handed. try asking another way?" });
    return text;
  }

  // /compact, like the Claude CLI: summarise the conversation, then keep only the summary as context.
  const SUMMARY_PREFIX = "summary of our earlier conversation: ";
  async function compact(focus) {
    const turns = history.filter(m => !m.summary);
    if (turns.length < 2) { all("t-dim", "nothing to compact yet. ask layla something first."); return }
    setBusy(true);
    all("t-tool", "✻ compacting conversation…");
    const request = "summarise our conversation so far in 2 or 3 sentences, so you can continue from it later. reply with the summary only."
      + (focus ? ` focus on: ${focus}` : "");
    let summary = "";
    if (live) { try { summary = (await streamChat([...history.slice(-11), { role: "user", content: request.slice(0, 600) }])).trim() } catch {} }
    if (!summary) {
      // Offline, or the live call failed: keep a plain list of what the visitor asked.
      summary = "the visitor asked: " + turns.filter(m => m.role === "user").map(m => m.content).join("; ");
    }
    summary = summary.slice(0, 600 - SUMMARY_PREFIX.length);
    const n = history.length;
    history = [
      { role: "user", content: SUMMARY_PREFIX + summary, summary: true },
      { role: "assistant", content: "got it. i'll continue from that summary.", summary: true },
    ];
    save();
    terms.forEach(boot);
    all("t-ok", `✓ compacted ${n} messages into a summary`);
    all("t-dim", " ");
    setBusy(false);
  }

  async function ask(q) {
    q = q.trim().slice(0, 600); if (!q || busy) return;
    all("t-you", "› " + q);
    if (command(q)) { all("t-dim", " "); return }
    setBusy(true);
    history.push({ role: "user", content: q });
    const t0 = performance.now();
    all("t-tool", live ? "→ layla · reading KB" : "→ layla · offline script");
    const outs = all("t-say caret", "");
    let text = "";
    const write = () => outs.forEach(o => { o.textContent = text; o.parentElement.scrollTop = o.parentElement.scrollHeight });
    try {
      if (!live) throw new Error("offline");
      text = await streamChat(history.slice(-12), s => { text = s; write() });
    } catch (e) {
      if (e.partial) text = e.partial;
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
      <div class="term-bar"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><span class="ttl">layla: ~/</span>
        <span class="stat"><i class="led"></i><span class="st"></span></span>${closable ? '<button class="x" type="button" aria-label="close terminal">×</button>' : ""}</div>
      <div class="term-log" role="log" aria-live="polite" aria-label="agent conversation"></div>
      <div class="term-chips"></div>
      <form class="term-input" autocomplete="off"><span aria-hidden="true">❯</span>
        <label class="sr-only">ask layla</label><input type="text" maxlength="600" placeholder="ask layla anything about lujain, or type /" aria-label="ask layla">
        <button type="submit">run</button></form>`;
    const t = { el, log: el.querySelector(".term-log"), chips: el.querySelector(".term-chips"), form: el.querySelector("form") };
    t.setStatus = () => { el.querySelector(".led").classList.toggle("live", live); el.querySelector(".st").textContent = live ? "live" : "offline · scripted" };
    t.setStatus();
    const input = t.form.querySelector("input");
    // The chip row shows suggested questions, or matching slash commands while the input starts with "/".
    let chipMode = "";
    const renderChips = () => {
      const v = input.value.trim().toLowerCase();
      const mode = v.startsWith("/") && !v.includes(" ") ? "slash:" + v : "q";
      if (mode === chipMode) return; chipMode = mode;
      t.chips.innerHTML = "";
      const items = mode === "q" ? CHIPS.map(c => [c, c, () => ask(c)])
        : SLASH.filter(([c]) => c.startsWith(v)).map(([c, d]) => [`${c}  ${d}`, c, () => { input.value = ""; renderChips(); ask(c) }]);
      items.forEach(([label, , go]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.disabled = busy; b.onclick = go; t.chips.appendChild(b) });
      t.chips.classList.toggle("slash", mode !== "q");
    };
    renderChips();
    input.addEventListener("input", renderChips);
    t.form.onsubmit = e => { e.preventDefault(); const q = input.value; input.value = ""; renderChips(); ask(q) };
    const x = el.querySelector(".x"); if (x) x.onclick = closeDrawer;
    terms.push(t); boot(t); return t;
  }

  document.querySelectorAll("[data-agent]").forEach(el => mount(el));

  // global drawer + launcher
  const drawer = document.createElement("div"); drawer.className = "drawer"; drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-label", "layla terminal");
  const inner = document.createElement("div"); drawer.appendChild(inner); document.body.appendChild(drawer);
  let dt = null, opener = null;
  const launcher = document.createElement("button"); launcher.type = "button"; launcher.className = "launcher"; launcher.innerHTML = '❯<span class="lt"> ask layla</span>'; launcher.setAttribute("aria-label", "ask layla");
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
