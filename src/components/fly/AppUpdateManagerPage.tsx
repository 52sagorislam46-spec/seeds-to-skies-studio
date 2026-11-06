/**
 * Admin page: publish a new app version (APK download link, version number
 * and release notes). Publishing notifies every user automatically.
 */
import { useState } from "react";
import { ArrowLeft, Loader2, Rocket, Trash2 } from "lucide-react";
import { deleteAppUpdate, publishAppUpdate, useAppUpdate } from "../../lib/appUpdate";

export function AppUpdateManagerPage({ onBack }: { onBack: () => void }) {
  const { update } = useAppUpdate();
  const [version, setVersion] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত এই আপডেটটি মুছে ফেলতে চান?")) return;
    setDeleting(true);
    setMsg("");
    try {
      await deleteAppUpdate();
      setOk(true);
      setMsg("🗑️ আপডেট ডিলিট হয়েছে। ইউজাররা আর এটি দেখবে না।");
    } catch {
      setOk(false);
      setMsg("ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setDeleting(false);
    }
  };

  const publish = async () => {
    if (!version.trim() || !url.trim()) {
      setOk(false);
      setMsg("ভার্সন নম্বর ও ডাউনলোড লিংক — দুটোই দিন।");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await publishAppUpdate({
        version: version.trim(),
        downloadUrl: url.trim(),
        notes: notes.trim(),
      });
      setOk(true);
      setMsg("✅ আপডেট পাবলিশ হয়েছে! সব ইউজার নোটিফিকেশন পেয়ে গেছে।");
      setVersion("");
      setUrl("");
      setNotes("");
    } catch {
      setOk(false);
      setMsg("পাবলিশ করা যায়নি। ইন্টারনেট চেক করে আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-gray-100 h-14 px-4 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">App Update Manager</h1>
      </header>
      <div className="p-4 space-y-4">
        {/* Currently published update */}
        <div className="rounded-2xl bg-white border border-gray-100 p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            সর্বশেষ পাবলিশ করা আপডেট
          </p>
          {update ? (
            <>
              <p className="font-semibold text-gray-900">
                ভার্সন {update.version}
              </p>
              {update.notes && (
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {update.notes}
                </p>
              )}
              <p className="text-xs text-gray-400 break-all">
                {update.downloadUrl}
              </p>
              <p className="text-xs text-gray-400">
                পাবলিশ: {new Date(update.publishedAt).toLocaleString()}
              </p>
              <button
                onClick={() => void remove()}
                disabled={deleting}
                className="mt-2 w-full h-10 rounded-xl bg-red-50 text-red-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                আপডেট ডিলিট করুন
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              এখনো কোনো আপডেট পাবলিশ করা হয়নি।
            </p>
          )}
        </div>

        {/* Publish form */}
        <div className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              নতুন ভার্সন নম্বর
            </label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="যেমন: v1.1"
              className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-800 outline-none focus:border-sky-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              নতুন APK / ডাউনলোড লিংক
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… (সরাসরি .apk লিংক)"
              inputMode="url"
              className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-800 outline-none focus:border-sky-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              রিলিজ নোট (নতুন কী যোগ হলো)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="যেমন: নতুন রিলস ফিচার ও বাগ ফিক্স"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-800 outline-none focus:border-sky-300"
            />
          </div>
          {msg && (
            <p
              className={`text-sm font-medium ${ok ? "text-emerald-600" : "text-red-500"}`}
            >
              {msg}
            </p>
          )}
          <button
            onClick={() => void publish()}
            disabled={busy}
            className="w-full h-11 rounded-2xl bg-sky-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
          >
            {busy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Rocket size={18} />
            )}
            আপডেট পাবলিশ করুন
          </button>
          <p className="text-xs text-gray-400">
            পাবলিশ করলেই সব ইউজারের কাছে নোটিফিকেশন চলে যাবে এবং অ্যাপের
            ভেতরে ডাউনলোড আইকনে লাল ব্যাজ দেখা যাবে।
          </p>
        </div>
      </div>
    </div>
  );
}
