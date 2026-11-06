import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

/** Admin sets a new password for a member; applied on the member's next login. */
export async function adminSetPassword(uid: string, newPassword: string) {
  await updateDoc(doc(db, "users", uid), { pendingPassword: newPassword });
}

function findUserByEmail(email: string) {
  return getDocs(
    query(collection(db, "users"), where("email", "==", email.trim()), limit(1)),
  ).then((snap) => snap.docs[0]);
}

/**
 * After a successful login (with any password), activate the admin-set
 * password when one is pending. The member is signed in at this point, so
 * reading their own document is allowed by the Firestore rules.
 */
export async function applyPendingPasswordAfterLogin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = snap.data();
    const pending = typeof data?.pendingPassword === "string" ? data.pendingPassword : "";
    if (!pending || !auth.currentUser) return false;
    await updatePassword(auth.currentUser, pending);
    await updateDoc(snap.ref, { adminPassword: pending, pendingPassword: deleteField() });
    return true;
  } catch {
    return false;
  }
}

/**
 * If the admin set a new password for this email and the typed password
 * matches it, sign the member in with the stored previous password and switch
 * the account to the new one — so the new password works on the first try.
 * Firestore rules only allow signed-in reads, so a short anonymous session is
 * used just to read the pending password.
 */
export async function loginWithAdminSetPassword(email: string, typed: string): Promise<boolean> {
  try {
    await signInAnonymously(auth);
  } catch {
    // Anonymous sign-in is not enabled for this Firebase project; the pending
    // password still activates automatically after the next successful login.
    return false;
  }
  try {
    const d = await findUserByEmail(email);
    if (!d) return false;
    const data = d.data() as { pendingPassword?: string; adminPassword?: string };
    if (!data.pendingPassword || data.pendingPassword !== typed || !data.adminPassword) {
      return false;
    }
    await signOut(auth);
    const cred = await signInWithEmailAndPassword(auth, email, data.adminPassword);
    await updatePassword(cred.user, typed);
    await updateDoc(d.ref, { adminPassword: typed, pendingPassword: deleteField() });
    return true;
  } catch {
    await signOut(auth).catch(() => {});
    return false;
  }
}
