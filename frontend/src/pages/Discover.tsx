
import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { destinations } from "../data";

export default function Discover() {
  const [query, setQuery] = useState("");

  const results = destinations.filter((destination) =>
    `${destination.name} ${destination.region}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-orange-800">
          Find somewhere new
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Where do you want to go?
        </h1>
        <p className="mt-4 leading-7 text-stone-600">
          Explore destinations through the places, advice, and experiences
          shared by other travelers.
        </p>
      </div>

      <div className="mt-7 flex max-w-xl items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
        <Search size={20} className="text-stone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a city or region..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">Explore destinations</h2>
          <p className="mt-1 text-sm text-stone-500">Places worth discovering.</p>
        </div>
        <span className="text-sm text-stone-500">{results.length} places</span>
      </div>

      {results.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((destination) => (
            <article
              key={destination.name}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white"
            >
              <div className="overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  loading="lazy"
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-stone-900">
                  {destination.name}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                  <MapPin size={15} /> {destination.region}
                </p>
                <button
                  onClick={() =>
                    window.alert(`More guides for ${destination.name} will appear here.`)
                  }
                  className="mt-4 text-sm font-semibold text-orange-800 hover:text-orange-900"
                >
                  Explore destination →
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          No destinations found. Try another search.
        </p>
      )}
    </main>
  );
}
