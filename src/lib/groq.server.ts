// Free Groq helper (uses GROQ_API_KEY) — backup when Gemini fails. No Lovable credits used.
const URL_ = "https://api.groq.com/openai/v1/chat/completions";
const MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];

export type GroqMsg = { role: "system" | "user" | "assistant"; content: string };

export async function groqText(messages: GroqMsg[], signal?: AbortSignal): Promise<string | null> {
  const key = process.env["GROQ_API_KEY"];
  if (!key) return null;
  for (const model of MODELS) {
    const res = await fetch(URL_, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: signal ?? null,
      body: JSON.stringify({ model, messages }),
    }).catch(() => null);
    if (!res || !res.ok) continue;
    const data = (await res.json().catch(() => null)) as any;
    const t = data?.choices?.[0]?.message?.content;
    if (typeof t === "string" && t) return t;
  }
  return null;
}

export async function groqStream(
  messages: GroqMsg[],
  signal?: AbortSignal,
): Promise<{ stream: ReadableStream<Uint8Array> } | { status: number }> {
  const key = process.env["GROQ_API_KEY"];
  if (!key) return { status: 500 };
  let last = 500;
  for (const model of MODELS) {
    const res = await fetch(URL_, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: signal ?? null,
      body: JSON.stringify({ model, messages, stream: true }),
    }).catch(() => null);
    if (!res || !res.ok || !res.body) {
      last = res?.status ?? 500;
      console.error("groq failed", model, last);
      continue;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(c) {
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const d = line.slice(5).trim();
              if (d === "[DONE]") continue;
              try {
                const t = JSON.parse(d)?.choices?.[0]?.delta?.content;
                if (typeof t === "string") c.enqueue(enc.encode(t));
              } catch {
                /* partial */
              }
            }
          }
        } catch {
          /* stopped */
        }
        c.close();
      },
    });
    return { stream };
  }
  return { status: last };
}
