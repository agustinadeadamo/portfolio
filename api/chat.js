// api/chat.js — Vercel serverless function (Node runtime).
// Keeps the Anthropic API key server-side. The browser POSTs { messages, system };
// this forwards to Anthropic and returns { text }. The key never reaches the client.
//
// Required env var (set in Vercel → Settings → Environment Variables):
//   ANTHROPIC_API_KEY = sk-ant-...
// Optional:
//   CHAT_MODEL = claude-sonnet-4-6   (default; use claude-haiku-4-5-20251001 for lower cost)

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
    return res.status(400).json({ error: "Invalid messages" });
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
        model: process.env.CHAT_MODEL || "claude-sonnet-4-6",
        max_tokens: 1000,
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
