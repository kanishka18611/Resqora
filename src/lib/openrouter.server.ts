type OpenRouterContent =
  string | { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

type OpenRouterInput = {
  system: string;
  user: OpenRouterContent;
  temperature: number;
  maxTokens: number;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemma-3-27b-it:free";

export async function runOpenRouter(input: OpenRouterInput): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("AI is not configured");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:8080",
      "X-Title": "RESQORA",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      temperature: input.temperature,
      max_tokens: input.maxTokens,
    }),
  });

  if (response.status === 429) throw new Error("AI is busy right now — please retry in a moment.");
  if (response.status === 401 || response.status === 403)
    throw new Error("AI is not properly configured.");
  if (!response.ok) throw new Error(`AI request failed (${response.status})`);

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | OpenRouterContent[] } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n");
  }
  return "";
}
