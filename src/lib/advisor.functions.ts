import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getBuildSuggestions = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ description: z.string().min(10).max(8000) }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!process.env["GEMINI_API_KEY"]) return { ok: false as const, error: "AI is not configured." };
    const { geminiStream } = await import("./gemini.server");
    const SYS =
      "You are a senior engineer and product advisor. Given a description of a build or project, give concrete, actionable improvement suggestions grouped under short markdown headings (e.g. Features, UX, Performance, Security, Code quality). Use bullet points, be specific, keep it under 400 words. Reply in the same language the user wrote in.";
    let r = await geminiStream(SYS, [{ role: "user", parts: [{ text: data.description }] }]);
    if ("status" in r) {
      const { groqStream } = await import("./groq.server");
      const g = await groqStream([{ role: "system", content: SYS }, { role: "user", content: data.description }]);
      if (!("status" in g)) r = g;
    }
    if ("status" in r) {
      return {
        ok: false as const,
        error: r.status === 429 ? "Too many requests, please try again shortly." : "Failed to generate suggestions.",
      };
    }
    const text = await new Response(r.stream).text();
    return { ok: true as const, text };
  });
