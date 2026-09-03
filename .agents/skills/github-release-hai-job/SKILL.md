---
name: github-release-hai-job
description: Prepare and publish a GitHub Release for the standalone Hai Job repository when the user explicitly requests a Hai Job GitHub release.
---

# Hai Job GitHub Release

Use this workflow only in the standalone Hai Job repository and only after an explicit release request.

## Preparation

1. Inspect `git status`, `git remote -v`, the current branch/HEAD, existing `hai-job-v*` tags, `manifest.json`, `CHANGELOG.md`, and `.github/workflows/hai-job-release.yml`.
2. Confirm the release version with the user when it is not explicit. Keep `manifest.json`, CHANGELOG, tag, archive name, and release title consistent.
3. Review changes since the latest applicable release tag. Do not push historical tags whose workflows use the former `hai_job/` subdirectory layout.
4. Update the version and prepend concise English release notes to `CHANGELOG.md` under its introduction.
5. Run `./build_extension.ps1` and verify the expected `dist/hai_job_vX.X.X.zip` artifact. Perform relevant extension tests, including manual Chrome validation when required by the release plan.

## Approval boundary

Show the proposed version, CHANGELOG entry, relevant diff, test results, and Git actions. Stop for explicit approval before committing, pushing, creating a tag, or creating a GitHub Release unless the user's request already clearly authorizes those exact actions.

## Publication

After approval:

1. Commit only the intended release files with an English Conventional Commit message.
2. Push the intended branch to `origin`.
3. Create a lightweight `hai-job-vX.X.X` tag at the verified release commit.
4. Push only that exact tag. The tag triggers `.github/workflows/hai-job-release.yml`.
5. Verify the GitHub Actions run and resulting release; report failures without silently rewriting tags or history.

Do not use annotated tags unless the user changes the release policy. Never publish other local tags incidentally.
