import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Compass } from "lucide-react";
import { apiRequest } from "../lib/api";

type NotificationItem = {
  id: string;
  actor_id: string | null;
  kind: string;
  entity_id: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

type Invitation = {
  id: string;
  room_id: string;
  created_at: string;
  rooms: { name: string; destination: string | null } | null;
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      const [items, invites] = await Promise.all([
        apiRequest<NotificationItem[]>("/api/notifications"),
        apiRequest<Invitation[]>("/api/invitations"),
      ]);
      setNotifications(items);
      setInvitations(invites);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<NotificationItem[]>("/api/notifications"),
      apiRequest<Invitation[]>("/api/invitations"),
    ])
      .then(([items, invites]) => {
        if (active) {
          setNotifications(items);
          setInvitations(invites);
          setError("");
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function markRead(id?: string) {
    setError("");
    try {
      await apiRequest<void>("/api/notifications/read", {
        method: "PATCH",
        body: JSON.stringify(id ? { id } : {}),
      });
      setNotifications((items) => items.map((item) =>
        !id || item.id === id ? { ...item, read_at: new Date().toISOString() } : item
      ));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update notifications.");
    }
  }

  async function respondToInvitation(id: string, accept: boolean) {
    setError("");
    try {
      await apiRequest<void>(`/api/invitations/${id}/respond`, {
        method: "POST",
        body: JSON.stringify({ accept }),
      });
      await loadNotifications();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not respond to the invitation.");
    }
  }

  function openNotification(item: NotificationItem) {
    if (!item.read_at) void markRead(item.id);
    if (item.kind === "like" || item.kind === "comment") {
      navigate(`/?post=${item.entity_id ?? ""}`);
    } else if (item.kind === "direct_message" && item.entity_id) {
      navigate(`/chats?conversation=${item.entity_id}`);
    } else if (item.kind === "room_invitation") {
      navigate("/notifications");
    } else if (item.kind === "room_join_approved" && item.entity_id) {
      navigate(`/rooms/${item.entity_id}`);
    } else if (item.kind === "room_join_request" && item.entity_id) {
      navigate(`/rooms/${item.entity_id}`);
    } else if (item.actor_id) {
      navigate(`/profile/${item.actor_id}`);
    }
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Notifications</h1>
          <p className="mt-2 text-sm text-stone-500">Updates from your travel community.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => void markRead()} className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50">
            <Check size={16} /> Mark all read
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}

      {invitations.length > 0 && (
        <section className="mt-7">
          <h2 className="text-lg font-semibold text-stone-900">Travel room invitations</h2>
          <div className="mt-3 space-y-3">
            {invitations.map((invite) => (
              <article key={invite.id} className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 sm:flex-row sm:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-orange-800"><Compass size={18} /></span>
                <div className="flex-1">
                  <p className="font-medium text-stone-900">{invite.rooms?.name ?? "A travel room invited you"}</p>
                  <p className="mt-1 text-sm text-stone-600">{invite.rooms?.destination ?? "Open the room invitation to join the trip."}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void respondToInvitation(invite.id, false)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Decline</button>
                  <button onClick={() => void respondToInvitation(invite.id, true)} className="rounded-lg bg-orange-800 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-900">Accept</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-sm text-stone-500">Loading updates...</p>
        ) : notifications.length ? (
          notifications.map((item) => (
            <button
              key={item.id}
              onClick={() => openNotification(item)}
              className={`flex w-full items-start gap-4 border-b border-stone-100 p-5 text-left transition last:border-b-0 hover:bg-stone-50 ${!item.read_at ? "bg-orange-50/50" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600"><Bell size={18} /></span>
              <span className="flex-1">
                <span className="block font-medium text-stone-900">{item.message}</span>
                <span className="mt-1 block text-sm text-stone-500">{new Date(item.created_at).toLocaleString()}</span>
              </span>
              {!item.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-700" />}
            </button>
          ))
        ) : (
          <p className="p-8 text-center text-sm text-stone-500">You're all caught up. New activity will appear here.</p>
        )}
      </section>
    </main>
  );
}
