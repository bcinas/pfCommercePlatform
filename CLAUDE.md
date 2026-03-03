# CLAUDE.md — pfCommercePlatform

## Project Overview

This is a full-stack e-commerce platform built for a 5-day case study evaluation.
TypeScript is used across the entire stack — always use TypeScript-first approaches.

- **Frontend:** Next.js (App Router) + Tailwind CSS → `./frontend/`
- **Backend:** Express.js + MongoDB (Mongoose) → `./backend/`
- **Language:** TypeScript everywhere. No `any` types. Shared interfaces where possible.

## Project Structure

```
pfCommercePlatform/
├── backend/
│   └── src/
│       ├── index.ts              # Express entry point
│       ├── seed.ts               # Database seeder
│       ├── config/               # DB connection, env config
│       ├── controllers/          # Route handlers (authController, categoryController, productController)
│       ├── middleware/            # auth.ts (JWT verification)
│       ├── models/               # Mongoose schemas (User, Product, Category, Order, Review)
│       └── routes/               # Route definitions (authRoutes, categoryRoutes, productRoutes)
├── frontend/
│   └── app/
│       ├── page.tsx              # Homepage
│       ├── layout.tsx            # Root layout
│       ├── globals.css           # Global styles (Tailwind)
│       ├── lib/api.ts            # API client wrapper
│       ├── types/index.ts        # Shared frontend TypeScript types
│       ├── context/AuthContext.tsx
│       ├── components/           # Header, ProductCard, ProductListView
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── products/page.tsx
│       └── category/[slug]/      # Dynamic category pages
└── README.md
```

## Environment

- **OS:** Windows 11
- **Shell:** Git Bash (preferred for all commands). Avoid PowerShell-specific syntax.
- **IDE:** VS Code
- **Node/npm:** Accessible in Git Bash
- **MongoDB:** Local instance via mongosh
- **GitHub:** SSH auth with ed25519 keys

## Workflow Rules

### Before Starting Work
1. Confirm you are in the project root (`pfCommercePlatform/`). Check for `package.json` in both `./backend` and `./frontend`. Do NOT search aimlessly if the path is unclear — ask.
2. Read existing files before creating new ones. Check what patterns are already in place.

### During Work
3. **No rewrites.** Do not refactor or replace existing working code unless explicitly asked or required for security/type safety.
4. Follow the existing patterns already in the codebase:
   - **Routes:** See `backend/src/routes/authRoutes.ts` as the reference pattern.
   - **Controllers:** See `backend/src/controllers/authController.ts` for handler structure.
   - **Models:** See `backend/src/models/Product.ts` for Mongoose schema conventions.
   - **Frontend pages:** See `frontend/app/login/page.tsx` for page component structure.
   - **API calls:** Use the existing wrapper in `frontend/app/lib/api.ts`.
   - **Types:** Add shared frontend types to `frontend/app/types/index.ts`.
5. Use sub-tasks (TaskCreate) for multi-file work to keep changes organized.
6. When creating new backend routes, always register them in `backend/src/index.ts`.
7. When creating new frontend pages, follow the App Router convention: `app/<route>/page.tsx`.

### After Changes
8. Always run `npx tsc --noEmit` in both `./backend` and `./frontend` to verify zero TypeScript compilation errors before reporting completion.
9. If type errors exist, fix them before finishing.

## Code Standards

- **No `any` types.** Define proper interfaces and types.
- **Validation:** Validate all inputs on backend routes.
- **Error handling:** Use try/catch in controllers. Throw meaningful error messages.
- **JWT auth:** Protect routes using the existing `auth.ts` middleware. Check `backend/src/middleware/auth.ts` for the pattern.
- **Naming:** Use camelCase for variables/functions, PascalCase for components/models/interfaces.

## Git Operations

- Use **conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- Before pushing, check auth status with `git ls-remote`. If auth fails, suggest PAT setup immediately — do not retry blindly.
- Stage and show `git status` before committing. Let the user confirm the commit message.

## Tech-Specific Notes

- **Mongoose:** Project uses Mongoose v9+. Use the `Schema.method()` pattern for instance methods. Check existing models for the typing approach.
- **Next.js:** Uses App Router (not Pages Router). Client components must have `"use client"` directive at top.
- **Tailwind CSS:** Utility-first. No custom CSS files for components unless absolutely necessary.
- **API Client:** Frontend API calls go through `frontend/app/lib/api.ts`. Do not use raw `fetch()` in components — extend the existing wrapper.

## What NOT to Do

- Do not install new major dependencies without asking first.
- Do not create test files unless explicitly requested (testing setup is not configured yet).
- Do not modify `package.json` scripts without confirmation.
- Do not create Docker files, CI/CD pipelines, or deployment configs unless asked.
- Do not add bonus/optional features. Focus on core requirements only.
