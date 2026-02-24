// server.js — XGames Website + Gemini backend (Render compatible)

import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import { GoogleGenerativeAI } from "@google/generative-ai"

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }))
app.use(express.json({ limit: "1mb" }))

// Serve your site files (index.html, other pages/, Games/, etc.)
app.use(express.static(__dirname))
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")))

// Gemini client (keep this key on the server, not in AI.html)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) console.error("❌ GEMINI_API_KEY is NOT set")

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// AI route used by AI.html
app.post("/api/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server" })
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-20) : []

    // Build a single prompt from chat history (simple + reliable)
    const system =
      "You are a helpful homework tutor for a teenager. Explain step-by-step, encourage learning, " +
      "and ask clarifying questions when needed. If the user asks for answers to a graded test/quiz, " +
      "provide guidance and reasoning rather than only final answers. Keep it school-appropriate."

    const transcript = messages
      .map(m => `${m.role === "assistant" ? "Tutor" : "Student"}: ${String(m.content || "")}`)
      .join("\n")

    const prompt = `${system}\n\n${transcript}\nTutor:`

    // Pick a fast/cheap model (you can change later)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent(prompt)
    const reply = result?.response?.text?.() || ""

    res.json({ reply })
  } catch (err) {
    console.error("🔥 /api/chat error:", err)
    res.status(500).json({ error: "AI request failed", details: String(err?.message || err) })
  }
})

app.get("/health", (req, res) => res.send("XGames Gemini backend is running ✅"))

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log("Server running on port", PORT))
