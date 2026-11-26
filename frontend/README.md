# Travel Social frontend

## Supabase setup

Create `frontend/.env.local` with the Supabase project URL and publishable anon
key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` is optional for local development and defaults to
`http://localhost:5000`. Set it to the deployed Express API origin in
production. The API must allow the frontend's origin via `FRONTEND_ORIGIN`.

In the Supabase dashboard, enable Email authentication and set the site's URL
and allowed redirect URLs to include both local Vite URLs
(`http://localhost:5173` and `http://127.0.0.1:5173`) and your deployed
frontend URL. The confirmation link returns to the origin currently open in
the browser, so keep the Vite server running while testing local signup. If
email confirmation is enabled, new users must confirm their address before
they can sign in.

Signup saves the name, username, date of birth, location, interests, and bio as
Supabase Auth user metadata. The database signup trigger copies public profile
fields into the `profiles` table; date of birth remains private auth metadata.

In the Supabase SQL editor, run `../backend/supabase/schema.sql` to create the
tables, row-level security policies, and image storage bucket before using the
feed, profile, saved stories, notifications, travel rooms, or communities.
The Express backend also needs its own `backend/.env` file; copy
`backend/.env.example` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY` there.
The frontend's `VITE_` variables are not automatically loaded by Node.

## Run locally

```sh
npm install
npm run dev
```
