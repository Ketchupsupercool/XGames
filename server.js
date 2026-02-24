// server.js (Render: website + AI API)

import express from "express"
import OpenAI from "openai"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CORS (safe default so AI.html works even if hosted elsewhere)
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }))
app.use(express.json({ limit: "1mb" }))

// ✅ Serve your website files (index.html, other pages/, Games/, etc.)
app.use(express.static(__dirname))

// ✅ Website homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// ✅ AI endpoint
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server" })
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-20) : []

    const system = {
      role: "system",
      content:
        "You are a helpful homework tutor for a teen. Explain step-by-step and encourage learning. " +
        "If the user asks for answers to a graded test/quiz, provide guidance and reasoning instead of only final answers. " +
        "Keep it school-appropriate."
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [system, ...messages]
    })

    res.json({ reply: response.output_text || "" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err?.message || err) })
  }
})

// ✅ Health check (moved off /)
app.get("/health", (req, res) => {
  res.send("XGames AI backend is running ✅")
})

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log("Server running on port", PORT))
