const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_HF_MODEL = "meta-llama/Llama-3.3-70B-Instruct";
const DEFAULT_HF_FALLBACK_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";
const MAX_BODY_BYTES = 180000;
const MODEL_ALIASES = {
  "gpt-5.4-mini": "gpt-4.1-mini",
  "gpt-5.4-nano": "gpt-4.1-mini"
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.HF_TOKEN && !process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "StudyAI service is not configured" });
  }

  try {
    const raw = JSON.stringify(req.body || {});
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "Request is too large" });
    }

    const task = String(req.body?.task || "study").trim();
    const context = req.body?.context;

    if (!context || typeof context !== "object") {
      return res.status(400).json({ error: "Context is required" });
    }

    const result = await callStudyProvider(task, context);
    return res.status(200).json(result);
  } catch (error) {
    console.error("StudyAI request failed:", error?.message || error);
    return res.status(502).json({
      error: "StudyAI request failed",
      reason: publicFailureReason(error)
    });
  }
}

async function callStudyProvider(task, context) {
  const errors = [];

  if (process.env.HF_TOKEN) {
    try {
      return await callHuggingFace(task, context);
    } catch (error) {
      errors.push(error);
    }
  }

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_FALLBACK === "true") {
    try {
      return await callOpenAI(task, context);
    } catch (error) {
      errors.push(error);
    }
  }

  throw errors[errors.length - 1] || new Error("No StudyAI provider is configured");
}

function setCorsHeaders(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "https://turgudvaliyev2002.github.io";
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin === allowedOrigin ? origin : allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function callOpenAI(task, context) {
  const model = resolveModel(process.env.OPENAI_MODEL);
  const prompt = buildStudyPrompt(task, context);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: task === "exam" ? 0.55 : 0.35,
      max_output_tokens: task === "exam" ? 2200 : 1400
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${details.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = extractResponseText(data);
  if (!text) throw new Error("No text returned");
  return formatProviderResult(text, model, task);
}

async function callHuggingFace(task, context) {
  const models = huggingFaceModelChain();
  const errors = [];

  for (const model of models) {
    try {
      return await callHuggingFaceModel(model, task, context);
    } catch (error) {
      errors.push(error);
    }
  }

  throw errors[errors.length - 1] || new Error("No Hugging Face model is configured");
}

async function callHuggingFaceModel(model, task, context) {
  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.HF_TOKEN}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt(task)
        },
        {
          role: "user",
          content: buildStudyPrompt(task, context)
        }
      ],
      temperature: task === "exam" ? 0.55 : 0.35,
      max_tokens: task === "exam" ? 2200 : 1400,
      stream: false
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Hugging Face error ${response.status} for ${model}: ${details.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text returned from Hugging Face");
  return formatProviderResult(text, model, task);
}

function systemPrompt(task) {
  const base = "You are StudyAI, a careful AI tutor for university students. Teach clearly, be academically honest, and do not invent citations. If material context is limited, say so.";
  if (task === "assignment") return `${base} Guide assignments step by step. Do not dump a complete final solution at once unless explicitly asked. Explain why each part is needed.`;
  if (task === "exam") return `${base} Generate original exam questions. Avoid repeating old questions. Return only valid JSON when the user asks for JSON.`;
  if (task === "grade") return `${base} Grade fairly. Explain mistakes, weak topics, and recovery actions.`;
  if (task === "study_chat") return `${base} Continue the current preparation session as an interactive chatbot. Answer the student's follow-up question clearly and connect it to the preparation plan.`;
  return base;
}

function buildStudyPrompt(task, context) {
  const taskInstructions = {
    study: [
      "Create a daily class preparation lesson.",
      "Respect explanation level: simple, medium, or academic.",
      "If start from scratch is selected, begin with compact prerequisite concepts.",
      "Include concept explanation, examples, common mistakes, mini practice, and a short summary.",
      "If material mode is with materials but no real extracted chunks are available, clearly say material upload is recorded but true RAG parsing is not connected yet."
    ],
    exam: [
      "Create an exam as valid JSON only. No markdown.",
      "Schema: {\"questions\":[{\"type\":\"single|multiple|open|coding\",\"topic\":\"...\",\"difficulty\":\"...\",\"text\":\"...\",\"options\":[\"...\"],\"correct\":0,\"rubric\":\"...\"}]}",
      "For multiple choice, correct must be an array of option indexes. For open/coding, options must be empty and correct can be 0.",
      "Avoid questions semantically similar to the questionHistory."
    ],
    grade: [
      "Grade the submitted exam answers.",
      "Return concise feedback, weak topics, and a recovery plan."
    ],
    assignment: [
      "Create a step-by-step assignment guidance plan.",
      "Return JSON only: {\"steps\":[{\"title\":\"...\",\"code\":\"...\",\"explain\":\"...\"}]}",
      "Reveal useful chunks, not the whole final answer in one step."
    ],
    recommendations: [
      "Create concise learning recommendations based on study sessions, materials, exams, and weak topics."
    ],
    study_chat: [
      "Answer the user's follow-up question inside the active preparation session.",
      "Use the preparation plan, class context, and recent chat messages.",
      "Be concise first, then add an example or check question if useful.",
      "If the user asks for something outside the available material, say what assumption you are making."
    ]
  }[task] || ["Help the user study clearly."];

  return [
    ...taskInstructions,
    "",
    `Task: ${task}`,
    "Context JSON:",
    JSON.stringify(context, null, 2)
  ].join("\n");
}

function formatProviderResult(text, model, task) {
  const result = {
    answer: text.trim(),
    model,
    source: model.includes("/") ? "huggingface" : "openai"
  };

  if (task === "exam" || task === "assignment") {
    const parsed = parseJsonFromText(text);
    if (parsed) {
      if (task === "exam") result.exam = parsed;
      if (task === "assignment") result.assignment = parsed;
    }
  }

  return result;
}

function parseJsonFromText(text) {
  const cleaned = String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

function huggingFaceModelChain() {
  const configured = [
    process.env.HF_MODEL,
    process.env.HF_FALLBACK_MODEL,
    DEFAULT_HF_MODEL,
    DEFAULT_HF_FALLBACK_MODEL
  ]
    .map((model) => String(model || "").trim())
    .filter(Boolean);

  return [...new Set(configured)];
}

function resolveModel(configuredModel) {
  const model = String(configuredModel || DEFAULT_MODEL).trim();
  return MODEL_ALIASES[model] || model || DEFAULT_MODEL;
}

function publicFailureReason(error) {
  const message = String(error?.message || "");
  if (message.includes("model") || message.includes("OpenAI error 400")) return "The configured AI model is unavailable or invalid.";
  if (message.includes("OpenAI error 401")) return "The OpenAI API key is missing or invalid.";
  if (message.includes("OpenAI error 429")) return process.env.HF_TOKEN ? "Both AI providers failed. OpenAI has no available quota, and Hugging Face also failed." : "The OpenAI account is rate limited or has no available quota.";
  if (message.includes("Hugging Face error 401")) return "The Hugging Face token is missing, invalid, or does not have inference permission.";
  if (message.includes("Hugging Face error 402") || message.includes("Hugging Face error 429")) return "The Hugging Face tier is exhausted or rate limited.";
  return "The AI provider request did not complete.";
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const output = Array.isArray(data.output) ? data.output : [];
  return output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((part) => part.text || "")
    .filter(Boolean)
    .join("\n");
}
