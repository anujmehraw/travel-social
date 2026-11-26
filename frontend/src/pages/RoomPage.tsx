import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, LockKeyhole, MapPin, Send, Users } from "lucide-react";
import { useAuth } from "../auth";
import type { TravelRoom } from "../data";
import { apiRequest } from "../lib/api";

type RoomMember = {
  user_id: string;
  joined_at: string;
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
};

type RoomDetail = TravelRoom & {
  members: RoomMember[];
  creator_profile: { username: string; display_name: string; avatar_url: string | null } | null;
};

type RoomMessage = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
};

type JoinRequest = {
  id: string;
  user_id: string;
  created_at: string;
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
};

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [message, setMessage] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const currentUserId = user?.id;

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const details = await apiRequest<RoomDetail>(`/api/rooms/${roomId}`);
      setError("");
      setRoom(details);
      if (details.members.some((member) => member.user_id === currentUserId)) {
        setMessages(await apiRequest<RoomMessage[]>(`/api/rooms/${roomId}/messages`));
      } else {
        setMessages([]);
      }
      if (details.creator_id === currentUserId) {
        setRequests(await apiRequest<JoinRequest[]>(`/api/rooms/${roomId}/requests`));
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load this room.");
    } finally {
      setLoading(false);
    }
  }, [roomId, currentUserId]);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    apiRequest<RoomDetail>(`/api/rooms/${roomId}`)
      .then(async (details) => {
        const member = details.members.some((item) => item.user_id === currentUserId);
        const [loadedMessages, loadedRequests] = await Promise.all([
          member
            ? apiRequest<RoomMessage[]>(`/api/rooms/${roomId}/messages`)
            : Promise.resolve([] as RoomMessage[]),
          details.creator_id === currentUserId
            ? apiRequest<JoinRequest[]>(`/api/rooms/${roomId}/requests`)
            : Promise.resolve([] as JoinRequest[]),
        ]);
        if (active) {
          setRoom(details);
          setMessages(loadedMessages);
          setRequests(loadedRequests);
          setError("");
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load this room.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [roomId, currentUserId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roomId || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const sent = await apiRequest<RoomMessage>(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: message.trim() }),
      });
      setMessages((existing) => [...existing, sent]);
      setMessage("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  async function inviteTraveler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roomId || !inviteUsername.trim()) return;
    setError("");
    setNotice("");
    try {
      await apiRequest(`/api/rooms/${roomId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ invitee_username: inviteUsername.trim() }),
      });
      setInviteUsername("");
      setNotice("Invitation sent.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not send the invitation.");
    }
  }

  async function resolveRequest(requestId: string, approve: boolean) {
    if (!roomId) return;
    setError("");
    try {
      await apiRequest(`/api/rooms/${roomId}/requests/${requestId}/respond`, {
        method: "POST",
        body: JSON.stringify({ approve }),
      });
      setNotice(approve ? "Request approved." : "Request declined.");
      await loadRoom();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not resolve this request.");
    }
  }

  async function joinRoom() {
    if (!roomId) return;
    setError("");
    try {
      const result = await apiRequest<{ status: string }>(`/api/rooms/${roomId}/join`, { method: "POST" });
      setNotice(result.status === "requested" ? "Join request sent." : "You joined this room.");
      await loadRoom();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not join this room.");
    }
  }

  async function leaveRoom() {
    if (!roomId || !window.confirm("Leave this travel room?")) return;
    setError("");
    try {
      await apiRequest<void>(`/api/rooms/${roomId}/membership`, { method: "DELETE" });
      setNotice("You left the travel room.");
      await loadRoom();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not leave this room.");
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-12 text-center text-stone-500">Loading trip details...</main>;
  }
  if (!room) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">Room unavailable</h1>
        <p role="alert" className="mt-3 text-sm text-stone-600">{error || "This room is private or no longer exists."}</p>
        <Link to="/rooms" className="mt-5 inline-block text-sm font-semibold text-orange-800">Browse travel rooms</Link>
      </main>
    );
  }

  const isMember = room.members.some((member) => member.user_id === user?.id);
  const isCreator = room.creator_id === user?.id;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/rooms" className="mb-5 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-orange-800"><ArrowLeft size={16} />All travel rooms</Link>
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="h-56 bg-gradient-to-br from-orange-100 via-stone-100 to-sky-100 sm:h-72">
          {room.cover_url && <img src={room.cover_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-900">{room.category ?? "Travel"} · {room.is_public ? "Public" : "Private"}</span>
              <h1 className="mt-3 text-3xl font-semibold text-stone-900">{room.name}</h1>
              {room.destination && <p className="mt-2 flex items-center gap-1.5 text-stone-600"><MapPin size={17} />{room.destination}{room.start_location ? ` · from ${room.start_location}` : ""}</p>}
              {room.description && <p className="mt-4 whitespace-pre-wrap leading-7 text-stone-600">{room.description}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {isMember && !isCreator && <button onClick={leaveRoom} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">Leave room</button>}
              {!isMember && room.is_public && <button onClick={joinRoom} className="rounded-xl bg-orange-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-900">Join this trip</button>}
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t border-stone-100 pt-5 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3"><CalendarDays size={18} className="text-orange-800" /><span className="text-sm text-stone-700">{room.departure_date ? `${room.departure_date}${room.return_date ? ` – ${room.return_date}` : ""}` : "Dates to be planned"}</span></div>
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3"><Users size={18} className="text-orange-800" /><span className="text-sm text-stone-700">{room.members.length} of {room.max_members} travelers</span></div>
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3"><span className="text-base font-semibold text-orange-800">₹</span><span className="text-sm text-stone-700">{room.budget !== null ? `${Number(room.budget).toLocaleString()} estimated per person` : "Budget to be planned"}</span></div>
          </div>
          <p className="mt-4 text-sm text-stone-500">Organized by {room.creator_profile?.display_name ?? "a Travel Social member"} · @{room.creator_profile?.username ?? "traveler"}</p>
        </div>
      </section>

      <div className="mt-7 grid gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900"><Users size={18} />Travelers ({room.members.length})</h2>
            <div className="mt-4 space-y-3">
              {room.members.map((member) => {
                const name = member.profile?.display_name ?? "Traveler";
                return (
                  <Link key={member.user_id} to={`/profile/${member.user_id}`} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-stone-50">
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-sm font-medium text-orange-900">
                      {member.profile?.avatar_url ? <img src={member.profile.avatar_url} alt="" className="h-full w-full object-cover" /> : name.charAt(0)}
                    </span>
                    <span><span className="block text-sm font-medium text-stone-800">{name}{member.user_id === room.creator_id ? " · Host" : ""}</span><span className="block text-xs text-stone-500">@{member.profile?.username ?? "traveler"}</span></span>
                  </Link>
                );
              })}
            </div>
          </section>

          {isMember && (
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="font-semibold text-stone-900">Invite a traveler</h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">Enter their Travel Social username.</p>
              <form onSubmit={inviteTraveler} className="mt-3 flex gap-2">
                <input value={inviteUsername} onChange={(event) => setInviteUsername(event.target.value)} placeholder="@username" required className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-orange-600" />
                <button aria-label="Send invitation" className="rounded-lg bg-orange-800 px-3 text-white hover:bg-orange-900"><Send size={16} /></button>
              </form>
            </section>
          )}

          {!room.is_public && !isMember && (
            <div className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-950">
              <LockKeyhole size={18} className="mt-1 shrink-0" />
              Private room information is available to invited travelers and members.
            </div>
          )}

          {isCreator && requests.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="font-semibold text-stone-900">Join requests</h2>
              <div className="mt-3 space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-xl bg-stone-50 p-3">
                    <p className="text-sm font-medium text-stone-800">{request.profile?.display_name ?? "Traveler"} <span className="text-stone-500">@{request.profile?.username ?? "traveler"}</span></p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => void resolveRequest(request.id, true)} className="rounded-lg bg-orange-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-900">Approve</button>
                      <button onClick={() => void resolveRequest(request.id, false)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-white">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        <section className="flex min-h-[500px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <header className="border-b border-stone-200 p-5">
            <h2 className="font-semibold text-stone-900">Trip discussion</h2>
            <p className="mt-1 text-sm text-stone-500">Share plans, ask questions and coordinate together.</p>
          </header>
          {isMember ? (
            <>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-stone-50 p-5">
                {messages.length ? messages.map((item) => (
                  <article key={item.id} className={`max-w-[85%] rounded-2xl p-3 text-sm leading-6 ${item.author_id === user?.id ? "self-end rounded-tr-sm bg-orange-800 text-white" : "self-start rounded-tl-sm border border-stone-200 bg-white text-stone-700"}`}>
                    <p>{item.content}</p>
                    <time className={`mt-1 block text-[11px] ${item.author_id === user?.id ? "text-orange-100" : "text-stone-400"}`}>{new Date(item.created_at).toLocaleString()}</time>
                  </article>
                )) : <p className="m-auto max-w-sm text-center text-sm leading-6 text-stone-500">Start the conversation with your travel crew.</p>}
              </div>
              <form onSubmit={sendMessage} className="flex gap-3 border-t border-stone-200 p-4">
                <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder="Write a message..." required className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-600" />
                <button disabled={sending} aria-label="Send message" className="rounded-xl bg-orange-800 px-4 text-white hover:bg-orange-900 disabled:opacity-60"><Send size={18} /></button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <LockKeyhole size={24} className="text-stone-400" />
              <p className="mt-3 font-medium text-stone-800">Join the room to take part</p>
              <p className="mt-1 text-sm text-stone-500">Room discussions are visible to members only.</p>
              {room.is_public && <button onClick={joinRoom} className="mt-4 rounded-xl bg-orange-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-900">Join this trip</button>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
