# Design - Match-3 Timed Levels

## Goal
Build a deterministic match-3 MVP suitable for unattended automation runs while keeping gameplay readable and replayable.

## Core Loop
1. Player moves cursor over 8x8 grid.
2. Player selects two adjacent gems to attempt swap.
3. Engine validates swap, resolves matches, cascades, gravity, and refill.
4. Score updates deterministically.
5. Timed level countdown checks target threshold.

## Determinism
- Seeded PRNG controls initial board generation and all refill gems.
- Fixed-step update loop (`100ms`) drives timer and simulation.
- `window.advanceTime(ms)` advances simulation by deterministic steps.
- `window.render_game_to_text()` emits structured board/state snapshots.

## Timed-Level Twist
- Each level runs on a 30-second timer.
- Each level has a score target (`600 + 450*(level-1)`).
- Timer expiry with target met advances level.
- Timer expiry without target ends run (`gameover`).

## Input + Runtime Controls
- Arrows: cursor motion
- Space/Enter: select & swap
- Enter on overlays: restart run
- P: pause/resume
- R: reset to title

## Verification Strategy
- Unit tests verify deterministic seeding, swap scoring, timed-level progression, timeout game over, and pause timer freeze.
- Playwright capture verifies title/live/paused screenshots and deterministic cascade score path.
- Action payload JSONs follow `web_game_playwright_client` schema.
