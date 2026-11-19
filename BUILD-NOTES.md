# Token Radar — BUILD-NOTES (radar-2)

## What this entry is

A token launch radar for make.fun's `token-radar-01` bounty ($1,325 onchain USDC, entries
close Mon 2026-12-14 17:00 WIB). `main.ts` (Node 22, standard library only) reads the sealed
DefiLlama snapshot at `/input/snapshot.json`, scores every pre-token protocol, writes the ranked
board to `/output/board.json`, writes the dashboard data to `/output/data.js`, copies
`dashboard/` and `screenshots/` to `/output`, and writes `/output/dossier.json` with the
vendored `vendor/makefun-board.ts` (the kit's library, byte for byte the scorer's own copy).

## The radar-2 model (lib/model.ts, MODEL_VERSION = 'radar-2')

Implied value follows only from the snapshot's own figures; no protocol name is special-cased:

```
implied = max(1, round(tvl_usd x 0.25
  x (1 + clamp(change_7d, -60, 120) / 100 x 0.5)
  x (0.6 + min(age_days, 1095) / 1095 x 0.4)
  x breakout x breadth))
```

- **growth**: seven-day TVL change, clamped to [-60, +120]%, weight 0.5.
- **maturity**: 0.6 + up to 0.4 by age with no token (unknown age counts as 365 days).
- **breakout** (new in radar-2): while age < 365 days, `1 + min(max(growth - 10, 0), 50) / 100
  x 0.5`, capped at +25%. A young protocol already growing fast is the radar's core find — the
  token, if it ever comes, is worth farming EARLY — and the cap keeps one hot week from
  carrying a row on its own. 9 of this snapshot's protocols qualify ("early finds").
- **breadth** (new in radar-2): `1 + 0.02` per chain beyond the first, up to 4 extra chains
  (+8% max). Multi-chain protocols reach more farmers and more liquidity.

## What the board ranks (and what it refuses to rank)

The board covers the whole pre-token universe: the 40 watchlist slugs plus every other
rankable pre-token protocol in the snapshot — **198 rows** on the 2026-11-14 snapshot (158
below the $50M floor), not the starter's TVL-truncated 160. The starter's early selection
(took the 160 biggest below-floor protocols by TVL) missed small fast-growers entirely; ranking
by the model's own implied value is what makes the board a radar instead of a TVL table.

Rankability applies the house's own watchlist exclusions to every row: a wrapped, staked or
bridged product of a token that already trades is not a token that does not exist yet. So the
board excludes category Bridge / Canonical Bridge / Liquid Staking / Liquid Restaking /
Restaked BTC / CEX, names beginning with an exchange (Binance, Coinbase, Bybit, Kraken,
Bitget, OKX, Bitfinex, Gemini), names carrying a whole word `wrapped` / `staked` / `staking`,
and version-marked names. This mattered: before the fix the board's top 5 were Binance Staked
ETH, Coinbase Bridge, WBTC, Binance Bitcoin and USDT0. After it, rank 1 is Steakhouse
Financial ($587.1M implied), followed by Sentora Curator, Gauntlet, Veda and USDD. Zero
watchlist slugs are lost to the exclusions (verified: 40/40 covered).

Live-token protocols (24 shown) are set aside with their market caps; the board never mixes
the market's own values into the model's ranking.

## Farm plans

Six steps per row, derived from the protocol's own record (category, chains, TVL, age): a
fresh-wallet safety step, the category's action with capital ($50–$250 by TVL) and gas cost,
a category-specific weekly qualifying action, a hold period (30–60 days by age), a claim-only-
from-official-links step, and a farm-log step. Category actions now cover interest-rate
derivatives, basis trading, options vaults, liquidity managers, yield aggregators, indexes,
payments/cards, privacy, OTC, governance, BTC-backed assets, CeDeFi and chain protocols, in
addition to the starter's lending/CDP, DEX/yield, bridge, staking, perps, prediction,
curator/allocator, stablecoin, RWA and insurance branches.

## The dashboard (dashboard/, 40,163 bytes total — under the 64 KiB dossier text cap)

- Sortable columns (rank/implied, name, TVL, 7d growth, age), search, category filter,
  **chain filter**, **Early finds** spotlight toggle (9 rows) and **Watchlist only** toggle.
- Detail view per protocol: all five multipliers, a plain-language "why it ranks" line, the
  farm plan, and a recompute check — the page re-derives the row with the same five
  multipliers and says in plain text whether it matches the number `board.json` carries.
- Keyboard and link navigation: Up/Down moves the detail drawer between rows, Ctrl/Cmd+
  Shift+C copies the link to the board as it stands (filters and open row in the hash),
  and back/forward re-reads the hash so the board follows the address. A print stylesheet
  prints the board whole with the controls and drawer hidden.
- Summary facts: watchlist coverage 40/40, rows scored, early rows, early finds, live set
  aside. Model panel states the full formula including breakout and breadth.
- No network: no `http://` or `https://` string anywhere in the dashboard files.

## Screenshots (screenshots/, 1440x900 each)

1. `1-board.png` — the board (153,873 bytes).
2. `2-detail.png` — Shift DeFi's detail view, an early find showing breakout x1.25 and the
   recompute agreement (202,462 bytes).
3. `3-filtered.png` — the Early finds filter, 9 rows shown (141,797 bytes).

Captured with the Playwright-cached Chromium headless shell at 1440x900 from the built
`out/dashboard/`; the detail and filtered shots use the page's own hash state
(`#p=shift-defi`, `#early=1`).

## Local verification (2026-11-19, Node v24.22.1)

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../token-radar-01-kit/input/snapshot.json
# token radar: radar-2 model, 758 protocols, 40 on the watchlist, 198 rows scored
# (158 early, 9 early finds, 24 live set aside)
```

All seven sealed-gate rows re-checked locally against RULES.txt:

| Gate row | Result |
|---|---|
| dashboard_files | PASS — 3 files, 40,163 bytes (≤400 files, ≤4 MiB), index.html + .css + .js, no http/https |
| board_file | PASS — 198 rows (100–4000), all slugs in snapshot, 280,232 bytes (≤8 MiB) |
| sorted_by_value | PASS — ranks exactly 1..198, implied value never rises with rank |
| coverage | PASS — watchlist 40/40, 0 missing |
| farm_steps | PASS — every row 6 steps, each 20–600 chars |
| screenshots | PASS — 3 images, 1440x900, 141–202 KiB each (≤512 KiB, long ≤1440, short ≥800) |
| dossier_matches | PASS — `buildDossier` rebuilt from `out/` is byte-identical to `out/dossier.json` (705,817 bytes, ≤1.5 MiB) |

Notes: `buildDossier` returns a Uint8Array — the byte comparison must go through
`Buffer.from(...)`. The kit ships no local copy of the sealed scorer, so the rows above are
checked against the RULES.txt text, not by running the scorer itself; the real gate runs at
submit/check time.

## Revision 2026-11-19 evening (parent session, before submit)

`main.ts` was restructured into named steps (`readFlag`, `resolveSnapshotFile`,
`loadSnapshot`, `writeJson`, `copyRegularFiles`, `checkScreenshots`, `checkWrittenBoard`,
`fail`) with no behavior change: a fresh pipeline run produces byte-identical
`board.json` and `data.js`, and a `dossier.json` that differs only in the dashboard file
sizes. The dashboard gained keyboard row navigation, a copy-link shortcut, back/forward
hash support and a print stylesheet; the rendered board is unchanged, so the three
screenshots still show the same views.

## Files

```
main.ts                  entrypoint (wires MODEL + MODEL_VERSION explicitly; validates the
                       snapshot, the written board and the screenshots; prints model + counts)
lib/model.ts             radar-2 model, board builder, farm plans, snapshot parsing, gate self-check
vendor/makefun-board.ts  kit library, byte for byte the scorer's own copy (do not edit)
dashboard/index.html     page shell
dashboard/app.css        plain theme + Early-find pill
dashboard/app.js         sortable/filterable board, detail view, radar-2 recompute check
screenshots/1-board.png  board
screenshots/2-detail.png detail view (Shift DeFi, early find)
screenshots/3-filtered.png  Early finds filter
README.md                badges + run instructions (template from requirements)
LICENSE                  MIT (kit's)
.makefun/owner.json      {"wallet":"5FDn6v1pbyqe6ZChzwyrgeqsVpBjwhXUBVXXMWFazekc"}
```

## Not done here (parent's steps)

No GitHub repo created, nothing pushed, nothing submitted. The user creates the public repo
`JordyPras/token-radar-01`, uploads these contents, and the parent handles bundle, check and
submit before Mon 2026-12-14 17:00 WIB.
