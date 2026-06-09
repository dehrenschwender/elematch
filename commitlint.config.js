// Commit message linting — enforces the Angular commit convention, the same
// convention semantic-release's commit-analyzer uses to decide version bumps
// (feat -> minor, fix/perf -> patch, `!`/`BREAKING CHANGE:` -> major).
//
// Run automatically on every commit via the Husky `commit-msg` hook.
// See README.md -> "Commit convention".
export default {
  extends: ['@commitlint/config-angular'],
  rules: {
    // Angular's type set plus `chore`, which the repo uses for maintenance
    // commits (`chore(deps): …`) and which the semantic-release bot emits as
    // `chore(release): …`. Keep this list in sync with README.md.
    'type-enum': [
      2,
      'always',
      ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']
    ]
  }
};
