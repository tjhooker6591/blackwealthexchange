# Security Notes

## CVE-2026-23745 (tar)
- GitHub alert observed for `tar` (node-tar): Arbitrary file overwrite / symlink poisoning via insufficient path sanitization.
- Current dependency state: `npm audit` reports 0 vulnerabilities (as of this check).
- `tar` is only present as a transitive dependency (build/install tooling), not used at runtime by the application.
- The application does not extract user-supplied tar/tgz archives.
- Risk assessment: Non-exploitable in current architecture.
- Action: Monitor for upstream advisories/patches; no changes required unless `npm audit` begins flagging an issue.
