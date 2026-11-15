
import { useState } from "react";
import { Bell, Check } from "lucide-react";

const initialNotifications = [
  { id: 1, title: "Riya Sharma liked your travel story", detail: "Upper Lake, Bhopal · 20 minutes ago", unread: true },
  { id: 2, title: "A new discussion started in Bhopal Community", detail: "Best places for a weekend breakfast · 2 hours ago", unread: true },
  { id: 3, title: "Arjun Verma shared a travel guide", detail: "A three-day trip to Manali · Yesterday", unread: false },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);

  function markAllRead() {
    setNotifications((items) => items.map((item) => ({ ...item, unread: false })));
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Notifications</h1>
          <p className="mt-2 text-sm text-stone-500">
            Updates from your travel community.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          <Check size={16} /> Mark all read
        </button>
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {notifications.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              setNotifications((items) =>
                items.map((notification) =>
                  notification.id === item.id
                    ? { ...notification, unread: false }
                    : notification
                )
              )
            }
            className={`flex w-full items-start gap-4 border-b border-stone-100 p-5 text-left last:border-b-0 hover:bg-stone-50 ${
              item.unread ? "bg-orange-50/50" : ""
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
              <Bell size={18} />
            </span>
            <span className="flex-1">
              <span className="block font-medium text-stone-900">{item.title}</span>
              <span className="mt-1 block text-sm leading-6 text-stone-500">{item.detail}</span>
            </span>
            {item.unread && (
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-700" />
            )}
          </button>
        ))}
      </section>

      <p className="mt-4 text-xs text-stone-400">
        These are sample notifications for the frontend preview.
      </p>
    </main>
  );
}
