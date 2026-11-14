# Snack Overflow

A production-minded office pantry tracker built for the Bipolar Factory assignment.

## Monorepo Architecture

This project is organized as an npm workspace monorepo:

- [`apps/web`](apps/web): Next.js frontend (React 19, TypeScript, Tailwind CSS, App Router)
- [`apps/api`](apps/api): Express.js REST API (TypeScript, Prisma ORM, PostgreSQL, Zod validation)

## Prerequisites

- Node.js >= 20 (tested on v24.13.0)
- npm >= 10 (tested on 11.6.2)
- PostgreSQL running on `localhost:5432`

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` or set app-level environment variables:
   ```bash
   cp .env.example .env
   ```

3. **Run development servers:**
   - Run backend API: `npm run dev:api` (runs on http://localhost:4000)
   - Run frontend: `npm run dev:web` (runs on http://localhost:3000)

4. **Type-check & Build:**
   ```bash
   npm run type-check
   npm run build
   ```
