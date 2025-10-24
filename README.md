# 🦆 DuckDuckGo Proxy

A simple Node.js + Express-based proxy for DuckDuckGo that supports both:
- **Instant Answer API** (`/proxy/api`)
- **HTML Scraping** (`/proxy/html`)

### 🚀 Usage

```bash
npm install
npm start
```
Visit: [http://localhost:3000](http://localhost:3000)

### 📂 Endpoints
- `/proxy/api?q=example` → returns Instant Answer JSON
- `/proxy/html?q=example` → returns parsed search results (title, href, snippet)

### ⚠️ Notes
- Educational use only.
- HTML scraping may break if DuckDuckGo changes its layout.
- Add caching and respect rate limits when deploying publicly.

---
© 2025 DuckDuckGo Proxy Example
