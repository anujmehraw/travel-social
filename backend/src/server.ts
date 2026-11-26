import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import cors from "cors";
import { config as loadEnv } from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import { resolve } from "node:path";
import WebSocket from "ws";

loadEnv({ path: resolve(__dirname, "../.env") });

type RealtimeTransport = NonNullable<
  NonNullable<SupabaseClientOptions<"public">["realtime"]>["transport"]
>;

// ws implements the supported Node transport; its event typings differ from the browser-shaped Supabase interface.
const realtimeTransport = WebSocket as unknown as RealtimeTransport;

declare global {
  namespace Express {
    interface Request {
      supabase?: SupabaseClient;
      userId?: string;
    }
  }
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_ANON_KEY must be configured. Copy backend/.env.example to backend/.env and set your Supabase project values."
  );
}

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "50kb" }));

app.get("/", (_req, res) => {
  res.send("Travel Social API is running!");
});

app.get("/api/hello", (_req, res) => {
  res.json({
    message: "Hello from the Travel Social backend!",
    status: "success",
  });
});

app.use("/api", async (req, res, next) => {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    res.status(401).json({ error: "A valid bearer token is required." });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${match[1]}` } },
    realtime: { transport: realtimeTransport },
  });
  const { data, error } = await supabase.auth.getUser(match[1]);

  if (error || !data.user) {
    res.status(401).json({ error: "The access token is invalid or expired." });
    return;
  }

  req.supabase = supabase;
  req.userId = data.user.id;
  next();
});

function getSupabase(req: Request): SupabaseClient {
  if (!req.supabase) {
    throw new ApiError(401, "Authentication is required.");
  }
  return req.supabase;
}

function getUserId(req: Request): string {
  if (!req.userId) {
    throw new ApiError(401, "Authentication is required.");
  }
  return req.userId;
}

function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `The ${name} parameter is required.`);
  }
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value)) {
    throw new ApiError(400, `The ${name} parameter must be a UUID.`);
  }
  return value;
}

function getBody(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new ApiError(400, "A JSON object is required.");
  }
  return req.body as Record<string, unknown>;
}

function requiredString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number
): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${key} must be a non-empty string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${key} must be at most ${maxLength} characters.`);
  }
  return trimmed;
}

function optionalString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number
): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new ApiError(400, `${key} must be a string of at most ${maxLength} characters.`);
  }
  return value.trim() || null;
}

function optionalUrl(body: Record<string, unknown>, key: string): string | null {
  const value = optionalString(body, key, 2048);
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new ApiError(400, `${key} must be a valid HTTP or HTTPS URL.`);
  }
  return value;
}

function throwOnDatabaseError(
  error: { code?: string; message: string } | null
): void {
  if (error) {
    if (error.code === "PGRST202" || error.code === "PGRST205") {
      throw new ApiError(
        503,
        "The Supabase database schema is missing or out of date. Run backend/supabase/schema.sql in your Supabase project's SQL Editor."
      );
    }
    if (error.code === "23505") {
      throw new ApiError(409, "A record with the same unique value already exists.");
    }
    if (error.code === "42501") {
      throw new ApiError(403, "You do not have permission to perform this action.");
    }
    if (error.code === "23503") {
      throw new ApiError(404, "The referenced record does not exist.");
    }
    if (error.code === "23514" || error.code === "22P02") {
      throw new ApiError(400, "The request contains invalid data.");
    }
    if (error.code === "P0001") {
      const message = error.message;
      const status = /not found/i.test(message)
        ? 404
        : /only the room creator|authentication is required|permission/i.test(message)
          ? 403
          : 409;
      throw new ApiError(status, message);
    }
    throw error;
  }
}

app.get("/api/posts", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("post_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  throwOnDatabaseError(error);
  res.json(data);
});

app.post("/api/posts", async (req, res) => {
  const body = getBody(req);
  const post = {
    author_id: getUserId(req),
    content: requiredString(body, "content", 2000),
    location: optionalString(body, "location", 120),
    image_url: optionalUrl(body, "image_url"),
  };
  const { data, error } = await getSupabase(req)
    .from("posts")
    .insert(post)
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.get("/api/posts/:postId/comments", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("comment_feed")
    .select("*")
    .eq("post_id", getParam(req, "postId"))
    .order("created_at", { ascending: true })
    .limit(100);
  throwOnDatabaseError(error);
  res.json(data);
});

app.post("/api/posts/:postId/comments", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("comments")
    .insert({
      post_id: getParam(req, "postId"),
      author_id: getUserId(req),
      content: requiredString(getBody(req), "content", 1000),
    })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.get("/api/posts/:postId/likes", async (req, res) => {
  const supabase = getSupabase(req);
  const postId = getParam(req, "postId");
  const [countResult, likedResult] = await Promise.all([
    supabase
      .from("post_likes")
      .select("post_id", { count: "exact", head: true })
      .eq("post_id", postId),
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", getUserId(req))
      .maybeSingle(),
  ]);
  throwOnDatabaseError(countResult.error);
  throwOnDatabaseError(likedResult.error);
  res.json({ count: countResult.count ?? 0, liked: Boolean(likedResult.data) });
});

app.post("/api/posts/:postId/likes", async (req, res) => {
  const { error } = await getSupabase(req)
    .from("post_likes")
    .upsert(
      { post_id: getParam(req, "postId"), user_id: getUserId(req) },
      { onConflict: "post_id,user_id", ignoreDuplicates: true }
    );
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.delete("/api/posts/:postId/likes", async (req, res) => {
  const { error } = await getSupabase(req)
    .from("post_likes")
    .delete()
    .eq("post_id", getParam(req, "postId"))
    .eq("user_id", getUserId(req));
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.get("/api/saved-posts", async (req, res) => {
  const supabase = getSupabase(req);
  const { data: saved, error } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("user_id", getUserId(req))
    .order("created_at", { ascending: false });
  throwOnDatabaseError(error);
  const postIds = (saved ?? []).map((item) => item.post_id);
  if (!postIds.length) {
    res.json([]);
    return;
  }
  const { data: posts, error: postsError } = await supabase
    .from("post_feed")
    .select("*")
    .in("id", postIds);
  throwOnDatabaseError(postsError);
  const byId = new Map((posts ?? []).map((post) => [post.id, post]));
  res.json(postIds.map((id) => byId.get(id)).filter((post) => post !== undefined));
});

app.post("/api/posts/:postId/save", async (req, res) => {
  const { error } = await getSupabase(req)
    .from("saved_posts")
    .upsert(
      { post_id: getParam(req, "postId"), user_id: getUserId(req) },
      { onConflict: "post_id,user_id", ignoreDuplicates: true }
    );
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.delete("/api/posts/:postId/save", async (req, res) => {
  const { error } = await getSupabase(req)
    .from("saved_posts")
    .delete()
    .eq("post_id", getParam(req, "postId"))
    .eq("user_id", getUserId(req));
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.get("/api/stories", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("stories")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(100);
  throwOnDatabaseError(error);
  res.json(data);
});

app.post("/api/stories", async (req, res) => {
  const body = getBody(req);
  const content = optionalString(body, "content", 1000);
  const mediaUrl = optionalUrl(body, "media_url");
  if (!content && !mediaUrl) {
    throw new ApiError(400, "Provide story content, a media_url, or both.");
  }
  const { data, error } = await getSupabase(req)
    .from("stories")
    .insert({
      author_id: getUserId(req),
      content,
      media_url: mediaUrl,
    })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.delete("/api/stories/:storyId", async (req, res) => {
  const { error } = await getSupabase(req)
    .from("stories")
    .delete()
    .eq("id", getParam(req, "storyId"))
    .eq("author_id", getUserId(req));
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.get("/api/rooms/:roomId/messages", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("room_messages")
    .select("*")
    .eq("room_id", getParam(req, "roomId"))
    .order("created_at", { ascending: false })
    .limit(100);
  throwOnDatabaseError(error);
  res.json(data?.reverse() ?? []);
});

app.post("/api/rooms/:roomId/messages", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("room_messages")
    .insert({
      room_id: getParam(req, "roomId"),
      author_id: getUserId(req),
      content: requiredString(getBody(req), "content", 2000),
    })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.get("/api/conversations", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("conversation_feed")
    .select("*")
    .or(`user_one.eq.${getUserId(req)},user_two.eq.${getUserId(req)}`)
    .order("updated_at", { ascending: false })
    .limit(100);
  throwOnDatabaseError(error);
  res.json(data);
});

app.post("/api/conversations", async (req, res) => {
  const username = requiredString(getBody(req), "username", 30).replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new ApiError(400, "username must contain 3-30 lowercase letters, numbers, or underscores.");
  }
  const supabase = getSupabase(req);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();
  throwOnDatabaseError(profileError);
  if (!profile) {
    throw new ApiError(404, "No traveler has that username.");
  }
  const currentUserId = getUserId(req);
  if (profile.user_id === currentUserId) {
    throw new ApiError(400, "You cannot start a conversation with yourself.");
  }
  const [userOne, userTwo] = currentUserId < profile.user_id
    ? [currentUserId, profile.user_id]
    : [profile.user_id, currentUserId];
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_one", userOne)
    .eq("user_two", userTwo)
    .maybeSingle();
  throwOnDatabaseError(existingError);
  if (existing) {
    res.json({ id: existing.id });
    return;
  }
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_one: userOne, user_two: userTwo, created_by: currentUserId })
    .select("id")
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.get("/api/conversations/:conversationId/messages", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("direct_messages")
    .select("*")
    .eq("conversation_id", getParam(req, "conversationId"))
    .order("created_at", { ascending: false })
    .limit(100);
  throwOnDatabaseError(error);
  res.json(data?.reverse() ?? []);
});

app.post("/api/conversations/:conversationId/messages", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("direct_messages")
    .insert({
      conversation_id: getParam(req, "conversationId"),
      sender_id: getUserId(req),
      content: requiredString(getBody(req), "content", 2000),
    })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.post("/api/profiles/:userId/follow", async (req, res) => {
  const followingId = getParam(req, "userId");
  const followerId = getUserId(req);
  if (followingId === followerId) {
    throw new ApiError(400, "You cannot follow your own profile.");
  }
  const { error } = await getSupabase(req)
    .from("follows")
    .upsert(
      { follower_id: followerId, following_id: followingId },
      { onConflict: "follower_id,following_id", ignoreDuplicates: true }
    );
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.delete("/api/profiles/:userId/follow", async (req, res) => {
  const { error } = await getSupabase(req)
    .from("follows")
    .delete()
    .eq("follower_id", getUserId(req))
    .eq("following_id", getParam(req, "userId"));
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.get("/api/posts/:postId", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("post_feed")
    .select("*")
    .eq("id", getParam(req, "postId"))
    .maybeSingle();
  throwOnDatabaseError(error);
  if (!data) {
    throw new ApiError(404, "Post not found.");
  }
  res.json(data);
});

app.put("/api/posts/:postId", async (req, res) => {
  const body = getBody(req);
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.content !== undefined) {
    updates.content = requiredString(body, "content", 2000);
  }
  if (body.location !== undefined) {
    updates.location = optionalString(body, "location", 120);
  }
  if (body.image_url !== undefined) {
    updates.image_url = optionalUrl(body, "image_url");
  }
  if (Object.keys(updates).length === 1) {
    throw new ApiError(400, "Provide at least one post field to update.");
  }
  const { data, error } = await getSupabase(req)
    .from("posts")
    .update(updates)
    .eq("id", getParam(req, "postId"))
    .eq("author_id", getUserId(req))
    .select()
    .maybeSingle();
  throwOnDatabaseError(error);
  if (!data) {
    throw new ApiError(404, "Post not found or you do not have permission to edit it.");
  }
  res.json(data);
});

app.delete("/api/posts/:postId", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("posts")
    .delete()
    .eq("id", getParam(req, "postId"))
    .eq("author_id", getUserId(req))
    .select("id")
    .maybeSingle();
  throwOnDatabaseError(error);
  if (!data) {
    throw new ApiError(404, "Post not found or you do not have permission to delete it.");
  }
  res.status(204).end();
});

app.put("/api/posts/:postId/comments/:commentId", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("comments")
    .update({
      content: requiredString(getBody(req), "content", 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", getParam(req, "commentId"))
    .eq("post_id", getParam(req, "postId"))
    .eq("author_id", getUserId(req))
    .select()
    .maybeSingle();
  throwOnDatabaseError(error);
  if (!data) {
    throw new ApiError(404, "Comment not found or you do not have permission to edit it.");
  }
  res.json(data);
});

app.delete("/api/posts/:postId/comments/:commentId", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("comments")
    .delete()
    .eq("id", getParam(req, "commentId"))
    .eq("post_id", getParam(req, "postId"))
    .eq("author_id", getUserId(req))
    .select("id")
    .maybeSingle();
  throwOnDatabaseError(error);
  if (!data) {
    throw new ApiError(404, "Comment not found or you do not have permission to delete it.");
  }
  res.status(204).end();
});

app.get("/api/profiles/:userId", async (req, res) => {
  const userId = getParam(req, "userId");
  const supabase = getSupabase(req);
  let { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  throwOnDatabaseError(currentProfileError);
  if (!currentProfile && userId === getUserId(req)) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      throw authError;
    }
    if (authData.user) {
      const metadata = authData.user.user_metadata ?? {};
      const requestedUsername = typeof metadata.username === "string"
        ? metadata.username.toLowerCase()
        : "";
      let username = /^[a-z0-9_]{3,30}$/.test(requestedUsername)
        ? requestedUsername
        : `traveler_${userId.slice(0, 8)}`;
      const { data: usernameOwner, error: usernameError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      throwOnDatabaseError(usernameError);
      if (usernameOwner && usernameOwner.user_id !== userId) {
        username = `traveler_${userId.slice(0, 8)}`;
      }
      const displayName = typeof metadata.full_name === "string" && metadata.full_name.trim()
        ? metadata.full_name.trim().slice(0, 80)
        : authData.user.email?.split("@")[0]?.slice(0, 80) || "Traveler";
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          username,
          display_name: displayName,
          bio: typeof metadata.bio === "string" ? metadata.bio.slice(0, 300) : null,
          location: typeof metadata.location === "string" ? metadata.location.slice(0, 120) : null,
          interests: Array.isArray(metadata.interests)
            ? metadata.interests.filter((interest: unknown): interest is string => typeof interest === "string").slice(0, 30)
            : [],
        }, { onConflict: "user_id", ignoreDuplicates: true })
        .select()
        .maybeSingle();
      throwOnDatabaseError(error);
      currentProfile = data;
    }
  }
  const [postsResult, postCountResult, followersResult, followingResult, followResult, membershipsResult] =
    await Promise.all([
      supabase
        .from("post_feed")
        .select("*")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", userId),
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", userId),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", getUserId(req))
        .eq("following_id", userId)
        .maybeSingle(),
      supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", userId),
    ]);
  throwOnDatabaseError(postsResult.error);
  throwOnDatabaseError(postCountResult.error);
  throwOnDatabaseError(followersResult.error);
  throwOnDatabaseError(followingResult.error);
  throwOnDatabaseError(followResult.error);
  throwOnDatabaseError(membershipsResult.error);
  if (!currentProfile) {
    throw new ApiError(404, "Profile not found.");
  }
  const roomIds = (membershipsResult.data ?? []).map((membership) => membership.room_id);
  const { data: joinedRooms, error: roomsError } = roomIds.length
    ? await supabase
      .from("rooms")
      .select("id, name, destination, departure_date, return_date, cover_url, is_public")
      .in("id", roomIds)
      .order("departure_date")
    : { data: [], error: null };
  throwOnDatabaseError(roomsError);
  res.json({
    profile: currentProfile,
    posts: postsResult.data,
    posts_count: postCountResult.count ?? 0,
    followers_count: followersResult.count ?? 0,
    following_count: followingResult.count ?? 0,
    is_following: Boolean(followResult.data),
    joined_rooms: joinedRooms ?? [],
  });
});

app.put("/api/profile", async (req, res) => {
  const body = getBody(req);
  const username = requiredString(body, "username", 30).toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new ApiError(400, "username must contain 3-30 lowercase letters, numbers, or underscores.");
  }
  const interests = body.interests;
  if (interests !== undefined &&
    (!Array.isArray(interests) ||
      interests.length > 30 ||
      interests.some((interest) => typeof interest !== "string" || interest.length > 40))) {
    throw new ApiError(400, "interests must be an array of at most 30 strings of up to 40 characters.");
  }
  const profile = {
    user_id: getUserId(req),
    username,
    display_name: requiredString(body, "display_name", 80),
    bio: optionalString(body, "bio", 300),
    location: optionalString(body, "location", 120),
    avatar_url: optionalUrl(body, "avatar_url"),
    cover_url: optionalUrl(body, "cover_url"),
    interests: interests ?? [],
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await getSupabase(req)
    .from("profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.json(data);
});

app.get("/api/communities", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  throwOnDatabaseError(error);
  res.json(data ?? []);
});

app.get("/api/communities/:slug", async (req, res) => {
  const slug = req.params.slug;
  if (!slug || Array.isArray(slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ApiError(400, "A valid community slug is required.");
  }
  const { data, error } = await getSupabase(req)
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  throwOnDatabaseError(error);
  if (!data) {
    throw new ApiError(404, "Community not found.");
  }
  res.json(data);
});

app.post("/api/communities", async (req, res) => {
  const body = getBody(req);
  const slug = requiredString(body, "slug", 60).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ApiError(400, "slug must contain lowercase letters, numbers, and single hyphens.");
  }
  const { data, error } = await getSupabase(req)
    .from("communities")
    .insert({
      creator_id: getUserId(req),
      slug,
      name: requiredString(body, "name", 80),
      city: requiredString(body, "city", 120),
      description: optionalString(body, "description", 500),
      image_url: optionalUrl(body, "image_url"),
    })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

function optionalNumber(
  body: Record<string, unknown>,
  key: string,
  min: number,
  max: number
): number | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ApiError(400, `${key} must be a number between ${min} and ${max}.`);
  }
  return value;
}

function optionalDate(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new ApiError(400, `${key} must be a valid YYYY-MM-DD date.`);
  }
  return value;
}

app.get("/api/rooms", async (req, res) => {
  const supabase = getSupabase(req);
  const minBudget = typeof req.query.minBudget === "string" ? Number(req.query.minBudget) : null;
  const maxBudget = typeof req.query.maxBudget === "string" ? Number(req.query.maxBudget) : null;
  if ((minBudget !== null && (!Number.isFinite(minBudget) || minBudget < 0)) ||
    (maxBudget !== null && (!Number.isFinite(maxBudget) || maxBudget < 0)) ||
    (minBudget !== null && maxBudget !== null && minBudget > maxBudget)) {
    throw new ApiError(400, "Budget filters must be non-negative numbers and minBudget cannot exceed maxBudget.");
  }
  const dateFilter: Record<string, unknown> = {
    earliest: typeof req.query.earliest === "string" ? req.query.earliest : null,
    latest: typeof req.query.latest === "string" ? req.query.latest : null,
  };
  const earliest = optionalDate(dateFilter, "earliest");
  const latest = optionalDate(dateFilter, "latest");
  if (earliest && latest && latest < earliest) {
    throw new ApiError(400, "latest must be on or after earliest.");
  }
  const { data, error } = await supabase.rpc("discover_rooms", {
    destination_query: typeof req.query.destination === "string" && req.query.destination.trim()
      ? req.query.destination.trim().slice(0, 100)
      : null,
    category_filter: typeof req.query.category === "string" && req.query.category.trim()
      ? req.query.category.trim().slice(0, 40)
      : null,
    min_budget: minBudget,
    max_budget: maxBudget,
    earliest_departure: earliest,
    latest_departure: latest,
  });
  throwOnDatabaseError(error);
  res.json(data);
});

app.post("/api/rooms", async (req, res) => {
  const body = getBody(req);
  const departureDate = optionalDate(body, "departure_date");
  const returnDate = optionalDate(body, "return_date");
  if (departureDate && returnDate && returnDate < departureDate) {
    throw new ApiError(400, "return_date must be on or after departure_date.");
  }
  const maxMembers = optionalNumber(body, "max_members", 2, 100) ?? 8;
  if (!Number.isInteger(maxMembers)) {
    throw new ApiError(400, "max_members must be a whole number.");
  }
  if (body.is_public !== undefined && typeof body.is_public !== "boolean") {
    throw new ApiError(400, "is_public must be a boolean.");
  }
  const { data, error } = await getSupabase(req)
    .from("rooms")
    .insert({
      creator_id: getUserId(req),
      name: requiredString(body, "name", 80),
      description: optionalString(body, "description", 500),
      destination: optionalString(body, "destination", 120),
      start_location: optionalString(body, "start_location", 120),
      departure_date: departureDate,
      return_date: returnDate,
      budget: optionalNumber(body, "budget", 0, 10000000),
      max_members: maxMembers,
      category: optionalString(body, "category", 40),
      cover_url: optionalUrl(body, "cover_url"),
      is_public: body.is_public === undefined ? true : body.is_public,
    })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.get("/api/rooms/:roomId", async (req, res) => {
  const supabase = getSupabase(req);
  const roomId = getParam(req, "roomId");
  const { data: room, error } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
  throwOnDatabaseError(error);
  if (!room) {
    throw new ApiError(404, "Room not found or you do not have access.");
  }
  const { data: members, error: membersError } = await supabase
    .from("room_members")
    .select("user_id, joined_at")
    .eq("room_id", roomId)
    .order("joined_at");
  throwOnDatabaseError(membersError);
  const memberIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles, error: profilesError } = memberIds.length
    ? await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", memberIds)
    : { data: [], error: null };
  throwOnDatabaseError(profilesError);
  const { data: creatorProfile, error: creatorProfileError } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .eq("user_id", room.creator_id)
    .maybeSingle();
  throwOnDatabaseError(creatorProfileError);
  res.json({
    ...room,
    creator_profile: creatorProfile,
    members: (members ?? []).map((member) => ({
      ...member,
      profile: profiles?.find((profile) => profile.user_id === member.user_id) ?? null,
    })),
  });
});

app.post("/api/rooms/:roomId/join", async (req, res) => {
  const supabase = getSupabase(req);
  const roomId = getParam(req, "roomId");
  const { data, error } = await supabase.rpc("request_or_join_room", { target_room_id: roomId });
  throwOnDatabaseError(error);
  res.status(data === "requested" ? 202 : 200).json({ status: data });
});

app.delete("/api/rooms/:roomId/membership", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("room_members")
    .delete()
    .eq("room_id", getParam(req, "roomId"))
    .eq("user_id", getUserId(req))
    .select("room_id")
    .maybeSingle();
  throwOnDatabaseError(error);
  if (!data) {
    throw new ApiError(404, "Membership not found or room creator cannot leave their own room.");
  }
  res.status(204).end();
});

app.post("/api/rooms/:roomId/invitations", async (req, res) => {
  const body = getBody(req);
  const supabase = getSupabase(req);
  let inviteeId: string;
  if (typeof body.invitee_username === "string" && body.invitee_username.trim()) {
    const username = body.invitee_username.trim().replace(/^@/, "").toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      throw new ApiError(400, "invitee_username must be a valid username.");
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    throwOnDatabaseError(profileError);
    if (!profile) {
      throw new ApiError(404, "No traveler has that username.");
    }
    inviteeId = profile.user_id;
  } else {
    inviteeId = requiredString(body, "invitee_id", 36);
    if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(inviteeId)) {
      throw new ApiError(400, "invitee_id must be a UUID.");
    }
  }
  if (inviteeId === getUserId(req)) {
    throw new ApiError(400, "You cannot invite yourself.");
  }
  const { data, error } = await supabase
    .from("room_invitations")
    .insert({
      room_id: getParam(req, "roomId"),
      inviter_id: getUserId(req),
      invitee_id: inviteeId,
    })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.get("/api/invitations", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("room_invitations")
    .select("*, rooms(id, name, destination, cover_url, is_public)")
    .eq("invitee_id", getUserId(req))
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  throwOnDatabaseError(error);
  res.json(data);
});

app.post("/api/invitations/:invitationId/respond", async (req, res) => {
  const accepted = getBody(req).accept;
  if (typeof accepted !== "boolean") {
    throw new ApiError(400, "accept must be a boolean.");
  }
  const { error } = await getSupabase(req).rpc("respond_room_invitation", {
    target_invitation_id: getParam(req, "invitationId"),
    accept_invitation: accepted,
  });
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.get("/api/rooms/:roomId/requests", async (req, res) => {
  const supabase = getSupabase(req);
  const { data, error } = await supabase
    .from("room_join_requests")
    .select("*")
    .eq("room_id", getParam(req, "roomId"))
    .eq("status", "pending")
    .order("created_at");
  throwOnDatabaseError(error);
  const userIds = (data ?? []).map((request) => request.user_id);
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds)
    : { data: [], error: null };
  throwOnDatabaseError(profilesError);
  res.json((data ?? []).map((request) => ({
    ...request,
    profile: profiles?.find((profile) => profile.user_id === request.user_id) ?? null,
  })));
});

app.post("/api/rooms/:roomId/requests/:requestId/respond", async (req, res) => {
  const approved = getBody(req).approve;
  if (typeof approved !== "boolean") {
    throw new ApiError(400, "approve must be a boolean.");
  }
  const { error } = await getSupabase(req).rpc("resolve_room_join_request", {
    target_request_id: getParam(req, "requestId"),
    target_room_id: getParam(req, "roomId"),
    approve_request: approved,
  });
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.get("/api/notifications", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("notifications")
    .select("*")
    .eq("user_id", getUserId(req))
    .order("created_at", { ascending: false })
    .limit(100);
  throwOnDatabaseError(error);
  res.json(data);
});

app.patch("/api/notifications/read", async (req, res) => {
  const body = getBody(req);
  let query = getSupabase(req)
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", getUserId(req))
    .is("read_at", null);
  if (typeof body.id === "string") {
    query = query.eq("id", body.id);
  }
  const { error } = await query;
  throwOnDatabaseError(error);
  res.status(204).end();
});

app.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("API request failed:", error);
    res.status(500).json({ error: "An unexpected server error occurred." });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
