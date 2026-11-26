
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Community } from "../data";

type Props = {
  community: Community;
};

export default function CommunityCard({ community }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <Link to={`/communities/${community.slug}`}>
        {community.image ? (
          <img
            src={community.image}
            alt={community.city}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-orange-50 text-orange-800">
            <MapPin size={32} />
          </div>
        )}
      </Link>

      <div className="p-5">
        <Link
          to={`/communities/${community.slug}`}
          className="text-lg font-semibold text-stone-900 hover:text-orange-800"
        >
          c/{community.slug}
        </Link>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
          <MapPin size={14} />
          {community.city}
        </p>

        <p className="mt-3 min-h-12 text-sm leading-6 text-stone-600">
          {community.description}
        </p>

        <Link
          to={`/communities/${community.slug}`}
          className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-medium text-orange-800"
        >
          Explore community
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
