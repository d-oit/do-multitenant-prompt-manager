# Deprecation Notices

## Security Considerations

### DOMPurify Version Lock

There is a known moderate severity vulnerability in dompurify <3.2.4 (CVE reference: GHSA-vhxf-7vqr-mrjg).
While we have attempted to override this with a newer version, monaco-editor appears to have a fixed dependency on dompurify 3.1.7.
This needs to be monitored and updated when monaco-editor releases a version that includes the patched dompurify.

Risk mitigation:

- The vulnerability requires local access and high complexity to exploit
- Our usage of monaco-editor is in a controlled context
- We should update as soon as monaco-editor updates their dompurify dependency

## NPM Package Deprecations

The following packages are marked as deprecated and should be upgraded in future maintenance:

1. `inflight@1.0.6` - Leaks memory, replace with `lru-cache` for request coalescing
2. `@humanwhocodes/config-array` - Replace with `@eslint/config-array`
3. `rimraf@3.x` - Upgrade to rimraf v4 or higher
4. `glob@7.x` - Upgrade to glob v9 or higher
5. `@humanwhocodes/object-schema` - Replace with `@eslint/object-schema`
6. `eslint@8.57.1` - This version is EOL, see https://eslint.org/version-support for current options

## Husky Install Command

The `husky install` command used in npm scripts is marked as deprecated. Current usage:

```json
{
  "scripts": {
    "prepare": "husky install .husky"
  }
}
```

When updating husky in the future, check for the latest recommended installation method.
