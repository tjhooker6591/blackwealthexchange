# BWE Black History Content Architecture

Date: 2026-08-30
Workstream: POST-BASELINE WORKSTREAM 002

Purpose:

- Preserve the existing `library-of-black-history` page as the foundation
- Expand through stand-alone historical blocks that are substantive enough to ship independently
- Distinguish established fact, scholarly interpretation, tradition/theology, and disputed claims

## Program architecture

| Block | Title                                                                                             | Current Status           | Notes                                                                    |
| ----- | ------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| 1     | Current library inventory, research/source ledger, gap matrix, content architecture               | ACTIVE FOUNDATION        | Completed in this pass as docs plus live-page framing                    |
| 2     | Humanity's African Beginning / Africa Before Captivity / African Sacred Worlds / Yoruba Worldview | ACTIVE RUNTIME EXPANSION | First substantive public expansion in this pass                          |
| 3     | Egypt / Kemet / Nile Valley / Nubia / Kush                                                        | NEXT                     | Must be evidence-heavy and complexity-forward                            |
| 4     | Government / kings / queens / knowledge / writing / science / education                           | QUEUED                   | Build after Nile Valley foundation exists                                |
| 5     | West African civilizations / Ghana / Mali / Songhai / Timbuktu                                    | QUEUED                   | Include trade, scholarship, and statecraft                               |
| 6     | East Africa / Aksum / Ethiopia / Swahili world                                                    | QUEUED                   | Link Red Sea and Indian Ocean networks                                   |
| 7     | North Africa / Amazigh history / Moors / al-Andalus                                               | QUEUED                   | Must foreground complexity without flattening identity                   |
| 8     | Christianity / Islam / Bible                                                                      | QUEUED                   | Separate text, history, tradition, and interpretation                    |
| 9     | Slave trades / colonialism / extraction                                                           | QUEUED                   | Cover trans-Saharan, Indian Ocean, Atlantic, and colonial regimes        |
| 10    | Diaspora / Haiti / Caribbean / Latin America                                                      | QUEUED                   | Build broad diaspora map, not just U.S. focus                            |
| 11    | Black America before emancipation through Reconstruction                                          | QUEUED                   | Include resistance, war service, officeholding, and institution-building |
| 12    | Land / towns / enterprise / HBCUs                                                                 | QUEUED                   | Tie historical institution-building to modern ownership logic            |
| 13    | Racial violence / Jim Crow / housing / redlining                                                  | QUEUED                   | Treat as economic history, not side notes                                |
| 14    | Civil Rights / economic movements / invention / culture                                           | QUEUED                   | Show the ownership and policy layer                                      |
| 15    | Modern economics / restoration / BWE                                                              | QUEUED                   | Close the bridge from history to present action honestly                 |

## Repeating public structures

### Commonly taught / missing context / evidence / why it matters

Use this when the public curriculum usually shrinks a topic.

### Claim / what is true / what is uncertain / what is unsupported / why it matters

Use this when mythology, internet simplification, or political messaging distort the record.

### Evidence labels

Use these labels in public when needed:

- Established fact
- Scholarly interpretation
- Tradition / theology
- Disputed claim

## Editorial rules

- Do not start Black history with slavery.
- Do not detach Egypt from Africa.
- Do not force one modern racial category across thousands of years where evidence does not support it.
- Do not flatten African sacred worlds into one interchangeable religion.
- Do not present tradition or theology as settled archaeology.
- Do not use viral internet claims as source authority.
- Do not overpromise BWE functions that are not actually live.

## Live-route implementation rule

- The current `src/pages/library-of-black-history.tsx` remains the canonical foundation page.
- New routes should only be added when a block becomes substantial enough to stand on its own.
- Until then, ship major new sections into the library page with strong source pathways and clear evidence language.
