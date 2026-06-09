#!/usr/bin/env node
// Sync GitHub Release bodies from CHANGELOG.md so the two never drift.
//
// CHANGELOG.md is the single source of truth: semantic-release writes new
// version sections there on every release. This script copies each
// `# <version> (<date>)` section verbatim into the matching GitHub Release
// body, so the release notes and the changelog always hold the same data —
// including the changelog date, which is surfaced in the release body because
// GitHub does not allow backdating a release's published_at timestamp via the
// API.
//
// Usage:
//   node scripts/sync-release-notes.mjs           # update all releases
//   node scripts/sync-release-notes.mjs --dry-run # print what would change
//
// Requires the GitHub CLI (`gh`) to be authenticated for this repository.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = join(repoRoot, 'CHANGELOG.md');
const dryRun = process.argv.includes('--dry-run');

const changelog = readFileSync(changelogPath, 'utf8');

// Split on top-level "# " headings (each is one version section).
const sections = changelog
  .split(/^(?=# )/m)
  .map((s) => s.trim())
  .filter(Boolean);

const work = tmpdir() === '' ? repoRoot : mkdtempSync(join(tmpdir(), 'elematch-relnotes-'));
let updated = 0;

for (const section of sections) {
  const heading = section.split('\n', 1)[0];
  const version = heading.match(/(\d+\.\d+\.\d+)/)?.[1];
  if (!version) continue;
  const tag = `v${version}`;

  if (dryRun) {
    console.log(`[dry-run] ${tag}: ${heading}`);
    continue;
  }

  const bodyFile = join(work, `${tag}.md`);
  writeFileSync(bodyFile, `${section}\n`);
  try {
    // No --latest flag => GitHub keeps the highest semver marked "Latest".
    execFileSync('gh', ['release', 'edit', tag, '--notes-file', bodyFile], {
      cwd: repoRoot,
      stdio: 'pipe'
    });
    console.log(`updated ${tag}`);
    updated += 1;
  } catch (err) {
    const msg = err?.stderr?.toString() || err.message;
    console.warn(`skipped ${tag}: ${msg.trim()}`);
  }
}

if (!dryRun) console.log(`\nSynced ${updated} release(s) from CHANGELOG.md.`);
