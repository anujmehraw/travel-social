import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import type { Community, CommunityRecord } from "../data";
import { communities as featuredCommunities, toCommunity } from "../data";
import { apiRequest } from "../lib/api";

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const featuredCommunity = featuredCommunities.find(
    (item) => item.slug.toLowerCase() === slug?.toLowerCase()
  );
  const [result, setResult] = useState<{
    slug: string | undefined;
    community: Community | null;
    loading: boolean;
    error: string;
  }>({ slug: undefined, community: null, loading: true, error: "" });
  const isCurrentSlug = result.slug === slug;
  const community = isCurrentSlug ? result.community : featuredCommunity ?? null;
  const loading = !isCurrentSlug || result.loading;
  const error = isCurrentSlug ? result.error : "";

  useEffect(() => {
    let active = true;
    if (!slug) {
      return () => {
        active = false;
      };
    }

    apiRequest<CommunityRecord>(`/api/communities/${encodeURIComponent(slug.toLowerCase())}`)
      .then((record) => {
        if (active) {
          setResult({ slug, community: toCommunity(record), loading: false, error: "" });
        }
      })
      .catch((failure: unknown) => {
        if (!active) return;
        const message = failure instanceof Error ? failure.message : "Could not load this community.";
        const isMissingFeatured = featuredCommunity && message.toLowerCase().includes("community not found");
        setResult({
          slug,
          community: featuredCommunity ?? null,
          loading: false,
          error: isMissingFeatured ? "" : message,
        });
      });

    return () => {
      active = false;
    };
  }, [featuredCommunity, slug]);

  if (!community && error.toLowerCase().includes("community not found")) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Community not found</h1>
        <Link to="/communities" className="mt-4 inline-block text-orange-800">
          Browse communities
        </Link>
      </main>
    );
  }

  if (!community && loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-stone-500">Loading community...</p>
      </main>
    );
  }

  if (!community) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Could not load community</h1>
        <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>
        <Link to="/communities" className="mt-4 inline-block text-orange-800">
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
        {community.image ? (
          <img
            src={community.image}
            alt={community.name}
            className="h-56 w-full object-cover sm:h-72"
          />
        ) : (
          <div className="flex h-56 items-center justify-center bg-orange-50 text-orange-800 sm:h-72">
            <MapPin size={42} />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-3xl font-bold text-stone-900">c/{community.slug}</h1>
          <p className="mt-2 text-lg text-stone-700">{community.name}</p>
          <p className="mt-4 text-stone-600">{community.description || "A place for travelers to connect and share local recommendations."}</p>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-stone-500">
            <span className="flex items-center gap-2">
              <MapPin size={17} />
              {community.city}
            </span>
          </div>
          {error && (
            <p role="status" className="mt-4 text-sm text-amber-800">
              Showing available community details. Could not refresh from the server: {error}
            </p>
          )}
          <Link
            to={`/rooms?destination=${encodeURIComponent(community.city.split(",")[0])}`}
            className="mt-6 inline-flex rounded-xl bg-orange-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-900"
          >
            Find trips in this area
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-stone-900">Explore with other travelers</h2>
        <p className="mt-3 text-sm leading-7 text-stone-500">
          Communities bring travelers together around shared places and interests.
          Travel rooms are where you can join a specific trip and discuss plans with its members.
        </p>
        <Link to="/rooms" className="mt-4 inline-flex text-sm font-semibold text-orange-800 hover:text-orange-900">
          Browse travel rooms →
        </Link>
      </section>
    </main>
  );
}
