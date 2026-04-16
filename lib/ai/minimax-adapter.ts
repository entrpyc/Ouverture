import type { AIAdapter, AIMessage } from "./adapter";

const ENDPOINT = "https://api.minimaxi.chat/v1/text/chatcompletion_v2";
const MODEL = "MiniMax-M1";

type MiniMaxResponse = {
  choices?: { message?: { content?: string } }[];
};

function stripMarkdownFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/i, "");
    text = text.replace(/\n?```\s*$/, "");
  }
  return text.trim();
}

export class MiniMaxAdapter implements AIAdapter {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("MiniMaxAdapter requires an apiKey");
    this.apiKey = apiKey;
  }

  async chat(messages: AIMessage[]): Promise<ReadableStream> {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true }),
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `MiniMax chat request failed (${response.status}): ${detail}`
      );
    }

    return response.body;
  }

  async complete<T>(messages: AIMessage[]): Promise<T> {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages, stream: false }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `MiniMax complete request failed (${response.status}): ${detail}`
      );
    }

    const payload = (await response.json()) as MiniMaxResponse;
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const cleaned = stripMarkdownFences(raw);

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new Error("MiniMax returned invalid JSON: " + raw);
    }
  }
}
