import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
// import fetch from "node-fetch"; <-- no need anymore

const app = express();
const cache = new NodeCache({ stdTTL: 60 * 10 });
const limiter = rateLimit({ windowMs: 60000, max: 20 });

// ✅ Enable CORS for all requests
app.use(cors());
app.use(helmet());
app.use(limiter);

// Your proxy routes below
app.get("/proxy/json", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query" });

  const cached = cache.get(q);
  if (cached) return res.json(cached);

  const r = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`);
  const text = await r.text();

  // You probably use cheerio here, left as is
  cache.set(q, { html: text });
  res.json({ html: text });
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Proxy running on port ${port}`));
