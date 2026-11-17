(() => {
  "use strict";
  const cfg = window.INQUIRY_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const form = $("#form");
  const steps = $$(".step", form);
  const crumbs = $$(".steps li", form);
  const next = $("#next");
  const back = $("#back");
  const LAST = 3;
  const DRAFT = "inquiry-draft";
  let cur = 0;
  const startedAt = Date.now();

  $("#yr").textContent = new Date().getFullYear();

  // ---- rotating headline word -------------------------------------------
  const words = ["something good", "your website", "your web app", "that internal tool", "the AI thing", "your idea"];
  const rot = $("#rotator");
  let wi = 0;
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(() => {
      rot.classList.add("out");
      setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove("out"); }, 300);
    }, 2800);
  }

  // ---- data helpers ------------------------------------------------------
  const data = () => {
    const fd = new FormData(form);
    return {
      type: fd.get("type") || "",
      features: fd.getAll("features"),
      pages: fd.get("pages") || "",
      budget: fd.get("budget") || "",
      timeline: fd.get("timeline") || "",
      details: (fd.get("details") || "").trim(),
      links: (fd.get("links") || "").trim(),
      name: (fd.get("name") || "").trim(),
      email: (fd.get("email") || "").trim(),
      company: (fd.get("company") || "").trim(),
      source: (fd.get("source") || "").trim(),
      website: fd.get("website") || "",
    };
  };

  const briefText = (d) => [
    `New project inquiry for ${cfg.brand || "you"}`,
    "",
    `Name:     ${d.name}${d.company ? ` (${d.company})` : ""}`,
    `Email:    ${d.email}`,
    `Type:     ${d.type}`,
    `Features: ${d.features.join(", ") || "—"}`,
    d.pages ? `Pages:    ${d.pages}` : null,
    `Budget:   ${d.budget}`,
    `Timeline: ${d.timeline}`,
    d.links ? `Links:    ${d.links}` : null,
    d.source ? `Found via: ${d.source}` : null,
    "",
    "Details:",
    d.details,
  ].filter((l) => l !== null).join("\n");

  // ---- live brief sidebar -----------------------------------------------
  const updateBrief = () => {
    const d = data();
    const vals = {
      type: d.type, budget: d.budget, timeline: d.timeline,
      features: d.features.length ? d.features.join(", ") : "",
      name: d.name ? d.name + (d.company ? ` · ${d.company}` : "") : "",
    };
    for (const [k, v] of Object.entries(vals)) {
      const el = $(`[data-k="${k}"]`);
      const nv = v || "—";
      if (el.textContent !== nv) {
        el.textContent = nv;
        el.classList.remove("set"); void el.offsetWidth; if (v) el.classList.add("set");
      }
    }
    const filled = [d.type, d.budget, d.timeline, d.details.length >= 20, d.name, /\S+@\S+\.\S+/.test(d.email)].filter(Boolean).length;
    $("#meter-fill").style.width = `${(filled / 6) * 100}%`;
    $("#count").textContent = d.details.length;
    try { localStorage.setItem(DRAFT, JSON.stringify(d)); } catch {}
  };

  // ---- restore draft ------------------------------------------------------
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT) || "null");
    if (saved) {
      for (const el of form.elements) {
        if (!el.name || el.name === "website") continue;
        const v = saved[el.name];
        if (v == null) continue;
        if (el.type === "radio") el.checked = el.value === v;
        else if (el.type === "checkbox") el.checked = Array.isArray(v) && v.includes(el.value);
        else el.value = v;
      }
    }
  } catch {}

  // ---- validation ---------------------------------------------------------
  const showErr = (name, on) => {
    const e = $(`.err[data-for="${name}"]`, form);
    if (!e) return;
    e.classList.remove("show");
    if (on) { void e.offsetWidth; e.classList.add("show"); }
    const input = form.elements[name];
    if (input && input.classList) input.classList.toggle("invalid", on);
  };

  const rules = {
    0: { type: (d) => !!d.type },
    1: { budget: (d) => !!d.budget, timeline: (d) => !!d.timeline },
    2: { details: (d) => d.details.length >= 20 },
    3: { name: (d) => !!d.name, email: (d) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) },
  };

  const validate = (i) => {
    const d = data();
    let firstBad = null;
    for (const [name, ok] of Object.entries(rules[i])) {
      const good = ok(d);
      showErr(name, !good);
      if (!good && !firstBad) firstBad = name;
    }
    if (firstBad) {
      const el = form.elements[firstBad];
      (el instanceof RadioNodeList ? el[0] : el)?.focus();
    }
    return !firstBad;
  };

  // ---- navigation ---------------------------------------------------------
  const go = (i, dir = 1) => {
    steps[cur].classList.remove("on", "rev");
    cur = i;
    const s = steps[cur];
    s.classList.toggle("rev", dir < 0);
    s.classList.add("on");
    crumbs.forEach((c, j) => { c.classList.toggle("on", j === cur); c.classList.toggle("past", j < cur); });
    back.hidden = cur === 0 || cur > LAST;
    next.innerHTML = cur === LAST ? "Send brief ✦" : "Continue →";
    const focusable = s.querySelector("input:not([type=hidden]):not([tabindex='-1']), textarea");
    if (focusable && cur <= LAST) setTimeout(() => focusable.focus({ preventScroll: true }), 50);
    if (innerWidth < 900) form.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  next.addEventListener("click", () => {
    if (!validate(cur)) return;
    if (cur < LAST) go(cur + 1);
    else submit();
  });
  back.addEventListener("click", () => cur > 0 && go(cur - 1, -1));

  form.addEventListener("input", (e) => {
    updateBrief();
    if (e.target.name) showErr(e.target.name, false);
  });
  // website-only questions: shown when "Website build" is picked, cleared otherwise
  const webOnly = $(".web-only", form);
  const syncWeb = () => {
    const on = data().type === "Website build";
    webOnly.hidden = !on;
    if (!on) $("input", webOnly).forEach((i) => (i.checked = false));
  };
  // auto-advance after choosing a project type
  form.addEventListener("change", (e) => {
    if (e.target.name === "type") { syncWeb(); updateBrief(); }
  });
  // advance on click (not change) so re-picking a tile restored from a draft still moves on
  form.addEventListener("click", (e) => {
    if (e.target.name === "type" && cur === 0) setTimeout(() => cur === 0 && go(1), 260);
  });
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && cur <= LAST) { e.preventDefault(); next.click(); }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target.tagName === "TEXTAREA") { e.preventDefault(); next.click(); }
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  // ---- submit -------------------------------------------------------------
  const finish = (title, msg) => {
    $("#done-title").textContent = title;
    $("#done-msg").textContent = msg;
    form.classList.add("sent");
    go(4);
    steps[4].focus();
    burst();
  };

  async function submit() {
    const d = data();
    // honeypot or bot-fast submissions: pretend success, send nothing
    if (d.website || Date.now() - startedAt < 4000) return finish("Brief sent.", "Thanks! I'll be in touch.");

    const text = briefText(d);
    next.disabled = true;
    next.innerHTML = '<span class="spin"></span> Sending';

    try {
      if (cfg.endpoint) {
        const payload = {
          ...d, features: d.features.join(", "),
          subject: `Project inquiry: ${d.type} from ${d.name}`,
          message: text, _replyto: d.email,
        };
        delete payload.website;
        if (cfg.accessKey) payload.access_key = cfg.accessKey;
        const r = await fetch(cfg.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        clearDraft();
        finish("Brief sent.", `Thanks, ${d.name.split(" ")[0]}! I'll read it properly and reply to ${d.email} soon.`);
      } else if (cfg.email) {
        const href = `mailto:${cfg.email}?subject=${encodeURIComponent(`Project inquiry: ${d.type}`)}&body=${encodeURIComponent(text)}`;
        location.href = href;
        clearDraft();
        finish("Almost there.", "Your mail app should have opened with the brief filled in. Just hit send.");
      } else {
        finish("Brief ready.", "Online sending isn't set up yet. Copy your brief below and email it over.");
      }
    } catch (err) {
      console.error(err);
      next.disabled = false;
      next.innerHTML = "Try again ✦";
      const e = $('.err[data-for="email"]');
      e.textContent = "Couldn't send just now. Try again, or use “Copy my brief” after.";
      e.classList.add("show");
      return;
    }
    next.disabled = false;
  }

  const clearDraft = () => { try { localStorage.removeItem(DRAFT); } catch {} };

  $("#copy").addEventListener("click", async (e) => {
    const t = briefText(data());
    try { await navigator.clipboard.writeText(t); e.target.textContent = "Copied ✓"; }
    catch { prompt("Copy your brief:", t); }
    setTimeout(() => (e.target.textContent = "Copy my brief"), 2000);
  });
  $("#again").addEventListener("click", () => {
    form.reset(); clearDraft(); syncWeb(); form.classList.remove("sent"); updateBrief(); go(0, -1);
  });

  // ---- background: drifting node network ----------------------------------
  const cv = $("#bg");
  const cx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, pts = [], mouse = { x: -1e4, y: -1e4 };
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ffb020";
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    const n = Math.round(Math.min(70, (innerWidth * innerHeight) / 22000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25 * dpr, vy: (Math.random() - .5) * .25 * dpr }));
  };
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { const dpr = Math.min(devicePixelRatio || 1, 2); mouse = { x: e.clientX * dpr, y: e.clientY * dpr }; });
  resize();
  let sparks = [];
  function frame() {
    cx.clearRect(0, 0, W, H);
    const col = accent();
    const R = 140 * Math.min(devicePixelRatio || 1, 2);
    for (const p of pts) {
      if (!reduce) { p.x += p.vx; p.y += p.vy; }
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    cx.strokeStyle = col; cx.fillStyle = col;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      cx.globalAlpha = md < R * 1.4 ? .55 : .22;
      cx.beginPath(); cx.arc(a.x, a.y, 1.6, 0, 7); cx.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], dd = Math.hypot(a.x - b.x, a.y - b.y);
        if (dd < R) { cx.globalAlpha = (1 - dd / R) * .14; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); }
      }
    }
    sparks = sparks.filter((s) => s.life > 0);
    for (const s of sparks) {
      s.x += s.vx; s.y += s.vy; s.vy += .12; s.life -= 1;
      cx.globalAlpha = s.life / 60; cx.fillStyle = s.c;
      cx.fillRect(s.x, s.y, 3, 3);
    }
    cx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function burst() {
    if (reduce) return;
    const r = form.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const ox = (r.left + r.width / 2) * dpr, oy = (r.top + 90) * dpr;
    const cols = [accent(), "#ff6b3d", "#4ade80", "#eceef4"];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 6;
      sparks.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, life: 40 + Math.random() * 30, c: cols[i % cols.length] });
    }
  }

  syncWeb();
  updateBrief();
})();
