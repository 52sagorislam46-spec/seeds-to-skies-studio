// Completely free image engine (Pollinations / Flux) — no key, no Lovable credits.
import { groqText } from "./groq.server";
import { dataUrlPart } from "./gemini.server";

/** Turns a Bangla/any prompt (and optional photo) into a detailed English art prompt. */
async function englishPrompt(prompt: string, src: string | null, signal?: AbortSignal): Promise<string> {
  // With a photo: let free Gemini vision describe the photo + requested edit.
  if (src && process.env["GEMINI_API_KEY"]) {
    const part = dataUrlPart(src);
    if (part) {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": process.env["GEMINI_API_KEY"]! },
          signal: signal ?? null,
          body: JSON.stringify({
            contents: [{ role: "user", parts: [
              { text: `Describe this photo in detail as one English image-generation prompt (under 80 words), applying this change: "${prompt}". Output only the prompt.` },
              part,
            ] }],
          }),
        },
      ).catch(() => null);
      const data = res?.ok ? ((await res.json().catch(() => null)) as any) : null;
      const t = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("").trim();
      if (t) return t;
    }
  }
  const t = await groqText(
    [
      { role: "system", content: "Rewrite the user's picture request as one vivid English image-generation prompt under 60 words. Output only the prompt." },
      { role: "user", content: prompt },
    ],
    signal,
  );
  return (t ?? prompt).trim().replace(/^"|"$/g, "");
}

export async function freeImage(
  prompt: string,
  src: string | null,
  signal?: AbortSignal,
): Promise<{ image: string; text: string } | { status: number }> {
  const p = (await englishPrompt(prompt, src, signal)).slice(0, 900);
  const seed = Math.floor(Math.random() * 1e9);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
  for (let i = 0; i < 2; i++) {
    const res = await fetch(url, { signal: signal ?? null }).catch(() => null);
    if (!res || !res.ok) continue;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) continue;
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let j = 0; j < buf.length; j += 0x8000) bin += String.fromCharCode(...buf.subarray(j, j + 0x8000));
    return { image: `data:${type};base64,${btoa(bin)}`, text: "" };
  }
  return { status: 500 };
}
