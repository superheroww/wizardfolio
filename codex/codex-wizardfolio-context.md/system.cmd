# WizardFolio — Codex Master Context

## Purpose
WizardFolio is a Canadian-focused ETF exposure visualizer. Public users can build ETF mixes, run exposure analysis, and view results without authentication. Signing in unlocks personalized features such as saving mixes and viewing a dashboard of saved mixes. The product is mobile-first, simple, fast, and visual.

## MVP Scope
The active product surface is:
- Home → build a mix
- Analyze → `/results`
- Save mix → sign-in required
- Dashboard of saved mixes
- Optional: compare mixes or against benchmarks

## Tech Stack
- **Next.js App Router** (TypeScript, React)
- **Supabase** (Auth, Postgres, RLS, Storage)
- **Tailwind CSS**
- **Vercel** (frontend + serverless backend routes)
- **Internal ETF look-through engine**
- **PostHog** (analytics; no special handling needed here)

## Core Principles
- Public funnel must NOT be gated by auth.
- Never block a user from seeing results.
- Sign-in should appear ONLY when the user performs a personalized action:
  - Saving a mix
  - Opening dashboard
  - Comparing saved mixes
- Google sign-in is the primary auth method.
- Email/password signup works normally (no confirmation UX needed).
- Mobile-first layout with simple spacing, Apple-like minimalism.
- All new Supabase tables must include RLS policies within the same migration file.
- Broker data (future) = read-only.
- Manual data + saved mixes = editable by owner only.

## Data Model Notes
### `public.mix_events`
- Tracks anonymous usage of mixes built on the site.
- Do not modify this table.
- This data is NOT tied to user accounts.

### `public.saved_mixes` (new)
- Contains saved mix definitions for authenticated users.
- Required columns:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null`
  - `name text not null`
  - `positions jsonb not null`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- RLS:
  - Owner can select, insert, update, delete their rows.
  - Nobody else can access them.

## Auth Behavior
- Use Supabase auth on both server and client.
- Use:
  - `signInWithOAuth({ provider: 'google' })`
  - `signUp({ email, password })` and `signInWithPassword`
  - `signOut()`
- No redirect pages.
- Inject a small "Sign in" button into the header when logged out.
- After successful login for an action (e.g. save mix), continue that action automatically.

## UI Behavior Patterns
### Auth Dialog (Reusable)
- Modal or bottom sheet.
- Primary button: Continue with Google.
- Divider.
- Email/password form.
- On success: call `onAuthSuccess` callback if provided.

### Results Page
- Show a prominent “Save this mix” button.
- If logged out:
  - Open Auth Dialog → then save.
- If logged in:
  - Save directly (optionally let user rename).

### Dashboard
- Route: `/dashboard`
- Requires auth. If not logged in, open Auth Dialog.
- Display list of saved mixes as mobile-first cards.
- Tapping a card reopens `/results` with the saved positions.
- Editing or deleting mixes should use small dialogs.

### Compare Features (Optional MVP)
- Compare one mix against benchmark:
  - Dropdown of common ETFs.
  - Tabs: Your Mix | Benchmark | Differences.
- Compare two saved mixes:
  - Pick Mix A → Pick Mix B.
  - Tabs instead of side-by-side visuals (mobile-first).

## File Locations (Conventions)
- Components: `src/components/...`
- Pages: `src/app/...`
- API routes: `src/app/api/...`
- Supabase helpers: `src/lib/supabase-*.ts`
- Shared types: `src/types/...`

## Coding Conventions for Codex
When generating or modifying code, adhere to these rules:

### General
- Use TypeScript everywhere.
- Prefer server components for data fetching via Supabase server client.
- Use client components only for interactive UI or auth flows.
- Ensure accessibility and responsive design.
- Minimalist Tailwind classes.

### Auth
- Never add sign-in redirects.
- Never force login before accessing `/results`.
- Never mention email confirmation in UI.
- The auth modal must remain small and reusable.

### Supabase
- For server routes, always use the Supabase auth-aware client so RLS applies.
- Every new table must come with RLS inside the migration.
- Owner-based policies must follow the pattern:
  - `auth.uid() = user_id`

### Mix Saving
- When saving:
  - Validate shape of `positions`.
  - Generate a default name if not provided.
  - Insert into `saved_mixes`.
  - Show toast feedback.

### Results Rehydration
When loading saved mix:
- Option 1: Pass positions through querystring (`positions=...`).
- Option 2: Create a route like `/results/[mixId]` that loads from DB.
- Codex should choose the simplest, unless instructed otherwise.

## Codex Commands You Can Use
Codex should react to structured commands when present:

### `add-api`
Create or update a Next.js App Router API route using Supabase server client and proper typing.

### `add-table`
Create a new Supabase table including:
- Columns
- Indexes
- RLS enable
- RLS policies

### `update-ui`
Modify an existing component or build a new one following WizardFolio’s mobile-first UI conventions.

### `refactor-component`
Rewrite an existing file for clarity, performance, or architecture alignment.

### `implement-feature`
Build an entire feature end-to-end across:
- UI
- API
- Database
- Types

Codex must keep project conventions intact at all times.

## Non-Scope Items for MVP
Codex must avoid generating or touching:
- Stripe billing
- SnapTrade integration
- PDF parsing pipeline
- OAuth proxy / Decodo integration
- Serverless cron jobs
- Notifications
- User profile pages beyond minimal auth metadata

## Final Notes
- WizardFolio must remain fast, clean, elegant, and simple.
- Never block exploration with authentication.
- Signed-in features must feel like a natural extension of the existing UX.
- All work should remain incremental and easy to ship.
