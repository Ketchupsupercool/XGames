// server.js
// Simple backend proxy for your AI.html page.
// Keeps your OpenAI API key SECRET (do not put keys in AI.html).

import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const userMessages = messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20);

    // Tutor-style system instruction (homework help)
    const instructions = [
      {
        role: "system",
        content:
          "You are a helpful homework tutor for a teen. Explain step-by-step, ask clarifying questions when needed, and encourage learning. " +
          "If the user asks for answers to a graded test/quiz, provide guidance and reasoning rather than just final answers. " +
          "Keep responses school-appropriate and avoid explicit content."
      }
    ];

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [...instructions, ...userMessages]
    });

    // Get text output from Responses API
    const reply =
      response.output_text ||
      (Array.isArray(response.output) ? JSON.stringify(response.output) : "");

    res.json({ reply });
  } catch (err) {
    res.status(500).send(String(err?.message || err));
  }
});

const port = process.env.PORT || 3000;
app.use(express.static(".")); // serves index.html, AI.html, Games/, etc.
app.listen(port, () => {
  console.log("Server running on http://localhost:" + port);
});
