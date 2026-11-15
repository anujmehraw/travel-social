
import { useState } from "react";
import { MessageCircle, Search, Send } from "lucide-react";

const conversations = [
  { id: 1, name: "Riya Sharma", preview: "Did you visit the lake at sunset?", initials: "RS" },
  { id: 2, name: "Arjun Verma", preview: "I can share my Manali itinerary.", initials: "AV" },
  { id: 3, name: "Meera Kapoor", preview: "These café recommendations are great.", initials: "MK" },
];

export default function Chats() {
  const [selected, setSelected] = useState(1);
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<Record<number, string[]>>({});

  const active = conversations.find((person) => person.id === selected)!;

  function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) return;

    setSentMessages((previous) => ({
      ...previous,
      [selected]: [...(previous[selected] || []), message.trim()],
    }));
    setMessage("");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold text-stone-900">Messages</h1>
      <p className="mt-2 text-sm text-stone-500">
        Talk with travelers and exchange local recommendations.
      </p>

      <section className="mt-7 grid min-h-[600px] overflow-hidden rounded-2xl border border-stone-200 bg-white md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-stone-200 md:border-b-0 md:border-r">
          <div className="border-b border-stone-200 p-4">
            <h2 className="font-semibold text-stone-900">Your conversations</h2>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2">
              <Search size={16} className="text-stone-400" />
              <input
                placeholder="Search chats"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {conversations.map((person) => (
            <button
              key={person.id}
              onClick={() => setSelected(person.id)}
              className={`flex w-full items-center gap-3 border-b border-stone-100 p-4 text-left ${
                selected === person.id ? "bg-orange-50" : "hover:bg-stone-50"
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700">
                {person.initials}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-stone-900">{person.name}</span>
                <span className="mt-1 block truncate text-xs text-stone-500">
                  {sentMessages[person.id]?.at(-1) || person.preview}
                </span>
              </span>
            </button>
          ))}
        </aside>

        <div className="flex min-h-[450px] flex-col">
          <div className="flex items-center gap-3 border-b border-stone-200 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-900">
              {active.initials}
            </span>
            <div>
              <h2 className="font-semibold text-stone-900">{active.name}</h2>
              <p className="text-xs text-stone-500">Travel Social member</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-stone-50 p-5">
            <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm border border-stone-200 bg-white p-3 text-sm leading-6 text-stone-700">
              {active.preview}
            </div>
            {(sentMessages[selected] || []).map((text, index) => (
              <div
                key={`${selected}-${index}`}
                className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-orange-700 p-3 text-sm leading-6 text-white"
              >
                {text}
              </div>
            ))}
            <p className="mt-auto pt-5 text-center text-xs text-stone-400">
              Demo conversation · Messages are stored only in this page's state.
            </p>
          </div>

          <form onSubmit={sendMessage} className="flex gap-3 border-t border-stone-200 p-4">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
              className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="rounded-xl bg-orange-700 px-4 text-white hover:bg-orange-800"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
