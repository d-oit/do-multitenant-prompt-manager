/*
Simple script to apply recommended branch protection rules to a repository branch
Requires: GITHUB_TOKEN (with repo/admin or repo scope depending on org settings)

Usage:
  node scripts/apply-branch-protection.mjs <owner> <repo> <branch>

This script is intentionally minimal; run it locally or from a CI job with a token.
*/

// Use global fetch when available (Node 18+). If not available, instruct user to install node-fetch.
const hasGlobalFetch = typeof fetch === "function";
if (!hasGlobalFetch) {
  console.error(
    "This script requires Node 18+ (global fetch) or install node-fetch and restore the import."
  );
  process.exit(2);
}

const [, , owner, repo, branch] = process.argv;

if (!owner || !repo || !branch) {
  console.error("Usage: node scripts/apply-branch-protection.mjs <owner> <repo> <branch>");
  process.exit(2);
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Environment variable GITHUB_TOKEN is required (with appropriate permissions).");
  process.exit(2);
}

const url = `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection`;

const body = {
  required_status_checks: {
    strict: true,
    // Use job names from .github/workflows as status check contexts
    contexts: ["Lint and Test", "Security Scan", "E2E Tests"]
  },
  enforce_admins: true,
  required_pull_request_reviews: {
    dismissal_restrictions: {},
    dismiss_stale_reviews: true,
    require_code_owner_reviews: true,
    required_approving_review_count: 2
  },
  restrictions: {
    users: [],
    teams: ["admins", "maintainers"],
    apps: ["dependabot"]
  },
  allow_force_pushes: false,
  allow_deletions: false,
  required_signatures: true
};

async function apply() {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to apply branch protection:", res.status, text);
    process.exit(1);
  }

  const data = await res.json();
  console.log("Branch protection applied to", `${owner}/${repo}@${branch}`);
  console.log(JSON.stringify(data, null, 2));
}

apply().catch((err) => {
  console.error(err);
  process.exit(1);
});
