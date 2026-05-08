import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 25490;

  app.use(express.json());

  // API Route for scraping content from a URL
  app.get("/api/scrape", async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Yêu cầu URL" });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Basic extraction: title and main text
      const title = $("title").text() || $("h1").first().text();
      
      // Remove scripts, styles, and nav elements to get cleaner text
      $("script, style, nav, footer, header, noscript").remove();
      
      // Get text from common content areas
      const content = $("article, main, .content, #content, .post, .entry").text() || $("body").text();
      
      // Clean up whitespace
      const cleanContent = content.replace(/\s+/g, " ").trim().substring(0, 5000); // Limit to 5k chars for Gemini

      res.json({ title, content: cleanContent });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: "Không thể lấy nội dung từ URL" });
    }
  });

  // Proxy Route for the 5-Gate Python Backend
  app.post("/api/verify", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Yêu cầu văn bản" });
    }
    
    try {
      const response = await axios.post("http://localhost:8000/api/verify", { text });
      const data = response.data;

      // Transform data for the frontend
      const transformedData = {
        verdict: data.verdict,
        explanation: data.explanation,
        source: data.gate_fired === 1 ? "Cache từ " + data.sources : (data.sources && data.sources.length > 0 ? data.sources[0].provider : "AI Reasoning"),
        source_links: data.sources ? data.sources.map((s: any) => s.url) : [],
        gate_fired: data.gate_fired,
        signals: data.signals,
        full_sources: data.sources
      };

      res.json(transformedData);
    } catch (error: any) {
      console.error("Verification proxy error:", error.message);
      res.status(500).json({ error: "Lỗi kết nối tới hệ thống AI backend." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
