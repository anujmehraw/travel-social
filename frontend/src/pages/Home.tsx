
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Plus, Search } from "lucide-react";
import { posts } from "../data";
import PostCard from "../components/PostCard";

export default function Home() {
  const [query, setQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const filteredPosts = posts.filter((post) =>
    `${post.title} ${post.content} ${post.location} ${post.author}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0">
        <div className="overflow-hidden rounded-3xl bg-[#f3eee5] p-7 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-800">
            Travel is better together
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl">
            Find your next place. Hear the stories behind it.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
            Discover local places, learn from real travelers, and connect with
            people who know your next destination.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/discover"
              className="rounded-xl bg-orange-700 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-800"
            >
              Explore places
            </Link>
            <Link
              to="/communities"
              className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              Find your community
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Travel stories</h2>
            <p className="mt-1 text-sm text-stone-500">
              Real experiences from people on the move.
            </p>
          </div>
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-700"
          >
            <Plus size={18} /> Share a story
          </button>
        </div>

        {showComposer && (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-semibold text-stone-900">Share your experience</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Post creation will be connected to the backend in the next stage.
              For now, explore the demo stories and pages.
            </p>
            <button
              onClick={() => setShowComposer(false)}
              className="mt-4 text-sm font-medium text-orange-800"
            >
              Close
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-5 flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3"
        >
          <Search size={19} className="shrink-0 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories, travelers, or places..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </form>

        <div className="mt-6 space-y-6">
          {filteredPosts.length ? (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
              No stories match your search.
            </p>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900">Explore Travel Social</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Find people who know the places you want to visit.
          </p>
          <div className="mt-4 space-y-3">
            <Link to="/discover" className="flex items-center justify-between text-sm text-stone-700 hover:text-orange-800">
              Discover destinations <ArrowRight size={16} />
            </Link>
            <Link to="/communities" className="flex items-center justify-between text-sm text-stone-700 hover:text-orange-800">
              Browse communities <ArrowRight size={16} />
            </Link>
            <Link to="/chats" className="flex items-center justify-between text-sm text-stone-700 hover:text-orange-800">
              Connect with travelers <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900 p-5 text-white">
          <MapPin size={20} className="text-orange-300" />
          <h2 className="mt-3 text-lg font-semibold">Know a place well?</h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Share local recommendations that help someone else travel better.
          </p>
          <button
            onClick={() => setShowComposer(true)}
            className="mt-4 text-sm font-semibold text-orange-300 hover:text-orange-200"
          >
            Share your story →
          </button>
        </div>

        <p className="px-2 text-xs leading-5 text-stone-400">
          Travel Social · A community for curious travelers.
        </p>
      </aside>
    </main>
  );
}
