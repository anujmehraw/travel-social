import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircle, Search, Send, UserPlus } from "lucide-react";
import { useAuth } from "../auth";
import { apiRequest } from "../lib/api";

type Conversation = {
  id: string;
  user_one: string;
  user_two: string;
  updated_at: string;
  peer_username: string | null;
  peer_display_name: string | null;
  peer_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
};

type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function Chats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadedConversationId, setLoadedConversationId] = useState<string | null>(null);
  const [username, setUsername] = useState(() => searchParams.get("username") ?? "");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedConversation = conversations.find((item) => item.id === selectedId) ?? null;
  const visibleConversations = useMemo(
    () => conversations.filter((item) =>
      `${item.peer_display_name ?? ""} ${item.peer_username ?? ""}`
        .toLowerCase()
        .includes(filter.toLowerCase())
    ),
    [conversations, filter]
  );

  async function refreshConversations() {
    const items = await apiRequest<Conversation[]>("/api/conversations");
    setConversations(items);
    return items;
  }

  useEffect(() => {
    let active = true;
    apiRequest<Conversation[]>("/api/conversations")
      .then((items) => {
        if (active) {
          setConversations(items);
          const nextId = requestedConversationId && items.some((item) => item.id === requestedConversationId)
            ? requestedConversationId
            : items[0]?.id ?? null;
          setSelectedId(nextId);
          setError("");
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load your conversations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestedConversationId]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    apiRequest<DirectMessage[]>(`/api/conversations/${selectedId}/messages`)
      .then((loaded) => {
        if (active) {
          setMessages(loaded);
          setLoadedConversationId(selectedId);
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load messages.");
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  async function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const conversation = await apiRequest<{ id: string }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ username: username.trim() }),
      });
      await refreshConversations();
      setSelectedId(conversation.id);
      setUsername("");
      navigate(`/chats?conversation=${conversation.id}`, { replace: true });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not start this conversation.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || !message.trim()) return;
    setBusy(true);
    setError("");
    try {
      const sent = await apiRequest<DirectMessage>(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: message.trim() }),
      });
      setMessages((existing) => [...existing, sent]);
      setLoadedConversationId(selectedId);
      setMessage("");
      await refreshConversations();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not send your message.");
    } finally {
      setBusy(false);
    }
  }

  function selectConversation(id: string) {
    setSelectedId(id);
    setMessages([]);
    setLoadedConversationId(null);
    navigate(`/chats?conversation=${id}`, { replace: true });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Messages</h1>
          <p className="mt-2 text-sm text-stone-500">Share tips and plan together with fellow travelers.</p>
        </div>
        <Link to="/rooms" className="text-sm font-semibold text-orange-800 hover:text-orange-900">Open your travel room discussions →</Link>
      </header>

      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}

      <section className="mt-7 grid min-h-[620px] overflow-hidden rounded-2xl border border-stone-200 bg-white md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-stone-200 md:border-b-0 md:border-r">
          <div className="border-b border-stone-200 p-4">
            <h2 className="font-semibold text-stone-900">Direct conversations</h2>
            <form onSubmit={startConversation} className="mt-3 flex gap-2">
              <label className="relative min-w-0 flex-1">
                <UserPlus size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Start by username" aria-label="Traveler username" required className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-600" />
              </label>
              <button disabled={busy} className="rounded-lg bg-orange-800 px-3 text-xs font-semibold text-white hover:bg-orange-900 disabled:opacity-60">Start</button>
            </form>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2">
              <Search size={16} className="text-stone-400" />
              <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>

          {loading ? (
            <p className="p-5 text-sm text-stone-500">Loading conversations...</p>
          ) : visibleConversations.length ? (
            visibleConversations.map((conversation) => {
              const name = conversation.peer_display_name || conversation.peer_username || "Traveler";
              return (
                <button key={conversation.id} onClick={() => selectConversation(conversation.id)} className={`flex w-full items-center gap-3 border-b border-stone-100 p-4 text-left transition ${selectedId === conversation.id ? "bg-orange-50" : "hover:bg-stone-50"}`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-sm font-semibold text-orange-900">
                    {conversation.peer_avatar_url ? <img src={conversation.peer_avatar_url} alt="" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-stone-900">{name}</span>
                    <span className="mt-1 block truncate text-xs text-stone-500">{conversation.last_message ?? "Say hello and start planning."}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="p-5 text-sm leading-6 text-stone-500">No conversations yet. Start one with a traveler's username above.</p>
          )}
        </aside>

        <section className="flex min-h-[450px] flex-col">
          {selectedConversation ? (
            <>
              <header className="flex items-center gap-3 border-b border-stone-200 p-4">
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-orange-100 font-semibold text-orange-900">
                  {selectedConversation.peer_avatar_url ? <img src={selectedConversation.peer_avatar_url} alt="" className="h-full w-full object-cover" /> : (selectedConversation.peer_display_name || "T").charAt(0)}
                </span>
                <div>
                  <h2 className="font-semibold text-stone-900">{selectedConversation.peer_display_name ?? "Traveler"}</h2>
                  <p className="text-xs text-stone-500">@{selectedConversation.peer_username ?? "traveler"}</p>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-stone-50 p-5">
                {loadedConversationId !== selectedConversation.id ? (
                  <p className="m-auto text-sm text-stone-500">Loading messages...</p>
                ) : messages.length ? messages.map((item) => (
                  <article key={item.id} className={`max-w-[85%] rounded-2xl p-3 text-sm leading-6 ${item.sender_id === user?.id ? "self-end rounded-tr-sm bg-orange-800 text-white" : "self-start rounded-tl-sm border border-stone-200 bg-white text-stone-700"}`}>
                    <p className="whitespace-pre-wrap">{item.content}</p>
                    <time className={`mt-1 block text-[11px] ${item.sender_id === user?.id ? "text-orange-100" : "text-stone-400"}`}>{new Date(item.created_at).toLocaleString()}</time>
                  </article>
                )) : (
                  <p className="m-auto text-center text-sm text-stone-500">No messages yet. Send a friendly hello.</p>
                )}
              </div>
              <form onSubmit={sendMessage} className="flex gap-3 border-t border-stone-200 p-4">
                <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder="Write a message..." required className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-600" />
                <button disabled={busy} aria-label="Send message" className="rounded-xl bg-orange-800 px-4 text-white hover:bg-orange-900 disabled:opacity-60"><Send size={18} /></button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-800"><MessageCircle size={22} /></span>
              <h2 className="mt-4 font-semibold text-stone-900">Your next connection starts here</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">Start a conversation using a Travel Social username, or join a travel room to talk with the whole trip crew.</p>
            </div>
          )}
        </section>

      </section>
    </main>
  );
}
