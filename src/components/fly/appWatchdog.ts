/**
 * Background watchdog: tries to recover from common failures by itself and
 * reports anything it cannot fix to the admins together with a suggested fix.
 * Runs the friends' birthday check once per day as well.
 */
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { reportToAdmins } from "./autoModeration";
import { fetchProfile } from "./chat";
import { ageOn, isBirthdayToday } from "./fieldPrivacy";
import type { UserProfile } from "./types";

function suggestFix(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("permission") || m.includes("insufficient")) return "Check Firestore security rules for this collection.";
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("offline")) return "User had a network problem; usually resolves itself. If many users report it, check hosting/Firebase status.";
  if (m.includes("chunk") || m.includes("dynamically imported module")) return "Old app version cached. Publish again; the app reloads itself once.";
  if (m.includes("quota")) return "Firebase quota reached. Upgrade the Firebase plan or reduce reads.";
  if (m.includes("getusermedia") || m.includes("notallowederror")) return "Mic/camera blocked. Ask the user to allow permissions in phone settings.";
  if (m.includes("cloudinary") || m.includes("upload")) return "Media upload failed. Check the Cloudinary upload preset and file size.";
  return "Ask the agent to fix this error with the details above.";
}

let started = false;
export function startWatchdog(getUser: () => { uid: string; name: string } | null) {
  if (started || typeof window === "undefined") return;
  started = true;
  const sent = new Map<string, number>();
  const handle = (raw: unknown) => {
    const msg = raw instanceof Error ? raw.message : String((raw as { message?: string })?.message ?? raw ?? "");
    if (!msg || msg === "undefined") return;
    // Self-heal: stale app bundle → reload once.
    if (/chunk|dynamically imported module/i.test(msg) && !sessionStorage.getItem("fly_reloaded")) {
      sessionStorage.setItem("fly_reloaded", "1");
      window.location.reload();
      return;
    }
    if (/resizeobserver|aborterror|the play\(\) request/i.test(msg)) return; // harmless noise
    const key = msg.slice(0, 120);
    const day = new Date().toDateString();
    const dayKey = `fly_err_${day}_${key}`;
    if (sent.has(key) || localStorage.getItem(dayKey)) return;
    sent.set(key, Date.now());
    localStorage.setItem(dayKey, "1");
    const u = getUser();
    void reportToAdmins(
      "App problem detected",
      `Error: ${key}\nUser: ${u?.name ?? "guest"}\nPage: ${location.pathname}\nSuggested fix: ${suggestFix(msg)}`,
      { kind: "error", uid: u?.uid ?? "" },
    );
  };
  window.addEventListener("error", (e) => handle(e.error ?? e.message));
  window.addEventListener("unhandledrejection", (e) => handle(e.reason));
}

/** Once per day: notify me about friends whose (public) birthday is today, with age. */
export async function checkFriendBirthdays(me: UserProfile) {
  const day = new Date().toDateString();
  const key = `fly_bday_${me.uid}_${day}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  const ids = Array.from(new Set([...(me.following ?? []), ...(me.followers ?? [])])).filter((id) => id !== me.uid).slice(0, 200);
  const profiles = await Promise.all(ids.map((id) => fetchProfile(id).catch(() => null)));
  for (const p of profiles) {
    if (!p?.birthDate || !isBirthdayToday(p.birthDate)) continue;
    const age = ageOn(p.birthDate);
    const text = age
      ? `আজ ${p.displayName}-এর ${age}তম জন্মদিন! শুভেচ্ছা জানান 🎉`
      : `আজ ${p.displayName}-এর জন্মদিন! শুভেচ্ছা জানান 🎉`;
    try {
      await addDoc(collection(db, "notifications"), {
        type: "admin",
        actorId: p.uid,
        actorName: `🎂 ${p.displayName}`,
        actorPhoto: p.photoURL ?? "",
        text,
        mediaUrl: "",
        recipients: [me.uid],
        readBy: [],
        createdAt: serverTimestamp(),
      });
    } catch {
      /* ignore */
    }
  }
}
