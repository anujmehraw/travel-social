# Travel Social API

The API uses Supabase Auth to identify the caller and Supabase Postgres with
row-level security for persistent data. Every `/api` route except `/api/hello`
requires `Authorization: Bearer <supabase access token>`.

## Setup

1. In the Supabase SQL editor for your project, run [`supabase/schema.sql`](./supabase/schema.sql).
2. Set the backend environment variables in the same terminal where you run it:

   ```powershell
   $env:SUPABASE_URL = "https://your-project.supabase.co"
   $env:SUPABASE_ANON_KEY = "your-supabase-anon-key"
   $env:FRONTEND_ORIGIN = "http://localhost:5173"
   $env:PORT = "5000"
   ```

3. Install dependencies and start the API:

   ```powershell
   npm install
   npm run dev
   ```

The API only uses the Supabase anon key; authorization is delegated to the
signed-in user's access token and database RLS policies. Do not configure a
service-role key in the backend.

## Endpoints

All request and response bodies use JSON. IDs are Supabase UUIDs.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` / `POST` | `/api/posts` | List recent posts / create a post (`content`, optional `location`, `image_url`) |
| `GET` / `POST` | `/api/posts/:postId/comments` | List comments / add a comment (`content`) |
| `GET` / `POST` / `DELETE` | `/api/posts/:postId/likes` | Get like count and caller's like state / like / unlike |
| `GET` / `POST` | `/api/stories` | List active stories / create a story (`content`, `media_url`, or both) |
| `DELETE` | `/api/stories/:storyId` | Delete your story |
| `GET` / `POST` | `/api/rooms` | List rooms / create a room (`name`, optional `description`) |
| `POST` | `/api/rooms/:roomId/join` | Join a room |
| `GET` / `POST` | `/api/rooms/:roomId/messages` | Read room messages / send a message (`content`) |
| `GET` | `/api/profiles/:userId` | Read a profile |
| `PUT` | `/api/profile` | Create or update your profile (`username`, `display_name`, optional `bio`, `location`, `avatar_url`) |
| `POST` / `DELETE` | `/api/profiles/:userId/follow` | Follow / unfollow a profile |

Stories expire after 24 hours. Images and story media are supplied as HTTP(S)
URLs; file uploads and realtime message delivery are not part of this API.
