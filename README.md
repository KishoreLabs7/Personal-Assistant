# Personal Assistant

A personal assistant that notifies you of upcoming calendar meetings and identifies important emails using Gemini AI.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` to your Gemini API key.
3. Start the app: `npm run dev`

## Scripts

- `npm run dev` starts the dev server (Express + Vite).
- `npm run build` builds the client and bundles the server into `dist/`.
- `npm start` runs the production build.
- `npm run lint` type-checks the project.

## Styling

The UI is dark-only and uses Tailwind CSS v4. The theme tokens live in the `@theme` block in `src/index.css`:

- **Surfaces** go from `surface-0` (the page) through `surface-100` (cards) and `surface-200` (inset rows) up to `surface-300`, `surface-350` and `surface-400` (hover states).
- **Lines and text:** `border` is the 1px line, and `ink` is the body text color.
- **Accent and signals:** `blue-600` is the primary action color, `amber-500` marks upcoming items and `red-400`/`red-500` mark urgent ones. All three are Tailwind defaults.

Use these token classes (for example `bg-surface-100 border-border text-ink`) rather than raw hex values.
