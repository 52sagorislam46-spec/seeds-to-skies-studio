/** Client helpers for e-mail verification codes (see /api/email-otp). */
export type OtpSend = { configured: false } | { configured: true; token: string };

export async function sendEmailCode(email: string, purpose: "signup" | "login"): Promise<OtpSend> {
  const res = await fetch("/api/email-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "send", email: email.trim(), purpose }),
  });
  const data = (await res.json().catch(() => ({}))) as { configured?: boolean; token?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "কোড পাঠানো যায়নি");
  if (data.configured && data.token) return { configured: true, token: data.token };
  return { configured: false };
}

export async function verifyEmailCode(email: string, code: string, token: string) {
  const res = await fetch("/api/email-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", email: email.trim(), code, token }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!data.ok) throw new Error(data.error ?? "ভুল কোড");
}
