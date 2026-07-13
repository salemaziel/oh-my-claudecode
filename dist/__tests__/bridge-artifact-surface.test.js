import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const REPO_ROOT = join(__dirname, '..', '..');
const COORDINATOR = join('bridge', 'claude-md-coordinator.cjs');
const CANONICAL_CLAUDE_MD = join(REPO_ROOT, 'docs', 'CLAUDE.md');
function trackedFiles(dir) {
    const result = spawnSync('git', ['ls-files', dir], { cwd: REPO_ROOT, encoding: 'utf-8' });
    if (result.status !== 0)
        throw new Error(`git ls-files ${dir} failed: ${result.stderr}`);
    return result.stdout.split('\n').filter(Boolean);
}
// These assert on the *committed* bundle, never a freshly built one. Claude Code
// plugin installs git-clone this repo and never run a build, so an untracked or
// stale bundle ships broken even when every behavioural test passes.
describe('bridge build artifacts are committed and current', () => {
    it('tracks the claude-md coordinator that setup-claude-md.sh requires', () => {
        expect(trackedFiles('bridge')).toContain('bridge/claude-md-coordinator.cjs');
    });
    it('tracks every bridge bundle, so a newly added one cannot be silently ignored', () => {
        const tracked = trackedFiles('bridge');
        const shipped = spawnSync('git', ['status', '--short', '--', 'bridge'], {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
        });
        expect(shipped.status).toBe(0);
        // An untracked bundle in bridge/ means .gitignore swallowed it again.
        const untrackedBundles = shipped.stdout
            .split('\n')
            .filter(line => line.startsWith('??'))
            .map(line => line.slice(3).trim())
            .filter(path => /\.(cjs|js|sh|py)$/.test(path));
        expect(untrackedBundles).toEqual([]);
        expect(tracked.length).toBeGreaterThan(0);
    });
    it('keeps the committed coordinator handshake in sync with docs/CLAUDE.md', () => {
        const handshake = spawnSync('node', [COORDINATOR, '--handshake'], {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
        });
        expect(handshake.status).toBe(0);
        const { sourceSha256, engineVersion } = JSON.parse(handshake.stdout);
        // setup-claude-md.sh re-hashes docs/CLAUDE.md and fails closed on mismatch, so a
        // stale committed bundle breaks setup for every plugin user. Rebuild with
        // `npm run build:claude-md-coordinator` and commit the result.
        const canonical = createHash('sha256').update(readFileSync(CANONICAL_CLAUDE_MD)).digest('hex');
        expect(sourceSha256).toBe(canonical);
        const { version } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf-8'));
        expect(engineVersion).toBe(version);
    });
});
//# sourceMappingURL=bridge-artifact-surface.test.js.map