# Security Policy

Thank you for taking the time to responsibly disclose security issues. This project is a small, public, personal project and does not publish an email address for vulnerability reports. Please follow the guidance below so we can address issues fast and safely.

---

## Supported Versions

| Version | Supported |
| ------: | :-------: |
|  `main` |    Yes    |

If a release is no longer listed above it means it is no longer supported and may not receive security fixes.

---

## How to Report a Vulnerability (no email required)

Preferred reporting channels (in order):

1. **GitHub Security Advisories (recommended)**
   - Open the repository on GitHub, click the **Security** tab, then **Advisories** and create a new private advisory.
   - This allows private discussion and coordinated disclosure without sharing details publicly.

2. **GitHub Issue with encrypted details**
   - If you cannot use Security Advisories, open a new **issue** and start the title with `[SECURITY]`. Do **not** include exploit code or sensitive PoC details in the public issue.
   - Attach an encrypted file or encrypted text block containing sensitive details (see "Encrypting sensitive details" below).

3. **Create a private gist (encrypted)** and paste a short, high-level summary in a public GitHub issue linking to the private gist. Use the encryption method described below for the gist content.

> If you discover a vulnerability that could be exploited in the wild, **do not publish details publicly**. Use one of the private channels above so we can confirm and fix it before public disclosure.

---

## What to Include in Your Report

Please provide as much of the following as you can, while avoiding public disclosure of exploit code:

- **Short summary** of the issue (1–2 sentences).
- **Impact** (what an attacker could do).
- **Affected versions** (branch/commit/tag).
- **Reproduction steps** (high-level). If sensitive, provide an encrypted PoC instead of posting it publicly.
- **Configuration / environment** (OS, runtime, third-party libs and versions).
- **Suggested fix** (optional).
- **Your PGP/GPG key fingerprint** (optional) for secure follow-up.

---

## Encrypting sensitive details

If you need to share PoC code, logs, or other sensitive information but want to avoid public disclosure, encrypt it with a PGP/GPG key before sending. Example usage:

```bash
# Encrypt a file for the project maintainer
gpg --encrypt --recipient "<YOUR-REPO-USERNAME>" --armor poc.txt > poc.txt.asc
```

If the repository owner publishes a PGP public key in this repo, use that key. If no key is present, please open a Security Advisory or create an issue with a minimal non-sensitive summary and request a private channel.

---

## Response Timeline

I maintain this project personally. I will do my best to acknowledge valid reports within **7 days** and provide status updates. Critical issues may be handled faster but please be patient.

If you need a faster acknowledgement, use the GitHub Security Advisory flow.

---

## Coordinated Disclosure

Please allow a reasonable time for a fix to be prepared before publicly disclosing a vulnerability. If a fix is not provided within the timeframe you believe reasonable, you may publish details, but a short responsible disclosure period of **90 days** is requested whenever practical.

---

## Acknowledgements

Thank you for responsibly reporting security issues. Together we can keep this project safe.
