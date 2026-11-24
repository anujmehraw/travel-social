# Travel Social frontend

## Supabase setup

Create `frontend/.env.local` with the Supabase project URL and publishable anon
key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

In the Supabase dashboard, enable Email authentication and set the site's URL
and allowed redirect URLs to include both local Vite URLs
(`http://localhost:5173` and `http://127.0.0.1:5173`) and your deployed
frontend URL. The confirmation link returns to the origin currently open in
the browser, so keep the Vite server running while testing local signup. If
email confirmation is enabled, new users must confirm their address before
they can sign in.

Signup saves the name, username, date of birth, location, interests, and bio as
Supabase Auth user metadata. The profile page uses those values for the signed-in
user; date of birth is not shown on that page.

## Run locally

```sh
npm install
npm run dev
```
