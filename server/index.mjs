import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT || 8787);

const MODELS = {
  qwen: {
    url: "http://127.0.0.1:8080",
    name: "Qwen"
  },
  gemma: {
    url: "http://127.0.0.1:8081",
    name: "Gemma 3"
  }
};

app.use(cors({ origin: true }));
app.use(express.json({ limit: "20mb" }));

async function isModelOnline(model) {
  try {
    const response = await fetch(`${MODELS[model].url}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function getModelStatus() {
  const [qwen, gemma] = await Promise.all([
    isModelOnline("qwen"),
    isModelOnline("gemma")
  ]);

  return { qwen, gemma };
}

function chooseModel(messages, requestedModel) {
  if (requestedModel === "qwen" || requestedModel === "gemma") {
    return {
      model: requestedModel,
      reason: "manual"
    };
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find(message => message.role === "user");

  const content = lastUserMessage?.content || "";

  const visualPattern =
    /صورة|صور|الصورة|الصور|لقطة|مشهد بصري|ماذا ترى|حلل الصورة|صف الصورة|image|photo|picture|visual|what do you see/i;

  if (visualPattern.test(content)) {
    return {
      model: "gemma",
      reason: "visual-task"
    };
  }

  return {
    model: "qwen",
    reason: "general-task"
  };
}

async function requestModel(model, messages) {
  const response = await fetch(
    `${MODELS[model].url}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model === "qwen" ? "qwen-local" : "gemma-local",
        messages: [
          {
            role: "system",
            content:
              "أنت Nexa AI، مساعد ذكي مفيد. أجب بلغة المستخدم، وادعم العربية الفصحى واللهجة العراقية. اشرح بوضوح ونظّم الإجابة، ولا تخترع معلومات."
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 384,
        stream: false
      })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error?.message || `HTTP ${response.status}`
    );
  }

  const reply = data.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("النموذج لم يُرجع إجابة");
  }

  return reply;
}

app.get("/health", async (_req, res) => {
  const status = await getModelStatus();

  res.status(status.qwen || status.gemma ? 200 : 503).json({
    server: "Nexa AI local backend",
    ready: status.qwen || status.gemma,
    models: {
      qwen: {
        online: status.qwen,
        port: 8080
      },
      gemma: {
        online: status.gemma,
        port: 8081
      }
    }
  });
});

app.get("/api/models", async (_req, res) => {
  const status = await getModelStatus();

  res.json({
    models: [
      {
        id: "qwen",
        name: "Qwen",
        online: status.qwen
      },
      {
        id: "gemma",
        name: "Gemma 3",
        online: status.gemma
      }
    ]
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "لا توجد رسالة لإرسالها"
      });
    }

    const safeMessages = messages
      .filter(message =>
        message &&
        ["user", "assistant", "system"].includes(message.role) &&
        typeof message.content === "string"
      )
      .slice(-24);

    if (safeMessages.length === 0) {
      return res.status(400).json({
        error: "لا توجد رسائل نصية صالحة"
      });
    }

    const routing = chooseModel(
      safeMessages,
      req.body?.model
    );

    const preferred = routing.model;
    const alternative = preferred === "qwen" ? "gemma" : "qwen";

    let usedModel = preferred;
    let reply;

    try {
      reply = await requestModel(preferred, safeMessages);
    } catch (firstError) {
      console.warn(
        `${MODELS[preferred].name} unavailable:`,
        firstError.message
      );

      if (!(await isModelOnline(alternative))) {
        throw new Error(
          `${MODELS[preferred].name} غير متاح، والنموذج البديل ${MODELS[alternative].name} غير متاح أيضاً.`
        );
      }

      usedModel = alternative;
      reply = await requestModel(alternative, safeMessages);
    }

    res.json({
      reply,
      model: usedModel,
      modelName: MODELS[usedModel].name,
      routedBy: routing.reason,
      fallbackUsed: usedModel !== preferred
    });
  } catch (error) {
    res.status(503).json({
      error: `تعذر الحصول على إجابة: ${error.message}`
    });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Nexa AI backend running at http://127.0.0.1:${PORT}`);
});
