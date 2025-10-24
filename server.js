// server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import * as cheerio from "cheerio"; // fixed import for Node 25+

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
});

app.use(cors()); // ✅ allow browser access from anywhere
app.use(helmet());
app.use(limiter);

// ✅ JSON endpoint
app.get("/proxy/json", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query" });

  const cached = cache.get(q);
  if (cached) return res.json(cached);

  try {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    const response = await fetch(url);
    const text = await response.text();
    const $ = cheerio.load(text);

    const results = [];
    $(".result__title a").each((_, el) => {
      results.push({
        title: $(el).text().trim(),
        url: $(el).attr("href"),
      });
    });

    const data = { query: q, results };
    cache.set(q, data);
    res.json(data);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ HTML endpoint (raw DDG page)
app.get("/proxy/html", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).send("Missing query");

  try {
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`);
    const html = await response.text();
    res.send(html);
  } catch (err) {
    console.error("HTML fetch error:", err);
    res.status(500).send("Internal server error");
  }
});

// ✅ Start server
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`DuckDuckGo Proxy running on port ${port}`));
