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



function Send-Payload($payloadObj) {
  $json = $payloadObj | ConvertTo-Json -Depth 10
  $tmp = [System.IO.Path]::GetTempFileName() + '.json'
  [System.IO.File]::WriteAllText($tmp, $json)
  try {
    $resp = & gh api -X PUT /repos/$Owner/$Repo/branches/$Branch/protection --input "$tmp" -H "Accept: application/vnd.github+json" 2>&1
    $exit = $LASTEXITCODE
    if ($exit -ne 0) {
      return @{ success = $false; resp = $resp }
    }
    return @{ success = $true; resp = $resp }
  } finally {
    if (Test-Path $tmp) { Remove-Item $tmp -ErrorAction SilentlyContinue }
  }
}

# 1) Try minimal payload without restrictions (recommended for user repos)
$minimal = @{
  required_status_checks = @{ strict = $true; contexts = @('Lint and Test','Security Scan','E2E Tests') }
  enforce_admins = $true
  required_pull_request_reviews = @{ dismissal_restrictions = @{}; dismiss_stale_reviews = $true; require_code_owner_reviews = $true; required_approving_review_count = 1 }
  allow_force_pushes = $false
  allow_deletions = $false
}

$result = Send-Payload $minimal
if ($result.success) {
  Write-Output $result.resp
  Write-Host "Branch protection applied."
  return
}

Write-Warning "Minimal payload failed: $($result.resp)"

# 2) Fallback: try including empty restrictions (org repos)
$withRestrictions = $minimal + @{ restrictions = @{ users = @(); teams = @() } }
$result2 = Send-Payload $withRestrictions
if ($result2.success) {
  Write-Output $result2.resp
  Write-Host "Branch protection applied (with empty restrictions)."
  return
}

Write-Warning "Attempting alternate restrictions shape (empty object) as a final attempt..."

# 3) Try restrictions as empty object (no users/teams keys)
$withEmptyRestrictionsObj = $minimal + @{ restrictions = @{} }
$result3 = Send-Payload $withEmptyRestrictionsObj
if ($result3.success) {
  Write-Output $result3.resp
  Write-Host "Branch protection applied (with empty restrictions object)."
  return
}

Write-Error "Failed to apply branch protection with all attempted payload shapes. Last response:`n$result3.resp"
exit 1
