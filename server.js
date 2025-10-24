import express from "express";
import { load } from "cheerio";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;
app.use(cors());

app.get("/proxy/json", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query" });

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const html = await response.text();
    const $ = load(html);

    const results = [];

    // DuckDuckGo results container
    $("div.result").each((i, el) => {
      const title = $(el).find("a.result__a").text().trim();
      const url = $(el).find("a.result__a").attr("href");
      const snippet = $(el).find(".result__snippet").text().trim();
      if (title && url) results.push({ title, url, snippet });
    });

    res.json({ query: q, results });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Failed to fetch from DuckDuckGo", details: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ DuckDuckGo Proxy running on port ${PORT}`));
