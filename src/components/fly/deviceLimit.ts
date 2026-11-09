/**
 * Limits how many accounts can be created from one phone/browser.
 * Uses a device id kept in local storage plus a shared record in the
 * database so the count survives logging out.
 */
import { arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export const MAX_ACCOUNTS_PER_DEVICE = 5;
const ID_KEY = "fly_device_id";
const LIST_KEY = "fly_device_accounts";

export function deviceId(): string {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

function localList(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** True when the limit is reached for this device. */
export function isLimitReached(count: number) {
  return count >= MAX_ACCOUNTS_PER_DEVICE;
}

export async function accountsOnDevice(): Promise<number> {
  const local = localList();
  let remote: string[] = [];
  try {
    const snap = await getDoc(doc(db, "deviceAccounts", deviceId()));
    const uids = snap.data()?.["uids"];
    if (Array.isArray(uids)) remote = uids as string[];
  } catch {
    /* fall back to local list */
  }
  return new Set([...local, ...remote]).size;
}

export async function assertCanCreateAccount() {
  if (isLimitReached(await accountsOnDevice())) {
    throw new Error(`এই ডিভাইস থেকে সর্বোচ্চ ${MAX_ACCOUNTS_PER_DEVICE}টি অ্যাকাউন্ট খোলা যায় — সীমা পূর্ণ হয়ে গেছে।`);
  }
}

export async function recordAccountOnDevice(uid: string) {
  try {
    const list = Array.from(new Set([...localList(), uid]));
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
  try {
    await setDoc(doc(db, "deviceAccounts", deviceId()), { uids: arrayUnion(uid), updatedAt: Date.now() }, { merge: true });
  } catch { /* best effort */ }
}
