import { createFileRoute } from "@tanstack/react-router";

/**
 * Stateless e-mail one-time codes (sign-up and login).
 * send   → creates a 6-digit code, mails it via the connected Gmail account,
 *          returns a signed token (code is never returned).
 * verify → checks the code against the signed token.
 */
const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send";
const TTL_MS = 10 * 60 * 1000;

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlText = (s: string) => b64url(enc.encode(s));

async function sign(data: string) {
  const secret = process.env["OTP_SECRET"] ?? "";
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data))));
}

function validEmail(e: unknown): e is string {
  return typeof e === "string" && e.length < 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function mimeMessage(to: string, code: string, purpose: string) {
  const subject = `Fly verification code: ${code}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
<h2 style="color:#0ea5e9;margin:0 0 12px">Fly</h2>
<p>Your ${purpose === "signup" ? "sign-up" : "login"} code is:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:16px 0">${code}</p>
<p style="color:#666;font-size:13px">এই কোডটি ১০ মিনিট পর্যন্ত কাজ করবে। কাউকে কোডটি দেবেন না।<br/>This code expires in 10 minutes.</p></div>`;
  const raw = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].join("\r\n");
  return b64urlText(raw);
}

export const Route = createFileRoute("/api/email-otp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as {
          action?: string; email?: string; code?: string; token?: string; purpose?: string;
        } | null;
        if (!body || !validEmail(body.email)) return Response.json({ error: "Invalid email" }, { status: 400 });
        const email = body.email.trim().toLowerCase();
        if (!process.env["OTP_SECRET"]) return Response.json({ configured: false });

        if (body.action === "send") {
          const lovableKey = process.env["LOVABLE_API_KEY"];
          const gmailKey = process.env["GOOGLE_MAIL_API_KEY"];
          if (!lovableKey || !gmailKey) return Response.json({ configured: false });
          const n = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
          const code = String(n % 1_000_000).padStart(6, "0");
          const exp = Date.now() + TTL_MS;
          const res = await fetch(GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": gmailKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw: mimeMessage(email, code, body.purpose === "signup" ? "signup" : "login") }),
          });
          if (!res.ok) {
            console.error(`OTP mail failed [${res.status}]: ${await res.text()}`);
            return Response.json({ error: "কোড পাঠানো যায়নি, আবার চেষ্টা করুন।" }, { status: 502 });
          }
          const token = `${exp}.${await sign(`${email}|${code}|${exp}`)}`;
          return Response.json({ configured: true, token });
        }

        if (body.action === "verify") {
          const [expStr, sig] = String(body.token ?? "").split(".");
          const exp = Number(expStr);
          const code = String(body.code ?? "").trim();
          if (!exp || !sig || !/^\d{6}$/.test(code)) return Response.json({ ok: false, error: "ভুল কোড" });
          if (Date.now() > exp) return Response.json({ ok: false, error: "কোডের মেয়াদ শেষ, নতুন কোড নিন।" });
          const ok = (await sign(`${email}|${code}|${exp}`)) === sig;
          return Response.json(ok ? { ok: true } : { ok: false, error: "ভুল কোড" });
        }
        return Response.json({ error: "Unknown action" }, { status: 400 });
      },
    },
  },
});
