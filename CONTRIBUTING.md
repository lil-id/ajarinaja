# Contributing to AjarinAja

Thank you for considering contributing to AjarinAja! 🎉 Every contribution helps make education technology more accessible.

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm (or Bun runtime)
- **Supabase** account and project — [sign up here](https://supabase.com)
- **Git** for version control

### Setup

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/classroom-companion.git
   cd classroom-companion
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Configure** environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials from your [Supabase dashboard](https://supabase.com/dashboard).

5. **Run** database migrations:
   ```bash
   npx supabase db push
   ```

6. **Start** the dev server:
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

- Use the **Issues** tab to report bugs
- Include steps to reproduce, expected behavior, and screenshots if applicable
- Mention your browser, OS, and Node.js version

### Suggesting Features

- Open an **Issue** with the `enhancement` label
- Describe the feature, its use case, and why it would benefit the project

### Submitting Code

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our code style guidelines

3. **Test** your changes:
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org):
   ```bash
   feat: add course analytics page
   fix: resolve RLS policy for student enrollments
   docs: update README with new features
   refactor: extract grading logic to hook
   ```

5. **Push** your branch and create a **Pull Request**

### Pull Request Guidelines

- Provide a clear description of what changed and why
- Include screenshots for UI changes
- Reference related issues (e.g., `Closes #42`)
- Ensure CI checks pass (lint and build)

## Branch Naming

| Prefix       | Purpose              | Example                        |
|-------------|----------------------|--------------------------------|
| `feature/`  | New features         | `feature/exam-analytics`       |
| `fix/`      | Bug fixes            | `fix/login-redirect`           |
| `docs/`     | Documentation only   | `docs/setup-guide`             |
| `refactor/` | Code improvements    | `refactor/hook-extraction`     |
| `migration/`| Database migrations  | `migration/add-badges-table`   |

## Code Style

- **TypeScript** for all source files — no `any` types unless absolutely necessary
- **ESLint** rules are enforced — run `npm run lint` before committing
- **Component-based** architecture with custom hooks for data fetching
- **shadcn/ui** components for UI — avoid custom styling when an existing component fits
- **i18n** — all user-facing strings should use translation keys

## Project Structure

See [`README.md`](./README.md) for the full project structure and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for detailed technical documentation.

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

---

Thank you for helping improve education for everyone! 💜
