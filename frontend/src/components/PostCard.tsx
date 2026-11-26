import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { useAuth } from "../auth";
import type { Comment, Post } from "../data";
import { apiRequest } from "../lib/api";

type Props = {
  post: Post;
  onChanged?: () => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PostCard({ post, onChanged }: Props) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(post.saved_by_me);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [editingPost, setEditingPost] = useState(false);
  const [content, setContent] = useState(post.content);
  const [location, setLocation] = useState(post.location ?? "");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isAuthor = user?.id === post.author_id;
  const authorName = post.display_name || post.username || "Traveler";

  async function toggleLike() {
    setError("");
    setBusy(true);
    try {
      await apiRequest(`/api/posts/${post.id}/likes`, {
        method: liked ? "DELETE" : "POST",
      });
      setLiked(!liked);
      setLikeCount((count) => count + (liked ? -1 : 1));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update your like.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSaved() {
    setError("");
    setBusy(true);
    try {
      await apiRequest(`/api/posts/${post.id}/save`, {
        method: saved ? "DELETE" : "POST",
      });
      setSaved(!saved);
      onChanged?.();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update your saved stories.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleComments() {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    setError("");
    if (opening && !commentsLoaded) {
      try {
        const loaded = await apiRequest<Comment[]>(`/api/posts/${post.id}/comments`);
        setComments(loaded);
        setCommentCount(loaded.length);
        setCommentsLoaded(true);
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Could not load comments.");
      }
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const comment = await apiRequest<Comment>(`/api/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText.trim() }),
      });
      setComments((existing) => [...existing, comment]);
      setCommentText("");
      setCommentsLoaded(true);
      setCommentCount((count) => count + 1);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not add your comment.");
    } finally {
      setBusy(false);
    }
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest<Post>(`/api/posts/${post.id}`, {
        method: "PUT",
        body: JSON.stringify({ content: content.trim(), location: location.trim() || null }),
      });
      setEditingPost(false);
      onChanged?.();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update your post.");
    } finally {
      setBusy(false);
    }
  }

  async function deletePost() {
    if (!window.confirm("Delete this travel story? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest<void>(`/api/posts/${post.id}`, { method: "DELETE" });
      onChanged?.();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not delete your post.");
      setBusy(false);
    }
  }

  async function saveComment(event: FormEvent<HTMLFormElement>, commentId: string) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await apiRequest<Comment>(
        `/api/posts/${post.id}/comments/${commentId}`,
        { method: "PUT", body: JSON.stringify({ content: editCommentText.trim() }) }
      );
      setComments((existing) =>
        existing.map((comment) => (comment.id === commentId ? { ...comment, ...updated } : comment))
      );
      setEditingComment(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update your comment.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(commentId: string) {
    setBusy(true);
    setError("");
    try {
      await apiRequest<void>(`/api/posts/${post.id}/comments/${commentId}`, { method: "DELETE" });
      setComments((existing) => existing.filter((comment) => comment.id !== commentId));
      setCommentCount((count) => Math.max(0, count - 1));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not delete your comment.");
    } finally {
      setBusy(false);
    }
  }

  async function sharePost() {
    const url = `${window.location.origin}/?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Travel story by ${authorName}`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (failure) {
      if (failure instanceof Error && failure.name !== "AbortError") {
        setError("Could not share this story from your browser.");
      }
    }
  }

  return (
    <article id={`post-${post.id}`} className="overflow-hidden border-y border-[#dedbd3] bg-[#fffefa] transition hover:border-stone-300">
      <header className="flex items-center gap-3 p-4 sm:p-5">
        <Link
          to={`/profile/${post.author_id}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 font-semibold text-orange-900"
          aria-label={`View ${authorName}'s profile`}
        >
          {post.avatar_url ? (
            <img src={post.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : initials(authorName)}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${post.author_id}`}
            className="block truncate font-semibold text-stone-900 hover:text-orange-800"
          >
            {authorName}
          </Link>
          <p className="truncate text-xs text-stone-500">
            @{post.username || "traveler"} · {formatDate(post.created_at)}
          </p>
        </div>
        {isAuthor && (
          <div className="flex gap-1">
            <button
              onClick={() => setEditingPost((editing) => !editing)}
              aria-label="Edit post"
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-orange-800"
            >
              <Pencil size={17} />
            </button>
            <button
              onClick={deletePost}
              disabled={busy}
              aria-label="Delete post"
              className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </header>

      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.location ? `Travel moment in ${post.location}` : "Travel story"}
          loading="lazy"
          className="max-h-[460px] w-full object-cover"
        />
      )}

      <div className="p-4 sm:p-5">
        {post.location && (
          <p className="mb-2 flex items-center gap-1.5 text-sm text-orange-800">
            <MapPin size={15} /> {post.location}
          </p>
        )}
        {editingPost ? (
          <form onSubmit={savePost} className="space-y-3">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={2000}
              required
              rows={4}
              aria-label="Edit travel story"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm leading-6 outline-none focus:border-orange-600"
            />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={120}
              placeholder="Destination or location"
              aria-label="Edit destination"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-orange-600"
            />
            <div className="flex gap-2">
              <button disabled={busy} className="rounded-lg bg-orange-800 px-4 py-2 text-sm font-medium text-white hover:bg-orange-900 disabled:opacity-60">
                Save changes
              </button>
              <button type="button" onClick={() => setEditingPost(false)} className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">{post.content}</p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
          <button
            onClick={toggleLike}
            disabled={busy}
            aria-pressed={liked}
            className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
              liked ? "text-rose-600" : "text-stone-600 hover:text-rose-600"
            }`}
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
            {likeCount}
          </button>
          <button
            onClick={toggleComments}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-stone-600 hover:text-orange-800"
          >
            <MessageCircle size={18} />
            {commentCount}
          </button>
          <button
            onClick={sharePost}
            aria-label="Share post"
            className="rounded-lg p-2 text-stone-600 hover:text-orange-800"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={toggleSaved}
            disabled={busy}
            aria-label={saved ? "Unsave post" : "Save post"}
            aria-pressed={saved}
            className={`rounded-lg p-2 ${
              saved ? "text-orange-800" : "text-stone-600 hover:text-orange-800"
            }`}
          >
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}

        {commentsOpen && (
          <section className="mt-4 border-t border-stone-100 pt-4" aria-label="Comments">
            <div className="space-y-4">
              {comments.map((comment) => {
                const commentAuthor = comment.display_name || comment.username || "Traveler";
                const ownsComment = comment.author_id === user?.id;
                return (
                  <div key={comment.id} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 text-xs font-medium text-stone-700">
                      {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : initials(commentAuthor)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-stone-800">
                        {commentAuthor} <span className="font-normal text-stone-400">· {formatDate(comment.created_at)}</span>
                      </p>
                      {editingComment === comment.id ? (
                        <form onSubmit={(event) => saveComment(event, comment.id)} className="mt-2 flex gap-2">
                          <input
                            value={editCommentText}
                            onChange={(event) => setEditCommentText(event.target.value)}
                            maxLength={1000}
                            required
                            aria-label="Edit comment"
                            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-orange-600"
                          />
                          <button disabled={busy} className="text-sm font-medium text-orange-800">Save</button>
                        </form>
                      ) : (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-600">{comment.content}</p>
                      )}
                      {ownsComment && editingComment !== comment.id && (
                        <div className="mt-1 flex gap-3">
                          <button
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditCommentText(comment.content);
                            }}
                            className="text-xs text-stone-500 hover:text-orange-800"
                          >
                            Edit
                          </button>
                          <button onClick={() => deleteComment(comment.id)} disabled={busy} className="text-xs text-stone-500 hover:text-rose-700">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={submitComment} className="mt-4 flex gap-2">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                maxLength={1000}
                required
                placeholder="Add a thoughtful comment..."
                aria-label="Write a comment"
                className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-600"
              />
              <button disabled={busy} className="rounded-xl bg-orange-800 px-4 text-sm font-medium text-white hover:bg-orange-900 disabled:opacity-60">
                Send
              </button>
            </form>
          </section>
        )}
      </div>
    </article>
  );
}
