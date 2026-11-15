
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { Users, MapPin, ArrowLeft } from "lucide-react";
import { communities } from "../data";

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [joined, setJoined] = useState(false);

  const community = communities.find(
    (item) => item.slug.toLowerCase() === slug?.toLowerCase()
  );

  if (!community) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">
          Community not found
        </h1>
        <Link
          to="/communities"
          className="mt-4 inline-block text-orange-800"
        >
          Browse communities
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/communities"
        className="mb-5 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-orange-800"
      >
        <ArrowLeft size={16} />
        All communities
      </Link>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <img
          src={community.image}
          alt={community.name}
          className="h-56 w-full object-cover sm:h-72"
        />

        <div className="p-6">
          <h1 className="text-3xl font-bold text-stone-900">
            c/{community.slug}
          </h1>

          <p className="mt-2 text-lg text-stone-700">
            {community.name}
          </p>

          <p className="mt-4 text-stone-600">
            {community.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-stone-500">
            <span className="flex items-center gap-2">
              <MapPin size={17} />
              {community.city}
            </span>

            <span className="flex items-center gap-2">
              <Users size={17} />
              {community.members} members
            </span>
          </div>

          <button
            onClick={() => setJoined(!joined)}
            className={`mt-6 rounded-xl px-6 py-3 text-sm font-semibold ${
              joined
                ? "border border-stone-300 bg-white text-stone-800"
                : "bg-orange-800 text-white hover:bg-orange-900"
            }`}
          >
            {joined ? "Joined" : "Join community"}
          </button>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-stone-900">
          Community discussions
        </h2>

        <p className="mt-3 text-sm leading-7 text-stone-500">
          Posts, travel guides, questions, and discussions from
          c/{community.slug} will appear here once we connect
          the backend.
        </p>
      </section>
    </main>
  );
}
