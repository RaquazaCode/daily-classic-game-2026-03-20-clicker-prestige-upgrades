# daily-classic-game-2026-03-19-match-3-timed-levels

<div align="center">
  <p><strong>Deterministic 8x8 match-3 with timed level gates.</strong></p>
  <p>Swap adjacent gems, trigger cascades, and beat each level target before the clock expires.</p>
</div>

<div align="center">
  <p><strong>Media</strong></p>
  <p>Title, live board, and paused-state captures are generated via Playwright in each run.</p>
</div>

## GIF Captures
- `clip-title-to-start.gif`: title overlay into active timed level
- `clip-cascade-score.gif`: deterministic cascade scenario proving score gain
- `clip-pause-reset.gif`: pause and reset key flow

## Quick Start
```bash
pnpm install
pnpm dev
```

## How To Play
- Use arrow keys to move the cursor on the 8x8 board.
- Press `Space` or `Enter` to select a gem.
- Move to an adjacent gem and press `Space`/`Enter` again to swap.
- Valid swaps create a 3+ match horizontally or vertically.
- Press `Enter` on title/game-over screens to restart a run.
- Press `P` to pause/resume and `R` to reset back to title.

## Rules
- Only adjacent swaps are allowed.
- Non-matching swaps are reverted and apply a small score penalty.
- Matches clear, gravity collapses gems downward, and new gems refill from top.
- Cascades score with a higher multiplier per chain.
- Each timed level has a fixed countdown and score target.
- If timer reaches zero without hitting target, run ends.

## Scoring
- `+60` per cleared gem in base chain.
- Cascade multiplier increases per chain (`x1`, `x2`, `x3`, ...).
- `-10` for invalid swap attempts.

## Twist
- **Timed levels**: every level has a 30-second timer and a target score.
- Reaching the target before timeout advances to the next timed level with a higher goal.

## Verification
```bash
pnpm test
pnpm build
pnpm capture
```

## Project Layout
- `src/game-core.js`: deterministic rules engine, timing, matching, scoring, hooks
- `src/main.js`: renderer, input handling, runtime loop, browser automation hooks
- `tests/game-core.test.mjs`: deterministic logic tests
- `tests/capture.spec.mjs`: Playwright screenshots + action payload artifacts
- `artifacts/playwright/`: generated captures, action JSON, render text snapshots
- `docs/plans/`: implementation plans for the daily run
