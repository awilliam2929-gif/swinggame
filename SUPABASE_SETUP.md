# Connecting the shared database (Supabase)

One-time setup, ~5 minutes. After this, all scores and history live in the
cloud: any group member can sign in from any device and see everything, and
the scorekeeper's entries save automatically.

## 1. Create the project

In your [Supabase dashboard](https://supabase.com/dashboard): **New project**
→ name it `swinggame`, pick the closest region, generate a database password
(you never need it again), wait for provisioning.

## 2. Create the tables

Dashboard → **SQL Editor** → **New query** → paste the entire contents of
[`supabase/schema.sql`](./supabase/schema.sql) from this repo → **Run**.
You should see "Success". Safe to re-run any time.

## 3. Create the group login

Dashboard → **Authentication** → **Users** → **Add user** → **Create new
user**:

- Email: anything you like (e.g. `crew@swinggame.golf` — it doesn't have to
  be a real inbox)
- Password: pick something you're happy to text the group
- Check **Auto Confirm User**

Everyone shares this one login. Sign in once per device and it sticks.

## 4. Point the site at the project

Dashboard → **Project Settings** → **API**: copy the **Project URL** and the
**anon public** key. Then in Netlify:

**Site configuration → Environment variables → Add a variable**, twice:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | the Project URL (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | the anon public key (`eyJ...`) |

Then **Deploys → Trigger deploy → Deploy site** (env vars are baked in at
build time, so one redeploy is needed).

## 5. First sign-in migrates your data

Open the site: you'll see the members-only login screen. Sign in with the
group login **on the device that has your existing scores** — the app
automatically uploads everything already stored in that browser to the
database. From then on, every change syncs live (watch the ☁️ chip in the
footer).

## Notes

- Without the two env vars, the site runs exactly as before: local-only,
  no login screen. Nothing breaks if you postpone this.
- The anon key is designed to be public (it ships in the site's code). The
  database is protected by the login, not by the key. Never expose the
  `service_role` key anywhere.
- For local dev: copy `.env.example` to `.env` and fill in the same two
  values.
