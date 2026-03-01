# Pull (MVP)

Pull is a journal-first social app:
- quick tweet-style posting in a main feed
- profile modules for projects, music, and movies/series
- optional publish-to-feed toggle when adding profile items
- item privacy (Public/Private)
- discover tabs by category

## Stack

- Next.js App Router (full-stack)
- NextAuth (Google)
- Prisma + SQLite (dev)
- Tailwind CSS

## Local setup

1. Install dependencies:

	npm install

2. Copy env file and set secrets:

	cp .env.example .env

3. Fill OAuth variables in `.env`:

	- `GOOGLE_CLIENT_ID`
	- `GOOGLE_CLIENT_SECRET`
	- `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` (`true` when configured, otherwise `false`)
	- `NEXTAUTH_SECRET`

4. Generate Prisma client and migrate database:

	npm run prisma:generate
	npm run prisma:migrate -- --name init

5. Start app:

	npm run dev

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run typecheck` - TypeScript check
- `npm run lint` - ESLint
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run Prisma migrations

## Current MVP routes

- `/feed`
- `/u/[handle]`
- `/discover/projects`
- `/discover/music`
- `/discover/movies-series`
