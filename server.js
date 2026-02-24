// server.js — XGames Website + xAI (Grok) backend

import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import OpenAI from "openai"

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }))
app.use(express.json({ limit: "1mb" }))

// Serve your site files
app.use(express.static(__dirname))
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")))

// ✅ xAI uses OpenAI-compatible endpoints at https://api.x.ai/v1
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1"
})

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.XAI_API_KEY) {
      return res.status(500).json({ error: "XAI_API_KEY is not set on the server" })
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-20) : []

    const system = {
      role: "system",
      content:
        "You are a helpful homework tutor for a teenager. Explain step-by-step, encourage learning, and ask clarifying questions when needed. " +
        "If the user asks for answers to a graded test/quiz, provide guidance and reasoning rather than only final answers. Keep it school-appropriate."
    }

    // Chat Completions endpoint is supported by xAI :contentReference[oaicite:2]{index=2}
    const resp = await xai.chat.completions.create({
      model: "grok-2", // you can change this to the model you have access to
      messages: [system, ...messages],
      temperature: 0.7
    })

    const reply = resp.choices?.[0]?.message?.content || ""
    res.json({ reply })
  } catch (err) {
    console.error("🔥 /api/chat error:", err)
    res.status(500).json({ error: "AI request failed", details: err?.message || String(err) })
  }
})

app.get("/health", (req, res) => res.send("XGames xAI backend is running ✅"))

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log("Server running on port", PORT))
