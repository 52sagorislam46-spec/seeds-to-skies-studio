import { createFileRoute } from "@tanstack/react-router";

// Same-origin image fetch so "Save" works even when the image host blocks cross-origin downloads.
const ALLOWED = /^(res\.cloudinary\.com|firebasestorage\.googleapis\.com|storage\.googleapis\.com|image\.pollinations\.ai|[a-z0-9-]+\.googleusercontent\.com)$/i;

export const Route = createFileRoute("/api/media-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("url") ?? "";
        let u: URL;
        try { u = new URL(raw); } catch { return new Response("Bad url", { status: 400 }); }
        if (u.protocol !== "https:" || !ALLOWED.test(u.hostname)) return new Response("Not allowed", { status: 403 });
        const res = await fetch(u.toString());
        if (!res.ok || !res.body) return new Response("Fetch failed", { status: 502 });
        const type = res.headers.get("content-type") ?? "application/octet-stream";
        if (!/^(image|video|audio)\//.test(type)) return new Response("Not media", { status: 415 });
        return new Response(res.body, { headers: { "Content-Type": type, "Cache-Control": "private, max-age=600" } });
      },
    },
  },
});
