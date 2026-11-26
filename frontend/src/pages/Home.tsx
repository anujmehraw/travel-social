import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, MapPin, Plus, Search } from "lucide-react";
import { useAuth } from "../auth";
import type { Post } from "../data";
import PostCard from "../components/PostCard";
import { apiRequest } from "../lib/api";
import { uploadImage } from "../lib/uploads";

export default function Home() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    try {
      setPosts(await apiRequest<Post[]>("/api/posts"));
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load travel stories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<Post[]>("/api/posts")
      .then((loaded) => {
        if (active) {
          setPosts(loaded);
          setError("");
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load travel stories.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const targetPost = searchParams.get("post");
    if (targetPost && posts.length > 0) {
      document.getElementById(`post-${targetPost}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [posts, searchParams]);

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) =>
        `${post.content} ${post.location ?? ""} ${post.display_name ?? ""} ${post.username ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [posts, query]
  );

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest<Post>("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          location: location.trim() || null,
          image_url: imageFile
            ? await uploadImage(imageFile, "posts")
            : null,
        }),
      });
      setContent("");
      setLocation("");
      setImageFile(null);
      setShowComposer(false);
      await loadPosts();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not publish your story.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="min-w-0">
        <div className="grid border-y border-[#d8d4ca] py-8 md:grid-cols-[1.35fr_.65fr] md:gap-8 md:py-10">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a44f38]">
              Field notes for curious travelers
            </p>
            <h1 className="editorial-title mt-3 max-w-xl text-4xl leading-[1.02] text-[#26231f] sm:text-5xl">
              Go somewhere worth remembering.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-stone-600 sm:text-base">
              Local advice, honest stories, and people who have actually been there.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <Link
                to="/discover"
                className="border-b border-[#a44f38] pb-1 text-sm font-semibold text-[#7f3d2e]"
              >
                Explore places
              </Link>
              <Link
                to="/rooms"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Find a travel room
              </Link>
            </div>
          </div>
          <blockquote className="mt-8 border-l border-[#d8d4ca] pl-6 md:mt-0 md:pl-8">
            <p className="editorial-title text-2xl leading-snug text-stone-800">
              “The best part is rarely where you planned to stop.”
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.12em] text-stone-400">
              Notes from the road
            </p>
          </blockquote>
        </div>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">Latest dispatches</p>
            <h2 className="editorial-title mt-1 text-3xl text-stone-900">Travel stories</h2>
            <p className="mt-1 text-sm text-stone-500">
              Real experiences from people on the move.
            </p>
          </div>
          <button
            onClick={() => setShowComposer((visible) => !visible)}
            className="flex items-center justify-center gap-2 rounded-md bg-[#26322f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#354640]"
          >
            <Plus size={18} /> Share a story
          </button>
        </div>

        {showComposer && (
          <form onSubmit={createPost} className="mt-4 space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-900">
                {(user?.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase() ?? "T"}
              </span>
              <div>
                <h3 className="font-semibold text-stone-900">Share a moment from the road</h3>
                <p className="text-xs text-stone-500">Your story is saved to your account.</p>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What did you discover? Share the experience and helpful details..."
              maxLength={2000}
              required
              rows={4}
              className="w-full resize-y rounded-xl border border-stone-200 px-4 py-3 text-sm leading-6 outline-none focus:border-orange-600"
            />
            <div className="grid gap-3">
              <label className="text-xs font-medium text-stone-600">
                Destination
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={120}
                  placeholder="City, country"
                  className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-orange-600"
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-stone-600">
              Photo (optional, up to 5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-orange-900 hover:file:bg-orange-100"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowComposer(false)} className="rounded-lg px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-100">
                Cancel
              </button>
              <button disabled={saving} className="rounded-lg bg-orange-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-900 disabled:opacity-60">
                {saving ? "Publishing..." : "Publish story"}
              </button>
            </div>
          </form>
        )}

        <form
          onSubmit={(event) => event.preventDefault()}
          className="mt-5 flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3"
        >
          <Search size={19} className="shrink-0 text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stories, travelers, or places..."
            aria-label="Search stories"
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </form>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
            <button onClick={() => void loadPosts()} className="ml-3 font-semibold underline">Try again</button>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {loading ? (
            <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">Loading stories...</p>
          ) : filteredPosts.length ? (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} onChanged={() => void loadPosts()} />)
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <p className="font-medium text-stone-800">{query ? "No stories match your search." : "Your travel feed is ready for its first story."}</p>
              {!query && (
                <button onClick={() => setShowComposer(true)} className="mt-3 text-sm font-semibold text-orange-800 hover:text-orange-900">
                  Share the first story
                </button>
              )}
            </div>
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
            <Link to="/rooms" className="flex items-center justify-between text-sm text-stone-700 hover:text-orange-800">
              Find a travel room <ArrowRight size={16} />
            </Link>
            <Link to="/communities" className="flex items-center justify-between text-sm text-stone-700 hover:text-orange-800">
              Browse communities <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900 p-5 text-white">
          <MapPin size={20} className="text-orange-300" />
          <h2 className="mt-3 text-lg font-semibold">Know a place well?</h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Share local recommendations that help someone else travel better.
          </p>
          <button onClick={() => setShowComposer(true)} className="mt-4 text-sm font-semibold text-orange-300 hover:text-orange-200">
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
