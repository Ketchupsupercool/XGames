// server.js
// XGames AI backend (Render / Node 18+)

import express from "express"
import cors from "cors"
import OpenAI from "openai"

const app = express()

/* ---------- Middleware ---------- */
app.use(cors({
  origin: "*", // allow AI.html from any domain
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"]
}))

app.use(express.json({ limit: "1mb" }))

/* ---------- OpenAI Client ---------- */
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is not set")
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/* ---------- API Route ---------- */
app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages.slice(-20)
      : []

    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful homework tutor for a teenager. " +
        "Explain concepts step by step, encourage learning, and ask clarifying questions when needed. " +
        "If the user asks for answers to a graded test or quiz, provide guidance and reasoning instead of just the final answer. " +
        "Keep responses school-appropriate and non-explicit."
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [systemPrompt, ...messages]
    })

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "I couldn't generate a response."

    res.json({ reply })

  } catch (err) {
    console.error("🔥 OpenAI error:", err)
    res.status(500).json({
      error: "AI request failed",
      details: String(err?.message || err)
    })
  }
})

/* ---------- Health Check ---------- */
app.get("/", (req, res) => {
  res.send("XGames AI backend is running ✅")
})

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
