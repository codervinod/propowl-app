# PropOwl - Claude Code Instructions

## Git Workflow (CRITICAL)

### Branch Structure
```
main (production) ← staging ← feature branches
     │                 │
     │                 └── staging.propowl.ai
     └── propowl.ai
```

### Rules - MUST FOLLOW

1. **NEVER push directly to `main` or `staging`**
   - All changes go through feature branches and PRs
   - No exceptions

2. **Feature Branch Workflow**
   ```bash
   # Start from staging
   git checkout staging
   git pull origin staging

   # Create feature branch
   git checkout -b feature/GH-<issue>-<description>

   # Make changes, commit with issue prefix
   git commit -m "[GH-<issue>] Description of change"

   # Push and create PR targeting staging
   git push -u origin feature/GH-<issue>-<description>
   gh pr create --base staging
   ```

3. **PR Flow**
   - Feature branches → PR to `staging`
   - `staging` → PR to `main` (for production releases)

4. **Commit Message Format**
   ```
   [GH-<issue>] Short description

   Optional longer description
   ```

5. **Before Merging Any PR**
   - CI must pass (lint, type-check, build, test)
   - Review the changes

### Production Releases

To release staging to production:
```bash
gh pr create --base main --head staging --title "Release: $(date +%Y-%m-%d)"
```

Only merge after:
- Nightly E2E tests have passed on staging
- Manual verification on staging.propowl.ai

## Environment URLs

| Environment | URL | Branch | Database |
|-------------|-----|--------|----------|
| Production | propowl.ai | `main` | propowl-db (main) |
| Staging | staging.propowl.ai | `staging` | propowl-db-staging |

## Development Commands

```bash
# Development
npm run dev          # Start dev server

# Testing
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run test:smoke   # Smoke tests only

# Code Quality
npm run lint         # ESLint
npm run type-check   # TypeScript check

# Database
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## Project Structure

```
src/
├── app/             # Next.js App Router pages
├── auth/            # NextAuth configuration
├── components/ui/   # shadcn/ui components
├── db/              # Drizzle ORM schema and connection
└── lib/             # Utilities

e2e/                 # Playwright E2E tests
```

## Key Files

- `src/db/schema.ts` - Database schema (properties, transactions, etc.)
- `src/auth/index.ts` - Authentication configuration
- `.github/workflows/ci.yml` - CI pipeline
- `.github/workflows/nightly-release.yml` - Nightly E2E + release PR
- `.github/workflows/smoke-test.yml` - Post-deploy smoke tests
