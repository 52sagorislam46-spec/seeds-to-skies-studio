import { createFileRoute } from "@tanstack/react-router";

// Text → speech in the owner's cloned voice (Cartesia, key in the "Voicekey" secret).
const VOICE_ID = "eaf6e598-18d5-4895-8b86-dc4ac7ba1c07";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["Voicekey"];
        if (!key) return Response.json({ error: "Voice is not configured." }, { status: 500 });
        const body = (await request.json().catch(() => null)) as { text?: string } | null;
        const text = (body?.text ?? "")
          .replace(/\[\[(CONTACT_ADMIN|EMAIL_ADMIN)\]\]/g, "")
          .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
          .replace(/[*#_`>|~]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 2500);
        if (!text) return Response.json({ error: "No text to read." }, { status: 400 });
        const language = /[\u0980-\u09FF]/.test(text) ? "bn" : /[\u0900-\u097F]/.test(text) ? "hi" : "en";
        const res = await fetch("https://api.cartesia.ai/tts/bytes", {
          method: "POST",
          headers: { "Cartesia-Version": "2025-04-16", "X-API-Key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            model_id: "sonic-3",
            transcript: text,
            voice: { mode: "id", id: VOICE_ID },
            language,
            output_format: { container: "mp3", sample_rate: 44100, bit_rate: 128000 },
          }),
        });
        if (!res.ok) {
          const detail = await res.text();
          console.error(`Cartesia TTS failed [${res.status}]: ${detail}`);
          const error = res.status === 402 || /credit|quota/i.test(detail)
            ? "ভয়েস ক্রেডিট শেষ — পরে চেষ্টা করুন।"
            : "ভয়েস তৈরি করা যায়নি, আবার চেষ্টা করুন।";
          return Response.json({ error }, { status: res.status });
        }
        return new Response(res.body, { headers: { "Content-Type": "audio/mpeg" } });
      },
    },
  },
});
