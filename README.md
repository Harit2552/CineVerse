# CineVerse Cinemas

A full-stack movie discovery and seat-booking demo for a single cinema. Browse films and showtimes, choose seats, complete a simulated checkout, and keep digital tickets in your account.

> **Demo payments only:** checkout does not charge a payment method. Supabase is used for authentication and persisted cinema/booking data.

## Quick navigation

- [Get started](#get-started)
- [Configure Supabase](#configure-supabase)
- [Try the app](#try-the-app)
- [Available commands](#available-commands)
- [Project map](#project-map)
- [Troubleshooting](#troubleshooting)

## Get started

### Requirements

- Node.js and npm, or [Bun](https://bun.sh/).
- A Supabase project for authentication and application data.

### Install and run

Clone the repository and install dependencies:

```sh
git clone https://github.com/Harit2552/CineVerse.git
cd CineVerse
bun install
```

If you use npm instead, run `npm install`.

Create a local `.env` file in the repository root and [configure the Supabase variables](#configure-supabase). Then start the development server:

```sh
bun run dev
```

With npm, use `npm run dev`. Open the local URL printed by Vite in your terminal.

## Configure Supabase

The app expects a Supabase project URL and a publishable/anonymous key. The browser client can read `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; server-side operations use `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

Add these entries to your root `.env`, replacing the placeholders with values from your Supabase project:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` is used only by trusted server-side admin operations. Keep it secret: never prefix it with `VITE_`, put it in browser code, or commit `.env`.

### Apply the database migrations

The Supabase schema and demo seed data are in [`supabase/migrations`](./supabase/migrations/). Apply the migration files in filename order to your Supabase project using the Supabase CLI or the Supabase SQL Editor. They create the cinema tables, access policies, role helper, sample movies/screens, and showtimes.

The project’s Supabase configuration is in [`supabase/config.toml`](./supabase/config.toml). If you use the CLI, link it to the Supabase project you intend to work with before applying migrations.

## Try the app

### Browse and book a movie

1. From **Home**, browse the featured film, current movies, and today’s showtimes.
2. Open **Movies** or **Shows** to find a film or choose a date.
3. Select a showtime to open its seat map.
4. Choose available seats (up to 10 per booking); the summary updates with seat pricing, fees, and taxes.
5. Continue to checkout. Sign in or create an account if prompted.
6. Choose a demo payment method and complete the simulated checkout.
7. View the confirmation ticket, download its ticket image, or find it later under **My Bookings**.

Seat availability is stored against each show. The database also enforces uniqueness for a seat within a show, so a seat booked for one screening does not automatically become booked for another screening.

### Sign in

Use **Sign in** in the header to create an account or log in with email and password. If Supabase email confirmation is enabled, follow the confirmation email before signing in.

### Use the admin dashboard

Open **Admin** from the signed-in account menu. The dashboard provides booking/revenue/occupancy summaries and management for movies and showtimes.

If no admin role exists yet, the dashboard offers a first-admin setup action to the first signed-in user. Once an admin exists, other users need an administrator role to manage the cinema.

## Available commands

| Command                                   | What it does                         |
| ----------------------------------------- | ------------------------------------ |
| `bun run dev` / `npm run dev`             | Start the local development server   |
| `bun run build` / `npm run build`         | Create a production build            |
| `bun run build:dev` / `npm run build:dev` | Build using Vite’s development mode  |
| `bun run preview` / `npm run preview`     | Preview the production build locally |
| `bun run lint` / `npm run lint`           | Run ESLint                           |
| `bun run format` / `npm run format`       | Format files with Prettier           |

## Project map

| Path                                                         | Purpose                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [`src/routes/`](./src/routes/)                               | File-based pages: home, movies, showtimes, authentication, booking, account, and admin |
| [`src/components/`](./src/components/)                       | Shared site, booking, and UI components                                                |
| [`src/integrations/supabase/`](./src/integrations/supabase/) | Supabase clients, auth middleware, and database types                                  |
| [`src/lib/`](./src/lib/)                                     | Server functions, cinema helpers, ticket generation, and error handling                |
| [`supabase/migrations/`](./supabase/migrations/)             | Database schema, access policies, and sample data                                      |
| [`public/images/`](./public/images/)                         | Theater and movie-poster assets                                                        |

TanStack Start routes are generated from files under `src/routes/`. `src/routeTree.gen.ts` is generated; edit route files rather than changing the generated route tree by hand.

## Troubleshooting

<details>
<summary><strong>The app reports missing Supabase environment variables</strong></summary>

Check that the root `.env` contains the required URL and publishable-key variables listed above, then restart the dev server. Do not paste secret keys into browser-exposed `VITE_` variables.

</details>

<details>
<summary><strong>Movies or showtimes are empty</strong></summary>

Confirm the migrations were applied to the same Supabase project configured in `.env`. The migrations include seed records for the movie catalog and showtimes.

</details>

<details>
<summary><strong>Authentication or email confirmation is not working</strong></summary>

Check the Supabase project’s Auth settings, including enabled email/password sign-in and the allowed redirect URLs for your local development address.

</details>

<details>
<summary><strong>How do I check the production build?</strong></summary>

Run `bun run build` or `npm run build`. Use `bun run preview` or `npm run preview` to serve the generated build locally.

</details>

## Security reminders

- `.env` and `package-lock.json` are ignored by Git; keep credentials out of commits.
- The service-role key bypasses row-level security and belongs only in server-side configuration.
- Payment is simulated; do not enter real payment information.
