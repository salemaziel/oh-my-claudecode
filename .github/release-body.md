# oh-my-claudecode v5.7.14: More reliable Stop hooks and leaner team handling

## Release Notes

This release fixes Stop-hook shadow resolver cleanup and removes the unwired team-dispatch implementation. Thanks to @iyoda for #4581 and to @rolldav for reporting #4575.

### Highlights

- **fix: detach shadow Jev resolver for Stop hooks** (#4580, fixes #4575; reported by @rolldav), recording loop-continuation and learner-extraction shadow entries and cleaning up `/tmp` request files.
- **chore(hooks): remove the unwired team-dispatch hook and generated outputs** (#4581, supersedes #4566; @iyoda)

### Bug Fixes

- **fix: detach shadow Jev resolver for Stop hooks** (#4580, fixes #4575; reported by @rolldav), recording loop-continuation and learner-extraction shadow entries and cleaning up `/tmp` request files.

### Other Changes

- **chore(hooks): remove the unwired team-dispatch hook and generated outputs** (#4581, supersedes #4566; @iyoda)
- **ci: authorize generated artifacts for the team-dispatch removal** (#4577, #4582, #4587)
- **chore(sync): merge the v5.7.13 main release into dev** (#4590)
- **ci: authorize generated artifacts for the v5.7.13 main-to-dev sync** (#4591)

### Stats

- **7 merged PRs** | **1 bug fix** | **6 other changes**

### Install / Update

The npm CLI and the Claude Code marketplace/plugin are separate install tracks, not either/or replacements. Update whichever track you use; if you have both installed, update both. CLI-dependent skill paths such as `ask` and CLI-backed `team` require the `omc` CLI from the npm package.

**CLI / runtime:**

```bash
npm install -g oh-my-claude-sisyphus@5.7.14
```

**Claude Code plugin:**

```text
/plugin marketplace update omc
```

**Full Changelog**: https://github.com/Yeachan-Heo/oh-my-claudecode/compare/v5.7.13...v5.7.14

## Contributors

Thank you to all contributors who made this release possible!

@rolldav @iyoda @Yeachan-Heo
