# Contributing to MyMemoryCard

Thank you for considering contributing to MyMemoryCard! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Linear Git History](#linear-git-history)
- [Pull Request Process](#pull-request-process)
- [Releases](#releases)

## Code of Conduct

Be respectful, constructive, and professional in all interactions. This project aims to be welcoming to contributors of all skill levels.

## Getting Started

### Prerequisites

- **Bun** 1.x or later ([install guide](https://bun.sh))
- **Node.js** 20+ for frontend development
- **Docker** and Docker Compose
- **Git** for version control

### Setup Development Environment

1. Fork the repository on GitHub

2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/MyMemoryCard.git
cd mymemorycard
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/dalssaso/MyMemoryCard.git
```

4. Install dependencies:

```bash
# Backend
cd backend
bun install

# Frontend
cd ../frontend
npm install
```

5. Start development services:

```bash
# Terminal 1 - Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Terminal 2 - Start backend
cd backend
bun run dev

# Terminal 3 - Start frontend
cd frontend
npm run dev
```

6. Install pre-commit hooks:

```bash
# From project root
npm install -g husky
npm install -g lint-staged
```

## Development Workflow

1. **Create a feature branch:**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** following the code style guidelines

3. **Write tests** for new functionality (minimum 90% coverage)

4. **Run tests locally:**

```bash
# Backend tests
cd backend
bun test

# Frontend tests
cd frontend
npm test
```

5. **Check types:**

```bash
# Backend
cd backend
bun run typecheck

# Frontend
cd frontend
npm run typecheck
```

6. **Commit your changes** (pre-commit hooks will run automatically)

7. **Rebase on latest main before pushing:**

```bash
git fetch upstream
git rebase upstream/main
```

8. **Push to your fork:**

```bash
git push origin feature/your-feature-name
# If you rebased, you may need:
git push --force-with-lease origin feature/your-feature-name
```

9. **Open a Pull Request** on GitHub

## Code Style Guidelines

### General Rules

1. **NO EMOJIS** in code, logs, console output, or error messages
   - ❌ `console.log('✅ Success')`
   - ✅ `console.log('Success')`
   - Emojis are ONLY allowed in UI text where appropriate

2. **TypeScript Strict Mode** - All code must pass strict type checking
   - No `any` types without explicit justification
   - Prefer interfaces over types for object shapes
   - Use proper type imports

3. **Code Formatting**
   - Prettier is configured - run `npm run format` or let pre-commit hooks handle it
   - 2 spaces for indentation
   - Single quotes for strings
   - Semicolons required
   - Trailing commas in multi-line structures

### Backend (Bun/TypeScript)

```typescript
// Good
export async function getGame(id: string): Promise<Game> {
  const result = await db.query("SELECT * FROM games WHERE id = $1", [id]);
  if (!result.rows[0]) {
    throw new Error("Game not found");
  }
  return result.rows[0];
}

// Bad
export async function getGame(id: any) {
  const result = await db.query("SELECT * FROM games WHERE id = $1", [id]);
  console.log("✅ Game found!"); // No emojis!
  return result.rows[0];
}
```

### Frontend (React/TypeScript)

```typescript
// Good
interface GameCardProps {
  game: Game;
  onUpdate: (game: Game) => void;
}

export function GameCard({ game, onUpdate }: GameCardProps) {
  return <div>{game.name}</div>;
}

// Bad
export function GameCard({ game, onUpdate }: any) {
  return <div>{game.name}</div>;
}
```

### Database Queries

- Use parameterized queries (prevent SQL injection)
- Keep queries in service layer, not route handlers
- Use transactions for multi-statement operations
- Add appropriate indexes for query performance

### Error Handling

```typescript
// Good
try {
  const game = await gameService.getGame(id);
  return Response.json(game);
} catch (error) {
  console.error("Failed to fetch game:", error);
  return Response.json({ error: "Failed to fetch game" }, { status: 500 });
}

// Bad
try {
  const game = await gameService.getGame(id);
  return Response.json(game);
} catch (error) {
  console.log("❌ Error!"); // No emojis!
  return Response.json({ error }); // Don't leak error details
}
```

## Testing Requirements

### Minimum Coverage

All new code must maintain **90% or higher** test coverage.

### Backend Testing (Bun Test)

```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("Game Routes", () => {
  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup
  });

  it("should return game by id", async () => {
    const response = await fetch("http://localhost:3000/api/games/1");
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("id");
  });
});
```

### Frontend Testing (Vitest + React Testing Library)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameCard } from './GameCard';

describe('GameCard', () => {
  it('renders game name', () => {
    const game = { id: '1', name: 'Test Game' };
    render(<GameCard game={game} onUpdate={() => {}} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });
});
```

### Testing Guidelines

- Write tests BEFORE implementing features (TDD encouraged)
- Test edge cases and error conditions
- Mock external API calls (RAWG, etc.)
- Use database transactions in tests (rollback after each test)
- Keep tests fast and isolated

### Running Tests

```bash
# Run all backend tests
cd backend
bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch

# Run all frontend tests
cd frontend
npm test

# With coverage
npm run test:coverage

# UI mode
npm run test:ui
```

## Commit Guidelines

### Commit Message Format

```
type: short description

Longer description if needed (optional)
```

### Types

- `feat` - New feature (triggers minor version bump)
- `fix` - Bug fix (triggers patch version bump)
- `feat!` or `fix!` - Breaking change (triggers major version bump)
- `refactor` - Code refactoring (no behavior change)
- `test` - Adding or updating tests
- `docs` - Documentation changes
- `chore` - Maintenance tasks (dependencies, config)
- `perf` - Performance improvements
- `style` - Code style changes (formatting, no logic change)

### Examples

```bash
# Good
git commit -m "feat: add favorites filter to library page"
git commit -m "fix: resolve race condition in game import"
git commit -m "feat!: change API response format for games endpoint"
git commit -m "test: add coverage for custom fields endpoint"

# Bad
git commit -m "feat: Add new feature"  # No emojis
git commit -m "fixed stuff"            # Too vague
git commit -m "WIP"                    # Don't commit WIP
```

### Multiple Changes in One Commit

When your PR contains multiple distinct changes, use commit footers to generate separate changelog entries:

```
feat: add v2 game import API

This adds support for the new import format.

fix(import): handle missing cover images gracefully
  PiperOrigin-RevId: 123456

feat(export): add CSV export option
  BREAKING-CHANGE: JSON export format changed
```

The additional messages must be at the bottom of the commit message. Each generates a separate changelog entry.

### Rules

- NO emojis in commit messages
- Use present tense ("add" not "added")
- Keep first line under 72 characters
- Reference issue numbers when applicable: `fix: resolve #123`
- Don't commit directly to `main` - use feature branches
- Use `!` suffix for breaking changes: `feat!:`, `fix!:`, `refactor!:`

## Linear Git History

This project maintains a **linear git history** using **squash-merge**. This is required for [release-please](https://github.com/googleapis/release-please) to work correctly and provides several benefits.

### Why Linear History with Squash-Merge?

1. **Release-please compatibility** - Commits are analyzed in merge order; squash-merge ensures clean changelog generation
2. **Easier to read** - `git log --oneline` shows a clear, chronological story of changes
3. **Simpler bisecting** - `git bisect` works reliably since commits aren't mixed between PRs
4. **Clean reverts** - Reverting changes is straightforward with no merge commit complications
5. **No broken states on main** - Every commit on main represents a complete, tested PR
6. **Intermediate fixes don't clutter history** - Bug fixes for issues introduced within the same PR are squashed away (they never reached production)

### How to Maintain Linear History

#### Always Rebase Before Opening a PR

```bash
# Fetch latest changes from upstream
git fetch upstream

# Rebase your branch on top of main
git rebase upstream/main

# If you have conflicts, resolve them and continue
git rebase --continue

# Force push to update your fork (safe for feature branches)
git push --force-with-lease origin feature/your-feature
```

#### Squash Commits When Appropriate

Keep commits atomic and meaningful. Since PRs are squash-merged, focus on writing a good PR title and description - these become the final commit message.

For local cleanup before opening a PR:

```bash
# Interactive rebase to squash last N commits
git rebase -i HEAD~N

# In the editor, change 'pick' to 'squash' (or 's') for commits to combine
# Keep the first commit as 'pick'
```

**Note:** Individual commits within a PR don't need to be perfect since they'll be squashed. However, the PR title must follow conventional commit format (`feat:`, `fix:`, etc.) as it becomes the squashed commit message.

#### Keep Feature Branches Short-Lived

- Merge PRs promptly to avoid large rebases
- Break large features into smaller, incremental PRs
- Sync with main frequently during long-running work

### Common Rebase Scenarios

#### Updating Your Branch with Latest Main

```bash
git fetch upstream
git rebase upstream/main
# Resolve any conflicts
git push --force-with-lease origin feature/your-feature
```

#### Fixing a Commit Message

```bash
# For the most recent commit
git commit --amend -m "fix: correct commit message"

# For older commits
git rebase -i HEAD~N
# Change 'pick' to 'reword' for the commit to fix
```

#### Removing a Commit from History

```bash
git rebase -i HEAD~N
# Delete the line with the commit to remove (or change to 'drop')
```

### Important Notes

- **Never rebase shared branches** (like `main`)
- **Use `--force-with-lease`** instead of `--force` for safety
- **Communicate with collaborators** if you need to force-push a shared branch

## Pull Request Process

### Before Opening a PR

- [ ] Branch is rebased on latest `main` (no merge commits)
- [ ] Commits are squashed into logical units
- [ ] All tests pass locally
- [ ] Code coverage is 90% or higher
- [ ] TypeScript type checking passes
- [ ] Pre-commit hooks pass
- [ ] Code is formatted with Prettier
- [ ] Commit messages follow guidelines
- [ ] Documentation is updated (if needed)

### PR Description Template

```markdown
## Description

Brief description of what this PR does

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe how you tested your changes

## Checklist

- [ ] Tests added/updated
- [ ] Code coverage >= 90%
- [ ] TypeScript strict mode passes
- [ ] Documentation updated
- [ ] No emojis in code/logs
```

### Review Process

1. Automated CI checks must pass (tests, linting, type checking)
2. At least one maintainer approval required
3. Address all review comments
4. Keep PR scope focused - one feature/fix per PR
5. Rebase on main if your branch is behind (maintainers will request this)
6. PRs are merged using **squash and merge** (preferred) to maintain linear history and clean changelogs

### After PR is Merged

1. Delete your feature branch
2. Pull latest main: `git pull upstream main`
3. Update your fork: `git push origin main`

## Development Tips

### Database Migrations (Drizzle ORM)

We use Drizzle ORM for database schema management. Migrations run automatically on backend startup.

When adding database changes:

1. Update the schema in `backend/src/db/schema.ts`
2. Generate a new migration: `make db-generate`
3. Review the generated SQL in `backend/drizzle/`
4. Test the migration by restarting the backend
5. Include migration details in PR description

```bash
# Generate migration from schema changes
make db-generate

# Push schema directly during development (no migration file)
make db-push

# Open Drizzle Studio to browse data
make db-studio
```

### Adding New Dependencies

- Backend: `cd backend && bun add package-name`
- Frontend: `cd frontend && npm install package-name`
- Always commit lock files (`bun.lock`, `package-lock.json`)
- Justify new dependencies in PR description

### Performance Considerations

- Keep bundle sizes small (check with `npm run build`)
- Use code splitting for large dependencies
- Optimize database queries (use EXPLAIN ANALYZE)
- Cache expensive operations in Redis
- Lazy load components when appropriate

### Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs
- Use parameterized SQL queries
- Sanitize user-generated content
- Keep dependencies up to date

## Releases

This project uses [release-please](https://github.com/googleapis/release-please) for automated releases.

### How It Works

1. **Conventional commits** trigger releases automatically
   - `feat:` commits create minor releases (1.1.0 -> 1.2.0)
   - `fix:` commits create patch releases (1.1.0 -> 1.1.1)
   - `feat!:` or `BREAKING CHANGE:` create major releases

2. **Release-please** creates a combined release PR when changes are merged to `main`
   - Updates version in `package.json`
   - Generates `CHANGELOG.md`
   - Updates version references in documentation and docker-compose files

3. **Docker images** are automatically built and published to GitHub Container Registry

### Pre-releases

For testing before official release, use the **Manual Pre-Release Build** workflow in GitHub Actions.

See [docs/release-process.md](docs/release-process.md) for complete documentation.

## Getting Help

- Check existing issues and discussions
- Read the documentation in `/docs`
- Review existing code for patterns
- Ask questions in GitHub discussions
- Be specific about your environment and error messages

## Recognition

Contributors will be recognized in:

- GitHub contributors page
- Release notes (for significant contributions)
- Project documentation (for major features)

Thank you for contributing to MyMemoryCard!
