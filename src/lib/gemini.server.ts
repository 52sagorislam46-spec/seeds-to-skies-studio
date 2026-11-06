// Free Google Gemini helper (uses GEMINI_API_KEY) — no Lovable AI credits used.
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const CHAT_MODELS = ["gemini-3-flash-preview", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
const IMAGE_MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];

export type GPart = { text: string } | { inlineData: { mimeType: string; data: string } };
export type GContent = { role: "user" | "model"; parts: GPart[] };

export function dataUrlPart(url: string): GPart | null {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(url);
  return m ? { inlineData: { mimeType: m[1] ?? "image/jpeg", data: m[2] ?? "" } } : null;
}

export function geminiKey() {
  return process.env["GEMINI_API_KEY"];
}

/** Streams plain text. Tries several free models in order. Returns null + status on failure. */
export async function geminiStream(
  system: string,
  contents: GContent[],
  signal?: AbortSignal,
  opts?: { search?: boolean },
): Promise<{ stream: ReadableStream<Uint8Array> } | { status: number }> {
  const key = geminiKey();
  if (!key) return { status: 500 };
  let lastStatus = 500;
  const attempts = CHAT_MODELS.flatMap((model) => (opts?.search ? [{ model, search: true }, { model, search: false }] : [{ model, search: false }]));
  for (const { model, search } of attempts) {
    const res = await fetch(`${BASE}/${model}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: signal ?? null,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        ...(search ? { tools: [{ google_search: {} }] } : {}),
      }),
    }).catch(() => null);
    if (!res || !res.ok || !res.body) {
      lastStatus = res?.status ?? 500;
      console.error("gemini chat failed", model, lastStatus);
      continue;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buf = "";
        let wrote = "";
        const sources = new Map<string, string>();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              try {
                const ev = JSON.parse(line.slice(5).trim());
                const parts = ev?.candidates?.[0]?.content?.parts ?? [];
                for (const p of parts) if (typeof p.text === "string" && !p.thought) { wrote += p.text; controller.enqueue(enc.encode(p.text)); }
                for (const c of ev?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []) {
                  if (c?.web?.uri) sources.set(c.web.uri, c.web.title || c.web.uri);
                }
              } catch {
                /* partial */
              }
            }
          }
        } catch {
          /* client stopped */
        }
        if (sources.size && !/sources|সূত্র/i.test(wrote.slice(-400))) {
          const list = [...sources].slice(0, 5).map(([u, t]) => `- [${t}](${u})`).join("\n");
          try { controller.enqueue(enc.encode(`\n\n**সূত্র (Sources):**\n${list}`)); } catch { /* closed */ }
        }
        controller.close();
      },
    });
    return { stream };
  }
  return { status: lastStatus };
}

/** Generates/edits an image. Returns data URL or error status. */
export async function geminiImage(
  prompt: string,
  src: string | null,
  signal?: AbortSignal,
): Promise<{ image: string; text: string } | { status: number }> {
  const key = geminiKey();
  if (!key) return { status: 500 };
  const parts: GPart[] = [{ text: src ? `Edit this photo as asked, keep everything else the same: ${prompt}` : prompt }];
  const img = src ? dataUrlPart(src) : null;
  if (img) parts.push(img);
  let lastStatus = 500;
  for (const model of IMAGE_MODELS) {
    const res = await fetch(`${BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: signal ?? null,
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
    }).catch(() => null);
    if (!res || !res.ok) {
      lastStatus = res?.status ?? 500;
      continue;
    }
    const data = (await res.json()) as any;
    const out = data?.candidates?.[0]?.content?.parts ?? [];
    const pic = out.find((p: any) => p.inlineData?.data);
    const text = out.filter((p: any) => typeof p.text === "string").map((p: any) => p.text).join("");
    if (pic) return { image: `data:${pic.inlineData.mimeType || "image/png"};base64,${pic.inlineData.data}`, text };
    lastStatus = 422;
  }
  return { status: lastStatus };
}
