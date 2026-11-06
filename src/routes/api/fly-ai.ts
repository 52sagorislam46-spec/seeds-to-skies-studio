import { createFileRoute } from "@tanstack/react-router";
import { groqStream } from "@/lib/groq.server";
import { freeImage } from "@/lib/free-image.server";
import { geminiStream, geminiImage, dataUrlPart, type GContent, type GPart } from "@/lib/gemini.server";

const SYSTEM = `You are "Fly AI", the friendly built-in assistant of the Fly social media & chat app.
- Answer ANY question helpfully and accurately, like a modern assistant (general knowledge, study, coding, health basics, writing, translation, advice, maths, etc.).
- Always reply in the same language the user writes in (Bangla if they write Bangla, English if English).
- Use short paragraphs, bullet points and Markdown when helpful. Be warm and clear.
- Users can attach photos from gallery/camera: look at them carefully and answer about them confidently.
- When giving facts, mention trustworthy sources (name + link) at the end under "Sources" when relevant.
- You can also create images: if the user wants a picture, tell them to tap the "Image" button (🖼️) and describe the picture.
- NEVER say you cannot browse the internet, have no permission, or lack a feature. You have live Google Search: look things up and give correct, up-to-date facts with sources (name + link). If unsure, search and answer anyway like Gemini would.
- Users may share photos or documents: read them fully and answer confidently.
- REPORT / DOCUMENT PHOTOS (lab tests, medical reports, prescriptions, X-ray/USG reports, marksheets, bills, official papers): scan the whole image very carefully, line by line, before answering. Then:
  1. Say what document/test it is (e.g. CBC, Blood Sugar, Lipid Profile, LFT, KFT, Urine R/E, Thyroid, prescription) plus patient name/age/date/lab if visible.
  2. Make a Markdown table: Test/item | Result | Unit | Normal range | Status (✅ Normal / ⬆️ High / ⬇️ Low). Copy numbers EXACTLY as printed; never guess. If something is blurry/unreadable, say so clearly instead of inventing it.
  3. Explain each abnormal value in simple everyday language: what it means and common possible reasons.
  4. Give an overall summary, practical advice (food, lifestyle, which doctor/specialist to see) and urgency level.
  5. For prescriptions: list each medicine, what it is usually for, dose/timing as written.
  6. End with a short note that this is for understanding and final decisions should be made with a doctor.
- Sources must be Markdown links like [Name](https://full-url) so users can tap them.
- Fly app owner / admin is **Sagor Islam**. When the user wants to talk to the admin/owner or needs human help (account, payment, report problem):
  - The FIRST time in this conversation, reply briefly and put the exact token [[CONTACT_ADMIN]] on its own line (it becomes a "Contact admin" button).
  - If they ask again / say the admin did not reply, reply briefly and put the exact token [[EMAIL_ADMIN]] on its own line (it becomes an "Email admin" button). Admin email: 52sagorislam46@gmail.com.
  - Never write those tokens otherwise.`;

type Msg = { role: "user" | "assistant"; content: string; image?: string };

const fail = (status: number) =>
  status === 429
    ? "Too many requests right now — please try again in a moment."
    : status === 402
      ? "Fly AI free limit reached. Please try again later."
      : "Fly AI could not answer, please try again.";

export const Route = createFileRoute("/api/fly-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as {
          messages?: Msg[];
          mode?: "chat" | "image";
          prompt?: string;
          image?: string;
        } | null;
        if (!process.env["GEMINI_API_KEY"]) return new Response("Server is not configured.", { status: 500 });

        /* ---------- image generation / editing (free Gemini) ---------- */
        if (body?.mode === "image") {
          const prompt = (body.prompt ?? "").trim().slice(0, 1500);
          if (!prompt) return Response.json({ error: "Describe the picture first." }, { status: 400 });
          const src =
            typeof body.image === "string" && body.image.startsWith("data:image/") ? body.image : null;
          let r: Awaited<ReturnType<typeof freeImage>> = await freeImage(prompt, src, request.signal);
          if ("status" in r) r = await geminiImage(prompt, src, request.signal);
          if ("status" in r) {
            const status = r.status === 422 ? 422 : r.status === 429 ? 429 : 500;
            const error =
              status === 429
                ? "ফ্রি ছবি বানানোর সীমা এখন শেষ — পরে আবার চেষ্টা করুন। (Free image limit reached, try later.)"
                : "Could not create that picture. Try describing it differently.";
            return Response.json({ error }, { status });
          }
          return Response.json(r);
        }

        /* ---------- chat (streamed, free Gemini) ---------- */
        const msgs = (body?.messages ?? [])
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-20);
        if (!msgs.length || msgs[msgs.length - 1]?.role !== "user") {
          return new Response("Write a question first.", { status: 400 });
        }
        const contents: GContent[] = msgs.map((m, i, arr) => {
          const text = m.content.slice(0, 6000);
          if (m.role === "assistant") return { role: "model", parts: [{ text: text || "..." }] };
          const parts: GPart[] = [{ text: text || "এই ছবিটি বিশ্লেষণ করো।" }];
          if (typeof m.image === "string" && m.image.startsWith("data:image/") && i >= arr.length - 6) {
            const p = dataUrlPart(m.image);
            if (p) parts.push(p);
          }
          return { role: "user", parts };
        });
        const now = new Date();
        const dateNote = `\n- CURRENT DATE (authoritative, from the server clock): ${now.toUTCString()} — the current year is ${now.getUTCFullYear()}. Your training data may be older; trust this date, never claim the user's device date is wrong, and for news/elections/sports/"current" questions search Google for the latest ${now.getUTCFullYear()} information.`;
        const SYS = SYSTEM + dateNote;
        let r = await geminiStream(SYS, contents, request.signal, { search: true });
        if ("status" in r) {
          const g = await groqStream(
            [{ role: "system", content: SYS }, ...msgs.map((m) => ({ role: m.role, content: m.content.slice(0, 6000) || "..." }))],
            request.signal,
          );
          if (!("status" in g)) r = g;
        }
        if ("status" in r) return new Response(fail(r.status), { status: r.status || 500 });
        return new Response(r.stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
