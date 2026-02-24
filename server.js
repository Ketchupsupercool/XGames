// server.js
// XGames Website + AI Backend (Render-compatible)

import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import OpenAI from "openai"

const app = express()

/* ---------- Paths (ESM fix) ---------- */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* ---------- Middleware ---------- */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}))

app.use(express.json({ limit: "1mb" }))

/* ---------- Serve Website Files ---------- */
app.use(express.static(__dirname))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

/* ---------- OpenAI Client ---------- */
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is NOT set")
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/* ---------- AI API Route ---------- */
app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not set on the server"
      })
    }

    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages.slice(-20)
      : []

    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful homework tutor for a teenager. " +
        "Explain concepts step by step, encourage learning, and ask clarifying questions when needed. " +
        "If the user asks for answers to a graded test or quiz, provide guidance and reasoning instead of just the final answer. " +
        "Keep all responses school-appropriate."
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [systemPrompt, ...messages]
    })

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      ""

    res.json({ reply })

  } catch (err) {
    console.error("🔥 /api/chat error:", err)
    res.status(500).json({
      error: "AI request failed",
      details: err?.message || String(err)
    })
  }
})

/* ---------- Health Check ---------- */
app.get("/health", (req, res) => {
  res.send("XGames AI backend is running ✅")
})

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
