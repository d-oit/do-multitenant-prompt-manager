param(
  [Parameter(Mandatory=$true)] [string]$Owner,
  [Parameter(Mandatory=$true)] [string]$Repo,
  [Parameter(Mandatory=$true)] [string]$Branch
)

# This script uses the GitHub CLI (`gh`) to apply branch protection via the REST API.
# Requirements:
# - gh CLI installed and authenticated (gh auth status)
# - You must have permission to update branch protections (repo:admin or equivalent)

Write-Host "Applying branch protection to $Owner/$Repo@$Branch using gh..."

$body = @{
  required_status_checks = @{ strict = $true; contexts = @('Lint and Test','Security Scan','E2E Tests') }
  enforce_admins = $true
  required_pull_request_reviews = @{ dismissal_restrictions = @{}; dismiss_stale_reviews = $true; require_code_owner_reviews = $true; required_approving_review_count = 1 }
  restrictions = $null
  allow_force_pushes = $false
  allow_deletions = $false
} | ConvertTo-Json -Depth 10

$url = "repos/$Owner/$Repo/branches/$Branch/protection"

try {
  $resp = gh api -X PUT /$url -F body="$body" -H "Accept: application/vnd.github+json"
  Write-Output $resp
  Write-Host "Branch protection applied."
} catch {
  Write-Error "Failed to apply branch protection: $_"
  exit 1
}
