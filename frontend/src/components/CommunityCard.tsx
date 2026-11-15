
import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowUpRight } from "lucide-react";
import type { Community } from "../data";

type Props = {
  community: Community;
};

export default function CommunityCard({ community }: Props) {
  const [joined, setJoined] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <Link to={`/c/${community.slug}`}>
        <img
          src={community.image}
          alt={community.city}
          className="h-40 w-full object-cover"
        />
      </Link>

      <div className="p-5">
        <Link
          to={`/c/${community.slug}`}
          className="text-lg font-semibold text-stone-900 hover:text-orange-800"
        >
          c/{community.slug}
        </Link>

        <p className="mt-1 text-sm text-stone-500">
          {community.city}
        </p>

        <p className="mt-3 min-h-12 text-sm leading-6 text-stone-600">
          {community.description}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-stone-500">
            <Users size={16} />
            {community.members} members
          </span>

          <button
            onClick={() => setJoined(!joined)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              joined
                ? "border border-stone-300 text-stone-700"
                : "bg-orange-800 text-white hover:bg-orange-900"
            }`}
          >
            {joined ? "Joined" : "Join"}
          </button>
        </div>

        <Link
          to={`/c/${community.slug}`}
          className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-medium text-orange-800"
        >
          Explore community
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
