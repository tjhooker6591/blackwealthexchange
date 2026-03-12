# Sponsor Asset Gaps — 2026-03-12

Purpose: close remaining house sponsor placeholder usage safely without breaking sponsored rendering.

## Current status
- Safe seed script executed with `.env.local` loaded.
- DB target: `bwes-cluster` (`featured_sponsor_schedule.creativeUrl` updated from file-verified mapping).
- Placeholder fallback (`/images/house-draft.jpg`) still required for 5 sponsors due missing sponsor-specific assets.

## Sponsors still using fallback
1. Thomas Hooker Author
2. Thomas Hooker Publisher
3. The Last Nephilim
4. Millianious
5. Tiana Song Sprouts

## Sponsors already mapped to real assets
- Pamfa United Citizen → `/ads/pamfa-united-ad.jpg`
- TitanEra → `/ads/titanera-banner.jpg`
- Guardians of the Forgotten Realm → `/Guardians.jpg`

## Recommended asset drop-in contract
Add image files under `public/images/` with these preferred names:
- `/images/thomashookerauthor.webp`
- `/images/thomashookerpublisher.webp`
- `/images/thelastnephilim.webp`
- `/images/millianious.webp`
- `/images/tianasongsprouts.webp`

After adding files:
1. Run: `set -a && source .env.local && set +a && node scripts/seed-house-sponsors-safe.mjs`
2. Verify no `usedFallback: true` entries in script output.
3. Spot check sponsored surfaces for image rendering.
