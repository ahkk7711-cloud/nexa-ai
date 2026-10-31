
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const DEFAULT_MODEL = "gemini-2.5-flash";

const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function convertMessages(messages) {
  return messages
    .filter((message) =>
      ["user", "assistant"].includes(message.role)
    )
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: String(message.content ?? message.text ?? "")
        }
      ]
    }))
    .filter((message) => message.parts[0].text.trim());
}

export async function sendToAI(messages, model = "auto") {
  if (!API_KEY) {
    throw new Error(
      "مفتاح Gemini غير موجود. تحقق من إعدادات GitHub Secrets."
    );
  }

  const selectedModel =
    !model || model === "auto"
      ? DEFAULT_MODEL
      : model;

  const contents = convertMessages(messages);

  if (!contents.length) {
    throw new Error("لا توجد رسالة لإرسالها.");
  }

  const response = await fetch(GEMINI_URL(selectedModel), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Gemini API Error: ${response.status}`
    );
  }

  const reply = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!reply) {
    throw new Error("لم يصل رد من Gemini.");
  }

  return reply;
}

export async function getAIModels() {
  return [
    {
      id: DEFAULT_MODEL,
      name: "Gemini 2.5 Flash"
    }
  ];
}
