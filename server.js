import express from "express";
import { load } from "cheerio"; // ✅ FIXED
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// 🦆 JSON search route
app.get("/proxy/json", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query" });

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await response.text();
    const $ = load(html); // ✅ FIXED
    const results = [];

    $(".result__body").each((_, el) => {
      const title = $(el).find(".result__a").text().trim();
      const url = $(el).find(".result__a").attr("href");
      const snippet = $(el).find(".result__snippet").text().trim();
      if (title && url) results.push({ title, url, snippet });
    });

    res.json({ query: q, results });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Failed to fetch from DuckDuckGo", details: err.message });
  }
});

// 🧩 Raw HTML endpoint
app.get("/proxy/html", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).send("Missing query");

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    const html = await response.text();
    res.type("html").send(html);
  } catch (err) {
    console.error("HTML proxy error:", err);
    res.status(500).send("Failed to fetch from DuckDuckGo: " + err.message);
  }
});

app.listen(PORT, () => console.log(`✅ DuckDuckGo Proxy running on port ${PORT}`));
