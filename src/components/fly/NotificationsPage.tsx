import { useState } from "react";
import { ArrowLeft, CheckCheck, Bell, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAuth } from "./AuthContext";
import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationLabel,
  useAppNotifications,
  type AppNotification,
} from "../../lib/appNotifications";


function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsPage({
  onBack,
  onOpenProfile,
}: {
  onBack: () => void;
  onOpenProfile: (uid: string) => void;
}) {
  const { user } = useAuth();
  const { items } = useAppNotifications(user?.uid);
  const [open, setOpen] = useState<AppNotification | null>(null);

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 h-14 flex items-center gap-3 z-10">
        <button onClick={onBack} aria-label="Back" className="text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={() => user && void markAllNotificationsRead(items, user.uid)}
          aria-label="Mark all as read"
          className="ml-auto w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <CheckCheck size={17} />
        </button>
      </header>



      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-gray-400">
          <Bell size={30} />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <ul>
          {items.map((n) => {
            const unread = !!user && !n.readBy.includes(user.uid);
            return (
              <li key={n.id}>
                <button
                  onClick={() => {
                    if (user && unread) void markNotificationRead(n.id, user.uid);
                    setOpen(n);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left ${
                    unread ? "bg-sky-50/70" : "bg-white"
                  }`}
                >
                  <Avatar uid={n.actorId} src={n.actorPhoto} alt={n.actorName} size={52} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-gray-900 leading-snug">
                      <span className="font-bold">{n.actorName}</span>{" "}
                      {notificationLabel(n)}
                    </p>
                    {n.text && (
                      <p className="text-sm text-gray-500 truncate">{n.text}</p>
                    )}
                    <p
                      className={`text-xs mt-0.5 ${
                        unread ? "text-sky-600 font-semibold" : "text-gray-400"
                      }`}
                    >
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {n.mediaUrl && (
                    <img
                      src={n.mediaUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    />
                  )}
                  {unread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-2" />
                  )}
                </button>
                {unread && (
                  <div className="flex items-center gap-3 px-4 pb-3 -mt-1">
                    <button
                      onClick={() =>
                        user && void markNotificationRead(n.id, user.uid)
                      }
                      className="text-xs font-semibold text-sky-600"
                    >
                      Mark as read
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Avatar uid={open.actorId} src={open.actorPhoto} alt={open.actorName} size={48} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{open.actorName}</p>
                <p className="text-xs text-gray-400">
                  {new Date(open.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close" className="text-gray-500">
                <X size={22} />
              </button>
            </div>
            <p className="mt-4 text-[15px] text-gray-700">{notificationLabel(open)}</p>
            {open.text && (
              <p className="mt-2 text-base text-gray-900 whitespace-pre-wrap break-words">
                {open.text}
              </p>
            )}
            {open.mediaUrl && (
              <img src={open.mediaUrl} alt="" className="mt-4 w-full rounded-xl object-cover" />
            )}
            {open.actorId !== "fly-admin" && (
              <button
                onClick={() => {
                  const id = open.actorId;
                  setOpen(null);
                  onOpenProfile(id);
                }}
                className="mt-5 w-full h-11 rounded-xl bg-sky-500 text-white font-semibold"
              >
                প্রোফাইল দেখুন
              </button>
            )}
            <button
              onClick={() => setOpen(null)}
              className="mt-3 w-full h-11 rounded-xl bg-gray-100 text-gray-800 font-semibold"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
