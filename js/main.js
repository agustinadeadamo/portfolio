gsap.registerPlugin(ScrollTrigger);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(pointer: fine)").matches;

if (fine && !reduce) {
  const cur = document.querySelector(".cursor");
  const xTo = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" }),
    yTo = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
  addEventListener("mousemove", (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.querySelectorAll("[data-hover]").forEach((el) => {
    el.addEventListener("mouseenter", () => cur.classList.add("big"));
    el.addEventListener("mouseleave", () => cur.classList.remove("big"));
  });
}

function start() {
  const heroLines = gsap.utils.toArray(".hero .line__in");
  if (reduce) {
    document.getElementById("loader").style.display = "none";
    gsap.set(heroLines, { y: 0 });
    build();
    return;
  }
  const tl = gsap.timeline();
  tl.to("#count", {
    innerText: 100,
    duration: 1.4,
    snap: { innerText: 1 },
    ease: "power2.inOut",
    onUpdate() {
      this.targets()[0].innerText = String(Math.round(this.targets()[0].innerText)).padStart(
        2,
        "0"
      );
    },
  })
    .to("#loader", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "+=0.15")
    .from(heroLines, { yPercent: 115, duration: 1.05, stagger: 0.1, ease: "expo.out" }, "-=0.5")
    .from(".hero .avail", { y: 18, opacity: 0, duration: 0.6 }, "-=0.6")
    .from(".hero__sub", { y: 18, opacity: 0, duration: 0.6 }, "-=0.5")
    .from(".nav__in", { y: -18, opacity: 0, duration: 0.6 }, "-=0.6");
  build();
}

function build() {
  if (!reduce) {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
    gsap.to(".marquee__track", { xPercent: -50, duration: 18, ease: "none", repeat: -1 });
  }

  /* signature animation — SINGLE pinned timeline (fixes the disappearing bug) */
  const stage = document.getElementById("mmStage");
  const frags = gsap.utils.toArray(".mm__frag");
  if (stage && frags.length) {
    const gap = 52,
      orderedY = (i) => (i - (frags.length - 1) / 2) * gap;
    const k = Math.min(1, stage.offsetWidth / 820);
    frags.forEach((f) => (f.innerHTML = '<span class="tick">✓</span>' + f.textContent));
    const setDone = (on) =>
      frags.forEach((f) => {
        f.classList.toggle("done", on);
        f.querySelector(".tick").style.opacity = on ? 1 : 0;
      });
    if (reduce) {
      frags.forEach((f, i) => gsap.set(f, { x: 0, y: orderedY(i), rotation: 0, opacity: 1 }));
      setDone(true);
    } else {
      frags.forEach((f) =>
        gsap.set(f, {
          x: +f.dataset.sx * k,
          y: +f.dataset.sy * k,
          rotation: +f.dataset.r,
          opacity: 0.5,
        })
      );
      const mtl = gsap.timeline({
        scrollTrigger: {
          trigger: ".mm",
          start: "top top",
          end: "+=140%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setDone(self.progress > 0.7),
        },
      });
      frags.forEach((f, i) =>
        mtl.to(f, { x: 0, y: orderedY(i), rotation: 0, opacity: 1, ease: "power1.inOut" }, 0)
      );
    }
  }

  /* who photo — clip reveal + accent parallax */
  const photo = document.querySelector(".who__photo");
  if (photo && !reduce) {
    const frame = photo.querySelector(".frame"),
      accent = photo.querySelector(".accent"),
      img = photo.querySelector("img");
    gsap.set(frame, { clipPath: "inset(100% 0 0 0)" });
    gsap.set(img, { scale: 1.18 });
    gsap
      .timeline({ scrollTrigger: { trigger: photo, start: "top 82%" } })
      .to(frame, { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "expo.out" })
      .to(img, { scale: 1, duration: 1.4, ease: "expo.out" }, 0);
    gsap.fromTo(
      accent,
      { y: 34, x: 18 },
      {
        y: -10,
        x: 0,
        ease: "none",
        scrollTrigger: { trigger: photo, start: "top bottom", end: "bottom top", scrub: 1 },
      }
    );
  }

  gsap.utils.toArray("[data-count]").forEach((el) => {
    const end = +el.dataset.count,
      sup = el.querySelector("small"),
      suffix = sup ? sup.textContent : "";
    const set = (v) =>
      (el.innerHTML = Math.round(v) + (suffix ? "<small>" + suffix + "</small>" : ""));
    if (reduce) {
      set(end);
      return;
    }
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () =>
        gsap.to(obj, { v: end, duration: 1.5, ease: "power2.out", onUpdate: () => set(obj.v) }),
    });
  });

  if (fine && !reduce) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" }),
        yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.4);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      btn.addEventListener("mouseleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  if (!reduce) {
    gsap.from(".contact .line__in", {
      yPercent: 115,
      duration: 1,
      stagger: 0.1,
      ease: "expo.out",
      scrollTrigger: { trigger: ".contact", start: "top 75%" },
    });
  }
  ScrollTrigger.refresh();
}
window.addEventListener("load", start);

/* ============================================================
   ASK AGUSTINA — grounded chat
   DEMO (inside Claude.ai): calls the Anthropic API directly.
   PRODUCTION (deployed): set USE_PROXY=true and host a tiny endpoint
   at PROXY_URL that injects your API key and forwards {messages,system}
   to Anthropic, returning {text}. FastAPI route or Vercel function — both fine.
   ============================================================ */
const CHAT = { USE_PROXY: true, PROXY_URL: "/api/chat", MODEL: "claude-sonnet-4-20250514" };

const PROFILE = `You are a small assistant ON Agustina De Adamo's portfolio. Speak ABOUT her in third person, briefly, in her tone: direct, calm, specific, human, never corporate or buzzwordy. Never oversell her as a founder, PM, or "AI guru" — she is a frontend & AI product engineer with product judgment and a designer's eye. She builds AI features, but doesn't sell hype — judgment over buzzwords. If you don't know, say so and suggest emailing agustinadeadamo@gmail.com. Keep answers to 2-4 short sentences.

FACTS:
- Frontend & AI product engineer, 6+ years shipping production software for US startups. Came from graphic design (Universidad de Buenos Aires, 6 years), so she's strong on hierarchy, clarity, accessibility, interaction quality.
- Core strength: works in the "messy middle" — turning vague product ideas into clear, usable, maintainable interfaces. Clarifies flows, names undecided decisions, identifies edge/empty/error states, defines frontend architecture.
- Stack: React, Next.js, TypeScript, Tailwind, GraphQL; Python/FastAPI, Node, PostgreSQL/Supabase, Drizzle. Testing: Vitest/Jest/Playwright. Performance (Web Vitals), accessibility (WCAG AA).
- She uses AI tools (Cursor, Claude Code) and builds AI product features, but does NOT trust them blindly — senior judgment is what makes the result reliable. Frame AI as a tool she uses well, not as hype.

- HER OWN PROJECT — Whetstone (the thing she can actually show; repos on github.com/agustinadeadamo, live landing at whetstone-waitlist.vercel.app):
  • Whetstone is an AI-graded interview trainer she's building SOLO. You write an answer from memory, an AI grades it against a reference, and you see what you covered/missed/should fix, with progress mapped across topics. Two research-backed mechanics: retrieval practice and weighted spaced repetition.
  • Two pieces: the APP (status: in active development) and the WAITLIST landing page (status: live, deployed).
  • App is built to senior standards: multi-tenant Postgres Row-Level Security (28 policies across 7 tables, verified adversarially) instead of app-level filtering; defense in depth; 12 Architecture Decision Records documenting the WHY; correct cookie-based SSR auth via Supabase. AI grading layer is IN PROGRESS — server-side Anthropic Claude API with structured outputs, output repair, and an eval set. Stack: Next.js, TypeScript, Tailwind, Postgres/Supabase, Drizzle, Claude API, Zod, Vercel.
  • Waitlist landing (live): a conversion-focused page that validates demand — stated hypothesis, one narrowed audience, one conversion goal, a measurement plan; research-grounded copy; proportional security (server-side validation, honeypot, in-memory rate limiting; consciously skipped CAPTCHA/Redis); server-side Airtable handling. Stack: Next.js, TypeScript, Tailwind, Airtable, Vercel, GitHub Actions.
  • Be honest about status: app = in active development (AI layer in progress); landing = live. Do not claim the app is finished.

- EXPERIENCE (these are EMPLOYERS, not her own projects — proprietary, nothing public to link):
  • Jan-Way — founding/senior frontend, 0→1 product (2024–2026).
  • Firstleaf — React frontend on a wine e-commerce platform; checkout refactor → +10% conversion (2021–2024).
  • Valtech — luxury retail web app, React/GraphQL/Next SSG (2020–2021).
  • Arcos Dorados / McDonald's SLAD — internal admin web app, React/Redux (2018–2020).

- Best fit: early/undefined products, AI tools, SaaS, dashboards, internal tools, e-commerce/product flows. Likes working with founders/teams where things are still undefined.
- Originally from Argentina, working remotely with teams worldwide. Open to remote roles, available.`;

const log = document.getElementById("log"),
  input = document.getElementById("input"),
  send = document.getElementById("send"),
  history = [];
function addMsg(text, who, think) {
  const el = document.createElement("div");
  el.className = "msg " + who + (think ? " think" : "");
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}
async function ask(q) {
  if (!q.trim()) return;
  addMsg(q, "u");
  history.push({ role: "user", content: q });
  input.value = "";
  send.disabled = true;
  const thinking = addMsg("thinking…", "a", true);
  try {
    let text;
    if (CHAT.USE_PROXY) {
      const r = await fetch(CHAT.PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, system: PROFILE }),
      });
      text = (await r.json()).text;
    } else {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: CHAT.MODEL,
          max_tokens: 1000,
          system: PROFILE,
          messages: history,
        }),
      });
      const data = await r.json();
      text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
    }
    if (!text) throw new Error("empty");
    thinking.remove();
    addMsg(text, "a");
    history.push({ role: "assistant", content: text });
  } catch (e) {
    thinking.remove();
    addMsg(
      "The live answer isn't reachable from here — but the short version: Agustina's the engineer you want when a product is still half-defined, and Whetstone (on her GitHub) is the proof. For anything specific, email her at agustinadeadamo@gmail.com.",
      "a"
    );
  }
  send.disabled = false;
  input.focus();
}
send.addEventListener("click", () => ask(input.value));
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ask(input.value);
});
document.getElementById("chips").addEventListener("click", (e) => {
  if (e.target.classList.contains("chip")) ask(e.target.textContent);
});
