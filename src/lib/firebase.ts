import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfzHhkNtrs3A_soHAWE51le-zrlbeXulc",
  authDomain: "fly-c7445.firebaseapp.com",
  projectId: "fly-c7445",
  storageBucket: "fly-c7445.firebasestorage.app",
  messagingSenderId: "48342961325",
  appId: "1:48342961325:web:2a185f173692aec3a28a24",
  measurementId: "G-QGE3YJ5H21",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// In the browser keep a local copy of data so chats/posts show offline and
// messages sent offline are queued and delivered when the connection returns.
function createDb() {
  if (typeof window === "undefined") return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(app);
  }
}
export const db = createDb();

const CLOUD_NAME = "xl2cfqi1";
const UPLOAD_PRESET = "social_upload";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

export function secureUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  return trimmed ? trimmed.replace(/^http:\/\//i, "https://") : "";
}

export async function uploadToCloudinary(
  file: File,
): Promise<{ url: string; resourceType: string }> {
  // Audio recordings are sometimes rejected by /auto ("Unsupported video
  // format"), so audio falls back to /video then /raw.
  const isAudio = file.type.startsWith("audio/");
  const endpoints = isAudio ? ["auto", "video", "raw"] : ["auto"];
  let data: { secure_url?: string; resource_type?: string; error?: { message?: string } } = {};
  let url = "";
  for (const ep of endpoints) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(`${CLOUDINARY_URL}/${ep}/upload`, { method: "POST", body: form });
      data = await res.json();
      url = secureUrl(data.secure_url);
      if (res.ok && /^https:\/\//.test(url)) break;
    } catch {
      /* try next */
    }
    url = "";
  }
  if (!url) {
    throw new Error(
      data?.error?.message ?? "Cloudinary upload failed. Check the upload preset.",
    );
  }
  const resourceType =
    data.resource_type ?? (file.type.startsWith("video/") ? "video" : "image");
  return { url, resourceType };
}

export const isVideoFile = (file: File) => file.type.startsWith("video/");

export const DEFAULT_AVATAR =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=FlyUser";
