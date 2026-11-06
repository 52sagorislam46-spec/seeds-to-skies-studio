export const aiHistoryKey = (uid?: string | null) => `fly-ai-history:${uid ?? "guest"}`;

export const AI_WELCOME =
  "আসসালামু আলাইকুম! আমি **Fly AI** 🤖 — যেকোনো প্রশ্ন করুন। ছবি বানাতে 🖼️ বাটনে চাপ দিয়ে ছবির বর্ণনা লিখুন।\n\nHi! Ask me anything, or tap 🖼️ to create an image.";

/** Last real message of the saved Fly AI chat, or null when there is no conversation yet. */
export function aiHistoryPreview(uid?: string | null): string | null {
  try {
    const raw = localStorage.getItem(aiHistoryKey(uid));
    const items = raw ? (JSON.parse(raw) as { role: string; content: string }[]) : [];
    if (items.length < 2) return null;
    const last = items[items.length - 1];
    return (last?.content ?? "").replace(/\[\[[A-Z_]+\]\]/g, "").replace(/[*#_`>]/g, "").trim().slice(0, 80) || "ছবি";
  } catch {
    return null;
  }
}
