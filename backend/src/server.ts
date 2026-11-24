import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

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
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be configured.");
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
    if (error.code === "23505") {
      throw new ApiError(409, "A record with the same unique value already exists.");
    }
    throw error;
  }
}

app.get("/api/posts", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("posts")
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
    .from("comments")
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

app.get("/api/rooms", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("rooms")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  throwOnDatabaseError(error);
  res.json(data);
});

app.post("/api/rooms", async (req, res) => {
  const body = getBody(req);
  const { data, error } = await getSupabase(req)
    .from("rooms")
    .insert({
      creator_id: getUserId(req),
      name: requiredString(body, "name", 80),
      description: optionalString(body, "description", 500),
    })
    .select()
    .single();
  throwOnDatabaseError(error);
  res.status(201).json(data);
});

app.post("/api/rooms/:roomId/join", async (req, res) => {
  const { error } = await getSupabase(req)
    .from("room_members")
    .upsert(
      { room_id: getParam(req, "roomId"), user_id: getUserId(req) },
      { onConflict: "room_id,user_id", ignoreDuplicates: true }
    );
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

app.get("/api/profiles/:userId", async (req, res) => {
  const { data, error } = await getSupabase(req)
    .from("profiles")
    .select("*")
    .eq("user_id", getParam(req, "userId"))
    .maybeSingle();
  throwOnDatabaseError(error);
  if (!data) {
    throw new ApiError(404, "Profile not found.");
  }
  res.json(data);
});

app.put("/api/profile", async (req, res) => {
  const body = getBody(req);
  const username = requiredString(body, "username", 30).toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new ApiError(400, "username must contain 3-30 lowercase letters, numbers, or underscores.");
  }
  const profile = {
    user_id: getUserId(req),
    username,
    display_name: requiredString(body, "display_name", 80),
    bio: optionalString(body, "bio", 300),
    location: optionalString(body, "location", 120),
    avatar_url: optionalUrl(body, "avatar_url"),
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
