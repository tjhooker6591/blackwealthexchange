# BLACK NEXT SESSION START HERE

## Read this first (order)

1. `docs/BLACK_DETAILED_CONTINUITY_MASTER.md`
2. `docs/BLACK_OPEN_DEFECTS_AND_CLOSURE_QUEUE.md`
3. `docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md`

## Canonical repo

- `/Users/blackforge/workspace/bwe/repos/repo_clean`
- Branch at last audit: `release/friday-clean`
- Working tree was dirty at audit time.
- Audit-pack commit to anchor continuity: `b0646a9`

## What is already proven (from this audit)

- Architecture map and critical flow routes are documented.
- Canonical webhook path and major collection dependencies identified.
- Main launch confidence risks are clear (proof gaps > unknown unknowns).

## What is still open

- End-to-end paid fulfillment proofs across core funnels.
- Cross-machine runtime parity evidence.
- Auth/session + env consistency proof under real run conditions.

## First 3 actions to resume immediately

1. **Freeze baseline:** capture current git diff and decide whether to stash/split pre-existing edits.
2. **Run canonical paid proof #1 (marketplace):** checkout -> webhook -> DB fulfillment -> UI final state, capture IDs.
3. **Run canonical paid proof #2 (directory/ad):** checkout -> webhook -> listing/ad state -> sponsor visibility, capture IDs.

## Guardrail

- Do not claim closure without explicit event/session/DB evidence.
