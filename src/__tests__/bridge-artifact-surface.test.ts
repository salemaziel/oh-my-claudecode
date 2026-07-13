import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const COORDINATOR = join('bridge', 'claude-md-coordinator.cjs');
const CANONICAL_CLAUDE_MD = join(REPO_ROOT, 'docs', 'CLAUDE.md');

function trackedFiles(dir: string): string[] {
  const result = spawnSync('git', ['ls-files', dir], { cwd: REPO_ROOT, encoding: 'utf-8' });
  if (result.status !== 0) throw new Error(`git ls-files ${dir} failed: ${result.stderr}`);
  return result.stdout.split('\n').filter(Boolean);
}

// Build output git can't see: plain-untracked, or swallowed by a .gitignore rule.
// Both ship broken, because plugin installs clone the repo as-is. `--others` alone
// lists only non-ignored untracked files, so the ignored set needs its own pass.
function untrackedOrIgnored(dir: string): string[] {
  const listOthers = (extraArgs: string[]): string[] => {
    const result = spawnSync('git', ['ls-files', '--others', ...extraArgs, dir], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    });
    if (result.status !== 0) throw new Error(`git ls-files ${dir} failed: ${result.stderr}`);
    return result.stdout.split('\n').filter(Boolean);
  };

  const untracked = listOthers(['--exclude-standard']);
  const ignored = listOthers(['--ignored', '--exclude-standard']);
  return [...new Set([...untracked, ...ignored])]
    .filter(path => !path.includes('__pycache__'))
    .sort();
}

// These assert on the *committed* bundle, never a freshly built one. Claude Code
// plugin installs git-clone this repo and never run a build, so an untracked or
// stale bundle ships broken even when every behavioural test passes.
describe('bridge build artifacts are committed and current', () => {
  it('tracks the claude-md coordinator that setup-claude-md.sh requires', () => {
    expect(trackedFiles('bridge')).toContain('bridge/claude-md-coordinator.cjs');
  });

  it('tracks every bridge bundle, so a newly added one cannot be silently ignored', () => {
    expect(trackedFiles('bridge').length).toBeGreaterThan(0);
    expect(untrackedOrIgnored('bridge')).toEqual([]);
  });

  // dist/index.js requires modules like dist/cli/commands/capabilities.js. If a newly
  // compiled module is left untracked, the clone ships an entrypoint whose require()
  // target does not exist.
  it('tracks every compiled dist module, so the plugin clone can resolve them', () => {
    expect(trackedFiles('dist').length).toBeGreaterThan(0);
    expect(untrackedOrIgnored('dist')).toEqual([]);
  });

  it('keeps the committed coordinator handshake in sync with docs/CLAUDE.md', () => {
    const handshake = spawnSync('node', [COORDINATOR, '--handshake'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    });
    expect(handshake.status).toBe(0);

    const { sourceSha256, engineVersion } = JSON.parse(handshake.stdout) as {
      sourceSha256: string;
      engineVersion: string;
    };

    // setup-claude-md.sh re-hashes docs/CLAUDE.md and fails closed on mismatch, so a
    // stale committed bundle breaks setup for every plugin user. Rebuild with
    // `npm run build:claude-md-coordinator` and commit the result.
    const canonical = createHash('sha256').update(readFileSync(CANONICAL_CLAUDE_MD)).digest('hex');
    expect(sourceSha256).toBe(canonical);

    const { version } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf-8')) as {
      version: string;
    };
    expect(engineVersion).toBe(version);
  });
});
