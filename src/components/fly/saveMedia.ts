/** Save any image/audio (data URL, blob URL or remote URL) to the phone. */
async function toBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:") || src.startsWith("blob:")) return (await fetch(src)).blob();
  try {
    const r = await fetch(src, { mode: "cors" });
    if (r.ok) return await r.blob();
  } catch { /* fall through to proxy */ }
  const r = await fetch(`/api/media-proxy?url=${encodeURIComponent(src)}`);
  if (!r.ok) throw new Error("download failed");
  return r.blob();
}

export async function saveMedia(src: string, name: string): Promise<"saved" | "shared" | "opened"> {
  try {
    const blob = await toBlob(src);
    const file = new File([blob], name, { type: blob.type || "application/octet-stream" });
    // Installed apps (WebView/TWA) often ignore <a download>; the share sheet lets users "Save to device".
    const standalone = typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches;
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    if (standalone && nav.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return "shared"; } catch { /* user closed */ }
    }
    return "saved";
  } catch {
    window.open(src, "_blank", "noopener,noreferrer");
    return "opened";
  }
}
