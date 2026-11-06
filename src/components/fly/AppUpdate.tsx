/**
 * "New app version" UI: a dismissible bottom banner shown to everyone when
 * the admin publishes an update, plus the shared download modal.
 */
import { useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import flyLogo from "@/assets/fly-logo.png.asset.json";
import {
  markUpdateSeen,
  startAppUpdateDownload,
  useAppUpdate,
  type AppUpdate,
} from "../../lib/appUpdate";

export function AppUpdateModal({
  update,
  onClose,
}: {
  update: AppUpdate;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setBusy(true);
    setDone(false);
    setFailed(false);
    try {
      await startAppUpdateDownload(update);
      setDone(true);
      markUpdateSeen(update.version);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-center space-y-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={flyLogo.url}
          alt="Fly"
          className="w-14 h-14 rounded-2xl object-cover mx-auto"
        />
        <h2 className="text-lg font-bold text-gray-900">
          Fly অ্যাপের নতুন ভার্সন এসেছে!
        </h2>
        <p className="text-sm font-semibold text-sky-600">
          ভার্সন {update.version}
        </p>
        {update.notes && (
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {update.notes}
          </p>
        )}
        <button
          onClick={() => void download()}
          disabled={busy}
          className="w-full h-11 rounded-2xl bg-sky-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
        >
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" /> ডাউনলোড হচ্ছে…
            </>
          ) : (
            <>
              <Download size={18} /> এখনই আপডেট করুন
            </>
          )}
        </button>
        {done && (
          <p className="text-xs font-medium text-emerald-600">
            ডাউনলোড শুরু হয়েছে! ফোনের ওপরের নোটিফিকেশনে ডাউনলোড শেষ হলে সেটিতে ট্যাপ করে "Install" চাপুন।
          </p>
        )}
        {failed && (
          <p className="text-xs font-medium text-red-500">
            ডাউনলোড শুরু হয়নি। আবার চেষ্টা করুন।
          </p>
        )}
        <button onClick={onClose} className="text-sm text-gray-400">
          পরে
        </button>
      </div>
    </div>
  );
}

export function AppUpdateBanner() {
  const { update, isNew } = useAppUpdate();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (!update || !isNew || dismissed) return null;
  return (
    <>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-lg p-4 flex items-center gap-3">
          <img
            src={flyLogo.url}
            alt="Fly"
            className="w-10 h-10 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">
              Fly অ্যাপের নতুন ভার্সন এসেছে!
            </p>
            <p className="text-xs text-gray-500 truncate">
              ভার্সন {update.version} — নতুন ফিচার পেতে আপডেট করুন।
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 h-9 px-3 rounded-full bg-sky-500 text-white text-xs font-semibold active:scale-95 transition-transform"
          >
            Update Now
          </button>
          <button
            onClick={() => {
              setDismissed(true);
              markUpdateSeen(update.version);
            }}
            aria-label="Dismiss"
            className="shrink-0 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      {showModal && (
        <AppUpdateModal update={update} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
