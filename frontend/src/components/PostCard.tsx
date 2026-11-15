
import { useState } from "react";
import { Bookmark, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import type { Post } from "../data";

type Props = {
  post: Post;
};

export default function PostCard({ post }: Props) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  async function sharePost() {
    const url = window.location.origin + `/discover?post=${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        window.alert("Post link copied.");
      }
    } catch {
      // Sharing may be cancelled by the user.
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-900">
          {post.author.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900">{post.author}</p>
          <p className="text-xs text-stone-500">@{post.handle} · {post.time}</p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
          {post.category}
        </span>
      </div>

      <img
        src={post.image}
        alt={post.location}
        loading="lazy"
        className="max-h-[420px] w-full object-cover"
      />

      <div className="p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm text-orange-800">
          <MapPin size={15} />
          {post.location}
        </p>
        <h2 className="text-lg font-semibold text-stone-900">{post.title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{post.content}</p>

        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
              liked ? "text-rose-600" : "text-stone-600 hover:text-rose-600"
            }`}
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
            {post.likes + (liked ? 1 : 0)}
          </button>

          <button
            onClick={() => window.alert("Comments will be added when the backend is connected.")}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-stone-600 hover:text-orange-800"
          >
            <MessageCircle size={18} />
            {post.comments}
          </button>

          <button
            onClick={sharePost}
            aria-label="Share post"
            className="rounded-lg p-2 text-stone-600 hover:text-orange-800"
          >
            <Share2 size={18} />
          </button>

          <button
            onClick={() => setSaved(!saved)}
            aria-label={saved ? "Unsave post" : "Save post"}
            className={`rounded-lg p-2 ${
              saved ? "text-orange-800" : "text-stone-600 hover:text-orange-800"
            }`}
          >
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}
