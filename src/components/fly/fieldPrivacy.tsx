/** Per-field "Public" / "Only me" visibility for profile details. */
import { Globe, Lock } from "lucide-react";
import type { UserProfile } from "./types";

export type Visibility = "public" | "private";
export const PRIVATE_FIELDS = ["birthDate", "phone", "email", "gender", "country"] as const;
export type PrivateField = (typeof PRIVATE_FIELDS)[number];
export type FieldPrivacy = Partial<Record<PrivateField, Visibility>>;

/** Phone and e-mail are hidden by default; the rest is public by default. */
export const DEFAULT_PRIVACY: Record<PrivateField, Visibility> = {
  birthDate: "public",
  phone: "private",
  email: "private",
  gender: "public",
  country: "public",
};

export function visibilityOf(p: Pick<UserProfile, "fieldPrivacy"> | null | undefined, f: PrivateField): Visibility {
  return p?.fieldPrivacy?.[f] ?? DEFAULT_PRIVACY[f];
}

/** Can `viewerUid` see field `f` of `owner`? Owner and admin always can. */
export function canSee(owner: UserProfile, f: PrivateField, viewerUid: string | undefined, viewerIsAdmin = false) {
  if (viewerIsAdmin || viewerUid === owner.uid) return true;
  return visibilityOf(owner, f) === "public";
}

export function PrivacyToggle({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const isPublic = value === "public";
  return (
    <button
      type="button"
      onClick={() => onChange(isPublic ? "private" : "public")}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
        isPublic ? "bg-sky-50 text-sky-600 border-sky-100" : "bg-gray-100 text-gray-600 border-gray-200"
      }`}
      aria-label={isPublic ? "Public — tap to make Only me" : "Only me — tap to make Public"}
    >
      {isPublic ? <Globe size={11} /> : <Lock size={11} />}
      {isPublic ? "Public" : "Only me"}
    </button>
  );
}

/** Age the person turns on `on` (birthday date). */
export function ageOn(birthDate: string, on = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate ?? "");
  if (!m) return null;
  const y = Number(m[1]);
  let age = on.getFullYear() - y;
  const md = (on.getMonth() + 1) * 100 + on.getDate();
  if (md < Number(m[2]) * 100 + Number(m[3])) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function isBirthdayToday(birthDate: string | undefined, now = new Date()) {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(birthDate ?? "");
  return !!m && Number(m[1]) === now.getMonth() + 1 && Number(m[2]) === now.getDate();
}
