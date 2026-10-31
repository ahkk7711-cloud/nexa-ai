
const API_BASE = "https://nexa-ai-api.ahkk7711.workers.dev";

const DEFAULT_MODEL = "deepseek-v4.1-flash";

export async function sendToAI(messages, model = DEFAULT_MODEL) {
  const cleanMessages = messages
    .filter((message) =>
      ["system", "user", "assistant"].includes(message.role)
    )
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? message.text ?? "")
    }))
    .filter((message) => message.content.trim());

  if (!cleanMessages.length) {
    throw new Error("لا توجد رسالة لإرسالها.");
  }

  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model === "auto" ? DEFAULT_MODEL : model,
      messages: cleanMessages,
      temperature: 0.7
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
      data.error ||
      `API Route Error: ${response.status}`
    );
  }

  const reply = data.choices?.[0]?.message?.content;

  const text = Array.isArray(reply)
    ? reply.map((part) => part.text || "").join("")
    : String(reply ?? "");

  if (!text.trim()) {
    throw new Error("لم يصل رد من النموذج.");
  }

  return text.trim();
}

export async function getAIModels() {
  const response = await fetch(`${API_BASE}/api/models`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
      data.error ||
      `Models API Error: ${response.status}`
    );
  }

  const models = Array.isArray(data.data) ? data.data : [];

  return models
    .filter((model) =>
      Array.isArray(model.supported_endpoint_types)
        ? model.supported_endpoint_types.includes("openai")
        : true
    )
    .map((model) => ({
      id: model.id,
      name: model.id,
      online: true
    }));
}
