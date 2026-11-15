
import { Bookmark } from "lucide-react";
import { posts } from "../data";
import PostCard from "../components/PostCard";

export default function Saved() {
  // Demo-only saved list. Persistent saving will be implemented later.
  const savedPosts = posts.filter((post) => post.id !== 2);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-800">
          <Bookmark size={23} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Saved stories</h1>
          <p className="mt-1 text-sm text-stone-500">
            Keep useful guides and places close at hand.
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-6">
        {savedPosts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      <p className="mt-5 text-xs leading-5 text-stone-400">
        This page currently uses sample saved posts. Saving and unsaving across pages
        will need shared state or database persistence.
      </p>
    </main>
  );
}
