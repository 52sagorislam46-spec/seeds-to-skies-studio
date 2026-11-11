import { createFileRoute } from "@tanstack/react-router";

// Speech/audio file → text using free Groq Whisper (GROQ_API_KEY).
export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["GROQ_API_KEY"];
        if (!key) return Response.json({ error: "Not configured." }, { status: 500 });
        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        if (!(file instanceof File) || !file.size) return Response.json({ error: "অডিও ফাইল দিন।" }, { status: 400 });
        if (file.size > 24 * 1024 * 1024) return Response.json({ error: "ফাইল ২৫MB এর কম হতে হবে।" }, { status: 400 });
        const out = new FormData();
        out.append("file", file, file.name || "audio.webm");
        out.append("model", "whisper-large-v3");
        out.append("response_format", "json");
        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: out,
        });
        if (!res.ok) {
          const detail = await res.text();
          console.error(`Groq STT failed [${res.status}]: ${detail}`);
          return Response.json({ error: "ভয়েস থেকে লেখা বানানো যায়নি।" }, { status: res.status });
        }
        const data = (await res.json()) as { text?: string };
        return Response.json({ text: (data.text ?? "").trim() });
      },
    },
  },
});
