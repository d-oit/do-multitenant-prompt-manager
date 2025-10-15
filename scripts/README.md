# Scripts

This folder contains helper scripts used by maintainers.

## apply-branch-protection.mjs

What it does:

- Applies a minimal branch protection policy to a specified branch using the GitHub REST API.

Usage:

```pwsh
$env:GITHUB_TOKEN = '<token with repo admin permissions>'
node scripts/apply-branch-protection.mjs <owner> <repo> <branch>
```

Permissions:

- The token must allow updating branch protection (repo:admin or repo scope; in orgs additional permissions may be needed).

Notes:

- This script is a convenience. For production use, prefer organization-level automation (GitHub org policies, Terraform, or GitHub Actions with fine-grained tokens).

## apply-branch-protection-gh.ps1

What it does:

- Uses the GitHub CLI (`gh api`) to apply branch protection to a branch using an authenticated gh session.

Usage:

```pwsh
# Ensure gh is authenticated: gh auth login
gh auth status
.\n+.
# Run the script (from repo root):
.
$Owner = 'd-oit'
$Repo = 'do-multitenant-prompt-manager'
$Branch = 'main'
pwsh .\scripts\apply-branch-protection-gh.ps1 -Owner $Owner -Repo $Repo -Branch $Branch
```

Notes:

- The authenticated `gh` user must have permission to update branch protections.
- The script uses the same recommended contexts: `Lint and Test`, `Security Scan`, `E2E Tests`. Adjust in the script if your repository's status contexts differ.
