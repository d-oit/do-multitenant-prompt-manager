# Branching and Branch Protection Rules

This repository follows best-practice branch rulesets to keep the `main` branch stable and make collaboration predictable.

## Branch model

- `main` - protected, always deployable. Only merge PRs into this branch.
- `develop` (optional) - integration branch for the next release. If you prefer trunk-based development, skip `develop`.
- `feature/*` - new features. Example: `feature/add-login`.
- `fix/*` - bug fixes. Example: `fix/typo-readme`.
- `chore/*` - non-functional changes. Example: `chore/update-deps`.
- `hotfix/*` - urgent fixes to `main`.

## Naming conventions

- Use lowercase and hyphens.
- Include a short issue id if available: `feature/DM-123-add-settings`.

## Recommended branch protection for `main`

- Require pull requests for all changes (no direct pushes).
- Require 1-2 approving reviews before merge (adjust for your team size).
- Require branch to be up-to-date with base branch before merging (or use merge queue).
- Require status checks to pass (CI, linters, tests). At minimum: `build`, `test`.
- Require signed commits (optional, recommended for security-conscious orgs).
- Restrict who can push to the branch to repository admins and automation (release bots).
- Enable required review from CODEOWNERS.

## Ruleset examples

- Small team: 1 required review, CI checks, maintainers can merge.
- Large org: 2 required reviews, require CODEOWNERS approval for sensitive directories, require security scans.

## Pull request workflow

1. Create a topic branch from `main`.
2. Push branch and open a pull request to `main`.
3. Ensure CI passes and add reviewers.
4. Update the PR title/body to reference issues and include a short description.
5. After approvals and green CI, merge via `squash` or `merge` according to repo policy.

## Enforcing rules via GitHub

You can enforce these rules using GitHub Branch Protection and `CODEOWNERS`. For automation, a small script is included under `scripts/` to apply recommended branch protection rules using the GitHub REST API.

## Updating these rules

If you want to change these rules, update this file and the `.github` config files, and coordinate with repository admins to apply branch-protection settings in the repository settings or via the included script.
