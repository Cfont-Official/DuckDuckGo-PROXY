import express from "express";
import * as cheerio from "cheerio";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import NodeCache from "node-cache";
import { URLSearchParams } from "url";

const app = express();
app.use(helmet());
app.use(express.json());
app.set("trust proxy", 1);

const cache = new NodeCache({ stdTTL: 60 * 5, checkperiod: 120 });

const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: { error: "Too many requests, slow down." }
});
app.use(limiter);

function cacheKey(prefix, params) {
  return `${prefix}:${JSON.stringify(params)}`;
}

app.get("/proxy/api", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "missing q parameter" });

  const params = { q, format: "json", no_html: 1, no_redirect: 1 };
  const key = cacheKey("api", params);
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  try {
    const url = `https://api.duckduckgo.com/?${new URLSearchParams(params)}`;
    const r = await fetch(url, { headers: { "User-Agent": "ddg-proxy/1.0 (+https://example.com)" } });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const data = await r.json();
    cache.set(key, data, 60 * 5);
    res.json(data);
  } catch (err) {
    console.error("api proxy error:", err);
    res.status(502).json({ error: "upstream error" });
  }
});

app.get("/proxy/html", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "missing q parameter" });

  const params = { q, kl: "us-en" };
  const key = cacheKey("html", params);
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  try {
    const url = `https://html.duckduckgo.com/html/?${new URLSearchParams(params)}`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "ddg-proxy/1.0 (+https://example.com)",
        Accept: "text/html"
      }
    });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const html = await r.text();

    const $ = cheerio.load(html);
    const results = [];
    $("a.result__a, .result__a, a.result-link").each((i, el) => {
      const anchor = $(el);
      const href = anchor.attr("href") || "";
      const title = anchor.text().trim();
      const snippet = anchor.closest(".result").find(".result__snippet").text().trim() || "";
      if (href && title) {
        results.push({ title, href, snippet });
      }
    });

    if (results.length === 0) {
      $("a").each((i, el) => {
        const a = $(el);
        const href = a.attr("href") || "";
        const text = a.text().trim();
        if (href && text.length > 5 && href.startsWith("http")) {
          results.push({ title: text, href, snippet: "" });
        }
      });
    }

    const trimmed = results.slice(0, 30);
    cache.set(key, trimmed, 60 * 5);
    res.json(trimmed);
  } catch (err) {
    console.error("html proxy error:", err);
    res.status(502).json({ error: "upstream or parse error" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`ddg-proxy running on :${port}`);
});
