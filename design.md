# Design - Clicker Prestige Upgrades

## Goal
Deliver a deterministic clicker/idle MVP that can run unattended and be verified with scripted browser checks.

## Core Loop
1. Player starts run from title.
2. Active clicks and passive ticks generate coins.
3. Coins buy two upgrade lanes: click power and idle factories.
4. Once enough total run value is produced, player can trigger prestige.
5. Prestige resets run-level values but increases permanent multiplier through shards.

## Determinism Strategy
- Fixed simulation tick (`100ms`) in core logic.
- No runtime randomness in economy calculations.
- `window.advanceTime(ms)` drives deterministic progression for automation.
- `window.render_game_to_text()` exposes a structured state snapshot.
- Extra deterministic helper `window.__runDeterministicVerification()` proves prestige progression without pointer dependency.

## Input + UX
- Keyboard-first controls (`Enter`, `C`, `F`, `K`, `P`, `R`) with matching click targets.
- HUD exposes costs, levels, multiplier, and event feedback.
- Overlay states for title and pause ensure readable automation screenshots.

## Validation
- Unit tests cover deterministic equivalence, purchase effects, prestige resets, pause freeze, and hard reset behavior.
- Playwright capture script stores screenshot + action payload artifacts using the required schema.
