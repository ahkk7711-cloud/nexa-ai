const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8787";

export async function sendToAI(messages, model = "auto") {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      model
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `HTTP ${response.status}`
    );
  }

  if (!data.reply) {
    throw new Error("لم يصل رد من النموذج المحلي");
  }

  return data.reply;
}

export async function getAIModels() {
  const response = await fetch(`${API_URL}/api/models`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data.models || [];
}
