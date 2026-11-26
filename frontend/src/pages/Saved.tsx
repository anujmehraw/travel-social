import { useCallback, useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import type { Post } from "../data";
import PostCard from "../components/PostCard";
import { apiRequest } from "../lib/api";

export default function Saved() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSavedPosts = useCallback(async () => {
    try {
      setPosts(await apiRequest<Post[]>("/api/saved-posts"));
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load saved stories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<Post[]>("/api/saved-posts")
      .then((loaded) => {
        if (active) {
          setPosts(loaded);
          setError("");
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load saved stories.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-800">
          <Bookmark size={23} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Saved stories</h1>
          <p className="mt-1 text-sm text-stone-500">Keep useful guides and places close at hand.</p>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      <div className="mt-7 space-y-6">
        {loading ? (
          <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">Loading saved stories...</p>
        ) : posts.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} onChanged={() => void loadSavedPosts()} />)
        ) : (
          <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">Saved stories will appear here.</p>
        )}
      </div>
    </main>
  );
}
