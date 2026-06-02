// api/chat.js — Vercel serverless function (Node runtime).
// Keeps the Anthropic API key server-side. The browser POSTs { messages, system };
// this forwards to Anthropic and returns { text }. The key never reaches the client.
//
// Env vars (Vercel → Settings → Environment Variables):
//   ANTHROPIC_API_KEY  = sk-ant-...                 (required)
//   CHAT_MODEL         = claude-haiku-4-5-20251001  (optional; default below)
//   CHAT_MAX_TOKENS    = 512                         (optional)
//   ALLOWED_ORIGINS    = https://agustinadeadamo.com (optional, comma-separated extra origins)

const WINDOW_MS = 60_000;
const MAX_REQ = 12; // per IP per window — best-effort (per serverless instance)
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const e = hits.get(ip) || { count: 0, start: now };
  if (now - e.start > WINDOW_MS) {
    e.count = 0;
    e.start = now;
  }
  e.count++;
  hits.set(ip, e);
  return e.count > MAX_REQ;
}

// Only the site itself (and any explicitly allowed origins) may call from a browser.
// Same-origin passes; no-Origin requests (e.g. curl) still hit the rate limit + spend cap.
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  if (originHost === req.headers.host) return true;
  const extra = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return extra.some((o) => {
    try {
      return new URL(o).host === originHost;
    } catch {
      return false;
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!originAllowed(req)) {
    return res.status(403).json({ error: "Forbidden origin" });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const ip =
    String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim() || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests — slow down a moment." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { messages, system } = body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 16) {
    return res.status(400).json({ error: "Invalid messages" });
  }
  for (const m of messages) {
    if (!m || typeof m.content !== "string" || m.content.length > 2000) {
      return res.status(400).json({ error: "Invalid message content" });
    }
  }
  if (typeof system !== "string" || system.length > 20_000) {
    return res.status(400).json({ error: "Invalid system" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: Number(process.env.CHAT_MAX_TOKENS) || 512,
        system,
        messages,
      }),
    });

    if (!r.ok) {
      console.error("Anthropic API error", r.status, await r.text());
      return res.status(502).json({ error: "Upstream error" });
    }

    const data = await r.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "Upstream error" });
  }
}
