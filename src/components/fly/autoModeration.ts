/**
 * Automatic content guard: blocks abusive posts, counts strikes, suspends
 * repeat offenders for a day, and reports every case to the Fly admins.
 * Admins can lift any suspension from the Members page.
 */
import { addDoc, collection, doc, getDocs, increment, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { notifyAdminNotice } from "../../lib/appNotifications";
import { ADMIN_EMAILS, ADMIN_USERNAMES } from "./admins";

const BAD_WORDS = [
  "fuck", "fucking", "bitch", "bastard", "motherfucker", "slut", "whore", "porn", "xxx", "nude", "rape", "kill you",
  "চুদ", "চোদ", "খানকি", "মাগি", "মাগী", "শুয়োর", "কুত্তার বাচ্চা", "হারামজাদা", "হারামি", "বেশ্যা", "মাদারচোদ", "বোকাচোদা",
  "chod", "khanki", "magi", "harami", "haramjada", "madarchod", "bokachoda", "kuttar bacca",
];

/** Strikes before an automatic temporary suspension kicks in. */
export const STRIKES_BEFORE_SUSPEND = 3;
export const AUTO_SUSPEND_HOURS = 24;

export function findBadWords(text: string): string[] {
  const t = (text ?? "").toLowerCase();
  return BAD_WORDS.filter((w) => t.includes(w));
}

let adminCache: string[] | null = null;
export async function adminUids(): Promise<string[]> {
  if (adminCache) return adminCache;
  const ids = new Set<string>();
  try {
    const u = await getDocs(query(collection(db, "users"), where("username", "in", ADMIN_USERNAMES)));
    u.docs.forEach((d) => ids.add(d.id));
    if (ADMIN_EMAILS.length) {
      const e = await getDocs(query(collection(db, "users"), where("email", "in", ADMIN_EMAILS)));
      e.docs.forEach((d) => ids.add(d.id));
    }
  } catch {
    /* ignore */
  }
  adminCache = [...ids];
  return adminCache;
}

export async function reportToAdmins(title: string, text: string, extra: Record<string, unknown> = {}) {
  try {
    await addDoc(collection(db, "adminReports"), { title, text, ...extra, createdAt: serverTimestamp() });
  } catch {
    /* ignore */
  }
  const admins = await adminUids();
  await Promise.all(admins.map((uid) => notifyAdminNotice({ uid, title, text })));
}

/**
 * Check text before publishing. Returns an error message to show (and the
 * post must not be saved) or null when the text is clean.
 */
export async function guardContent(input: {
  uid: string;
  displayName: string;
  username: string;
  text: string;
  where: string;
}): Promise<string | null> {
  const hits = findBadWords(input.text);
  if (!hits.length) return null;
  const key = `fly_strikes_${input.uid}`;
  const strikes = Number(localStorage.getItem(key) ?? "0") + 1;
  localStorage.setItem(key, String(strikes));
  try {
    await updateDoc(doc(db, "users", input.uid), { moderationStrikes: increment(1) });
  } catch {
    /* ignore */
  }
  let suspended = false;
  if (strikes >= STRIKES_BEFORE_SUSPEND) {
    const until = Date.now() + AUTO_SUSPEND_HOURS * 3600_000;
    try {
      await updateDoc(doc(db, "users", input.uid), {
        suspendedUntil: until,
        suspendedReason: "আপত্তিকর কনটেন্ট বারবার পোস্ট করার কারণে আপনার অ্যাকাউন্ট ২৪ ঘণ্টার জন্য স্বয়ংক্রিয়ভাবে সাসপেন্ড করা হয়েছে।",
      });
      suspended = true;
      localStorage.setItem(key, "0");
    } catch {
      /* ignore */
    }
  }
  void reportToAdmins(
    suspended ? "Auto-suspended user" : "Blocked abusive content",
    `${input.displayName} (@${input.username}) tried to post in ${input.where}: "${input.text.slice(0, 140)}". ` +
      `Matched: ${hits.join(", ")}. Strike ${strikes}/${STRIKES_BEFORE_SUSPEND}. ` +
      (suspended
        ? `The account is suspended for ${AUTO_SUSPEND_HOURS}h. Open Members to lift or extend it.`
        : "Content was blocked. Open Members to warn or suspend if needed."),
    { kind: "moderation", uid: input.uid },
  );
  return suspended
    ? "আপত্তিকর কনটেন্টের কারণে আপনার অ্যাকাউন্ট ২৪ ঘণ্টার জন্য সাসপেন্ড হয়েছে। অ্যাডমিনকে জানানো হয়েছে।"
    : `এই লেখায় আপত্তিকর শব্দ আছে, তাই পোস্ট করা যাবে না। (সতর্কতা ${strikes}/${STRIKES_BEFORE_SUSPEND})`;
}
