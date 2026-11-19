# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/JordyPras/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/JordyPras/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar ranks every pre-token protocol in a sealed DefiLlama snapshot by the implied value of the token it may one day issue, and shows a reader how to farm each one before it exists. The radar-2 model scores the whole pre-token universe — the 40-protocol watchlist floor plus every rankable protocol below it — from the snapshot's own figures only: TVL, seven-day growth, age with no token, a capped breakout bonus for young protocols already growing fast, and a small breadth bonus for protocols live on several chains. Wrapped, staked and bridged products of tokens that already trade are never ranked as launches. The static dashboard is sortable and filterable (search, category, chain, Early finds, Watchlist only), shows a detail view per protocol with the model's five multipliers and a plain-language reason it ranks where it does, and generates a six-step farm plan with cost and time for every row. Node 22 standard library only, deterministic, no network, no model calls.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

Reads `/input/snapshot.json` (or `--input <snapshot.json|directory>`) and writes `board.json`, `data.js`, `dashboard/`, `screenshots/` and `dossier.json` to `$MAKEFUN_OUTPUT_DIR` (default `/output/`). See BUILD-NOTES.md for the model, the verification results and the gate checks.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
