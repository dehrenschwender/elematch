# elematch

Get points by finding card sets.

[Play Now](https://elemat.ch)

[Play the OG version](https://og.elemat.ch)

## Screenshots

- <img src="./screenshots/elematch_tutorial.png" alt="tutorial">
- <img src="./screenshots/elematch_ingame.png" alt="ingame">

## Tooling

- [TypeScript](https://www.typescriptlang.org/) for the game source and tests.
- [Vite](https://vite.dev/) for bundling and the dev server.
- [Phaser 3](https://phaser.io/) game framework.
- [pnpm](https://pnpm.io/) as the package manager (enable with `corepack enable`).
- [Vitest](https://vitest.dev/) for unit tests.
- Node.js 24 LTS (see `.nvmrc`).

## Build/Run

Install dependencies
```bash
git clone git@github.com:elematch/elematch.git
cd elematch
pnpm install
```

Run the development server
```bash
pnpm dev
```

Build the project (output in `dist/`)
```bash
pnpm build
```
`pnpm build` type-checks with `tsc --noEmit` before bundling. To type-check on its own:
```bash
pnpm typecheck
```

Run the tests
```bash
pnpm test
```

## Commit convention

Commits follow the [Angular Conventional Commits](https://www.conventionalcommits.org/) convention, enforced automatically by `commitlint` (`@commitlint/config-angular`) via the Husky `commit-msg` hook (`.husky/commit-msg`). This is the same convention `semantic-release` uses to decide version bumps (see [Releases](#releases)), so well-formed messages are what drive automated releases.

- Subject line: `<type>(<scope>): <summary>`.
  - `type` is lowercase and one of: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`. (`chore` is added on top of Angular's set for maintenance commits like `chore(deps)` and the semantic-release `chore(release)` bot — keep `commitlint.config.js` and this list in sync.)
  - `summary` is lowercase, imperative mood, no trailing period; keep the whole header ≤ 72 characters.
- Use a focused scope when useful (e.g. `card`, `game`, `scene`, `ui`, `build`, `deps`); omit it only for broad repository changes.
- The hook requires dev dependencies installed (`pnpm install`); bypass only in genuine emergencies with `git commit --no-verify`.

Examples:

```text
feat(scene): add tutorial replay button
fix(card): correct set-matching for duplicate symbols
chore(deps): update phaser to 3.90
```

## Releases

Versioning is fully automated by [semantic-release](https://github.com/semantic-release/semantic-release) — there are no manual version bumps. On every push to `master`, `.github/workflows/release.yml`:

1. derives the next [SemVer](https://semver.org/) from the Conventional Commits since the last `vX.Y.Z` tag (`feat` → minor, `fix`/`perf` → patch, `!`/`BREAKING CHANGE:` → major);
2. updates `package.json` and prepends a section to `CHANGELOG.md`, then runs `pnpm build` as a gate (a broken build aborts the release before anything is tagged);
3. commits those back to `master`, tags `vX.Y.Z`, and creates the GitHub Release.

The new tag triggers `deploy-og.yml`, which deploys og.elemat.ch with the bumped version. If the GitHub Release notes and `CHANGELOG.md` ever drift, `pnpm release:sync-notes` rewrites each release body from the changelog (requires an authenticated `gh` CLI).

## Deploy (Cloudflare Workers)

The site is deployed as a static-assets Worker named `elemat-ch` (see `wrangler.jsonc`).

```bash
pnpm deploy            # builds, then runs `wrangler deploy`
```

Authenticate first with `wrangler login` if you have not already.

### Docker

Build the docker image
```bash
git clone git@github.com:elematch/elematch.git
cd elematch
docker build -t elematch .
```
Run the container
```bash
docker run -d -p 80:80 elematch
```
