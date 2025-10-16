# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router pages, layouts, and route handlers. Prefer server components; add `"use client"` only when needed.
- `components/`: Reusable UI; colocate component styles and stories if added.
- `lib/` and `utils/`: Shared logic, data helpers, and API wrappers.
- `hooks/`: React hooks, client-only by default.
- `public/`: Static assets served at `/`.
- `types/`: Shared TypeScript types.
- Path alias: import via `@/*` (e.g., `import { fetcher } from '@/lib/fetcher'`).

## Build, Test, and Development Commands

- Install: `pnpm install` (preferred) or `npm install`.
- Develop: `pnpm dev` to run Next.js locally at `http://localhost:3000`.
- Lint: `pnpm lint` runs Next.js/ESLint checks.
- Build: `pnpm build` creates a production build in `.next/`.
- Start: `pnpm start` serves the production build.

## Coding Style & Naming Conventions

- Language: TypeScript with `strict` mode (see `tsconfig.json`).
- Indentation: 2 spaces; prefer named exports. Files use kebab-case (e.g., `trade-table.tsx`).
- React: Server-first components in `app/`; place `"use client"` at the top when required.
- Styling: Tailwind CSS; compose classes with `clsx` and `tailwind-merge` where helpful.
- Linting: `next lint` (ESLint). Fix warnings before opening a PR.

## Testing Guidelines

- No test runner is configured yet. If adding tests, prefer:
  - Unit: Vitest + React Testing Library.
  - E2E: Playwright.
- Name tests `*.test.ts(x)` and mirror the source tree (e.g., `components/button/button.test.tsx`).
- Aim for meaningful coverage on shared logic in `lib/` and `utils/`.

## Commit & Pull Request Guidelines

- Commits: short, imperative, and scoped (e.g., `fix: prevent endless loading`).
- Reference issues in the body (e.g., `Closes #123`).
- Pull Request is not required

## Security & Configuration Tips

- Secrets: never commit `.env`. Use `.env.local` for development.
- Environment: prefix client-exposed vars with `NEXT_PUBLIC_`; keep others server-only.
- External services: this repo uses Supabase and Stripe—ensure keys are configured before running locally.
