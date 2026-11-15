
import { useState } from "react";
import { Search } from "lucide-react";
import { communities } from "../data";
import CommunityCard from "../components/CommunityCard";

export default function Communities() {
  const [query, setQuery] = useState("");

  const results = communities.filter((community) =>
    `${community.name} ${community.city} ${community.description}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-orange-800">
            Find your people
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900">
  Explore communities
</h1>
          <p className="mt-3 max-w-2xl leading-7 text-stone-600">
            Connect with people who know your city, share recommendations,
            and plan your next trip together.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 md:w-72">
          <Search size={18} className="text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-9 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((community) => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>

      {results.length === 0 && (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          No communities found.
        </p>
      )}
    </main>
  );
}
