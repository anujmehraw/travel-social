# Travel Social API

The existing Express API verifies Supabase access tokens and uses the caller's
JWT with Supabase Postgres. Row-level security remains enabled; do not configure
a service-role key in the backend.

## Setup

1. In the SQL editor for your Supabase project, run or re-run
   [`supabase/schema.sql`](./supabase/schema.sql). The script creates the
   application tables, RLS policies, transactional room functions and the
   `travel-social` Storage bucket. It also installs a signup trigger that
   creates each new user's public profile from signup metadata.
2. From the repository root, copy `backend/.env.example` to `backend/.env`
   and set your Supabase
   project URL and anon/public key. The backend loads this file itself, so the
   frontend's `.env.local` is not used by Node:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

3. Install dependencies and start the API:

   ```powershell
   npm install
   npm run dev
   ```

   Run the install/start commands from the `backend` folder. `backend/.env` is
   ignored by Git; do not commit real credentials.

The browser sends the signed-in Supabase access token to the API. Configure
the frontend's `VITE_API_URL` to the API origin when it is not
`http://localhost:5000`.

## API

Except for `/` and `/api/hello`, routes below require
`Authorization: Bearer <Supabase access token>`. All IDs are UUIDs.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` / `POST` | `/api/posts` | List recent posts / create a post (`content`, optional `location`, `image_url`) |
| `GET` / `PUT` / `DELETE` | `/api/posts/:postId` | Read a post / edit or delete your own |
| `GET` / `POST` | `/api/posts/:postId/comments` | List comments / add a comment |
| `PUT` / `DELETE` | `/api/posts/:postId/comments/:commentId` | Edit or delete your own comment |
| `GET` / `POST` / `DELETE` | `/api/posts/:postId/likes` | Read count/state / like / unlike |
| `GET` | `/api/saved-posts` | List the caller's saved posts |
| `POST` / `DELETE` | `/api/posts/:postId/save` | Save or unsave a post |
| `GET` / `PUT` | `/api/profiles/:userId`, `/api/profile` | Read a profile with posts and counts / create or update your profile |
| `POST` / `DELETE` | `/api/profiles/:userId/follow` | Follow or unfollow a profile |
| `GET` / `POST` | `/api/rooms` | Search rooms or create a trip room |
| `GET` | `/api/rooms/:roomId` | Read room details and members (private rooms require authorization) |
| `POST` / `DELETE` | `/api/rooms/:roomId/join`, `/api/rooms/:roomId/membership` | Join/request access or leave a room |
| `POST` | `/api/rooms/:roomId/invitations` | Invite a registered user by username or ID |
| `GET` | `/api/invitations` | List pending invitations for the caller |
| `POST` | `/api/invitations/:invitationId/respond` | Accept or reject an invitation (`accept`) |
| `GET` / `POST` | `/api/rooms/:roomId/messages` | Read or send member-only room discussion messages |
| `GET` / `POST` | `/api/conversations` | List direct conversations or start one with a registered username |
| `GET` / `POST` | `/api/conversations/:conversationId/messages` | Read or send participant-only direct messages |
| `GET` | `/api/rooms/:roomId/requests` | List pending room requests (creator only) |
| `POST` | `/api/rooms/:roomId/requests/:requestId/respond` | Approve or reject a request (`approve`; creator only) |
| `GET` / `PATCH` | `/api/notifications`, `/api/notifications/read` | List notifications or mark one/all read |
| `GET` / `POST` | `/api/communities` | List communities / create one (`name`, `slug`, `city`, optional `description`, `image_url`) |
| `GET` | `/api/communities/:slug` | Read a community by its URL slug |

Room discovery accepts `destination`, `category`, `minBudget`, `maxBudget`,
`earliest`, and `latest` query parameters. Private room discovery returns
limited trip-card metadata; room details, members, and discussions are limited
to invited users, members, and the room creator. The database functions
serialize joins and approvals and enforce capacity.

## Image storage

Profile photos, cover photos, post photos, and room covers are uploaded to the
public `travel-social` Supabase Storage bucket. Uploads are limited to 5 MB and
JPEG, PNG, WebP, or GIF. Storage policies restrict writes/deletes to the
authenticated user's folder; public read access is necessary to display image
URLs. Database records store only the resulting URL.
