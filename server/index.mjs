import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

app.use(cors({ origin: true }));
app.use(express.json({ limit: "20mb" }));

const SYSTEM_PROMPT =
  "أنت Nexa AI، مساعد ذكي مفيد. أجب بلغة المستخدم، وادعم العربية الفصحى واللهجة العراقية. اشرح بوضوح ونظّم الإجابة، ولا تخترع معلومات.";

app.get("/health", (_req, res) => {
  res.status(API_KEY ? 200 : 503).json({
    server: "Nexa AI Gemini backend",
    ready: Boolean(API_KEY),
    provider: "Google Gemini"
  });
});

app.get("/api/models", (_req, res) => {
  res.json({
    models: [{
      id: "gemini",
      name: "Gemini",
      online: Boolean(API_KEY)
    }]
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(503).json({
        error: "مفتاح Gemini غير مضبوط في ملف البيئة"
      });
    }

    const messages = req.body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "لا توجد رسالة لإرسالها"
      });
    }

    const safeMessages = messages
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-24);

    if (!safeMessages.length) {
      return res.status(400).json({
        error: "لا توجد رسائل نصية صالحة"
      });
    }

    const contents = safeMessages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1024
          }
        }),
        signal: AbortSignal.timeout(60000)
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Gemini API error:", response.status, data.error?.message);
      return res.status(response.status).json({
        error: data.error?.message || `Gemini HTTP ${response.status}`
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "Gemini لم يُرجع إجابة نصية"
      });
    }

    res.json({
      reply,
      model: "gemini",
      modelName: MODEL,
      provider: "Google Gemini"
    });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(503).json({
      error: `تعذر الاتصال بـ Gemini: ${error.message}`
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Nexa AI Gemini backend running on http://127.0.0.1:${PORT}`);
});
