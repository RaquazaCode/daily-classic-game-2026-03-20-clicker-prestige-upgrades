const FIXED_DT_MS = 100;

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function makeRunState(state) {
  state.coins = 0;
  state.totalCoinsEarned = 0;
  state.clickPower = 1;
  state.autoRatePerSecond = 0;
  state.cursorLevel = 0;
  state.factoryLevel = 0;
  state.cursorCost = 25;
  state.factoryCost = 120;
  state.elapsedMs = 0;
}

export function createGame(seed = 20260320) {
  return {
    seed,
    mode: "title",
    coins: 0,
    totalCoinsEarned: 0,
    clickPower: 1,
    autoRatePerSecond: 0,
    cursorLevel: 0,
    factoryLevel: 0,
    cursorCost: 25,
    factoryCost: 120,
    prestigeShards: 0,
    prestigeMultiplier: 1,
    elapsedMs: 0,
    lastEvent: "Press Enter to start",
  };
}

export function startGame(state) {
  makeRunState(state);
  state.mode = "playing";
  state.lastEvent = "Run started";
}

export function hardResetToTitle(state, seed = state.seed) {
  const fresh = createGame(seed);
  Object.assign(state, fresh);
}

export function togglePause(state) {
  if (state.mode === "playing") {
    state.mode = "paused";
    state.lastEvent = "Paused";
  } else if (state.mode === "paused") {
    state.mode = "playing";
    state.lastEvent = "Resumed";
  }
}

function addCoins(state, amount, reason) {
  if (amount <= 0) return;
  const nextCoins = round3(state.coins + amount);
  const nextTotal = round3(state.totalCoinsEarned + amount);
  state.coins = nextCoins;
  state.totalCoinsEarned = nextTotal;
  if (reason) state.lastEvent = reason;
}

function spendCoins(state, amount) {
  if (state.coins < amount) return false;
  state.coins = round3(state.coins - amount);
  return true;
}

function performClick(state) {
  const gain = round3(state.clickPower * state.prestigeMultiplier);
  addCoins(state, gain, `Click +${gain.toFixed(1)}`);
}

function buyCursor(state) {
  if (!spendCoins(state, state.cursorCost)) {
    state.lastEvent = "Need more coins for Cursor";
    return;
  }
  state.cursorLevel += 1;
  state.clickPower += 1;
  state.cursorCost = Math.ceil(state.cursorCost * 1.35 + 3);
  state.lastEvent = `Cursor Lv${state.cursorLevel} bought`;
}

function buyFactory(state) {
  if (!spendCoins(state, state.factoryCost)) {
    state.lastEvent = "Need more coins for Factory";
    return;
  }
  state.factoryLevel += 1;
  state.autoRatePerSecond = round3(state.autoRatePerSecond + 0.6);
  state.factoryCost = Math.ceil(state.factoryCost * 1.5 + 8);
  state.lastEvent = `Factory Lv${state.factoryLevel} bought`;
}

function attemptPrestige(state) {
  const shardsEarned = Math.floor(state.totalCoinsEarned / 1000);
  if (shardsEarned < 1) {
    state.lastEvent = "Need 1000 total coins for Prestige";
    return false;
  }

  state.prestigeShards += shardsEarned;
  state.prestigeMultiplier = round3(1 + state.prestigeShards * 0.2);
  makeRunState(state);
  state.mode = "playing";
  state.lastEvent = `Prestiged +${shardsEarned} shards`;
  return true;
}

function applyPassiveIncome(state) {
  const gainPerTick = round3(
    (state.autoRatePerSecond * state.prestigeMultiplier * FIXED_DT_MS) / 1000,
  );
  addCoins(state, gainPerTick, gainPerTick > 0 ? `Idle +${gainPerTick.toFixed(2)}` : null);
}

export function stepGame(state, input) {
  if (state.mode !== "playing") return;

  if (input.clickPressed) performClick(state);
  if (input.buyCursorPressed) buyCursor(state);
  if (input.buyFactoryPressed) buyFactory(state);
  if (input.prestigePressed) attemptPrestige(state);

  applyPassiveIncome(state);
  state.elapsedMs += FIXED_DT_MS;
}

export function advanceByMs(state, input, ms) {
  const steps = Math.max(0, Math.ceil(ms / FIXED_DT_MS));
  for (let i = 0; i < steps; i += 1) {
    stepGame(state, input);
  }
}

export function snapshot(state) {
  return {
    mode: state.mode,
    coins: state.coins,
    totalCoinsEarned: state.totalCoinsEarned,
    clickPower: state.clickPower,
    autoRatePerSecond: state.autoRatePerSecond,
    cursorLevel: state.cursorLevel,
    factoryLevel: state.factoryLevel,
    cursorCost: state.cursorCost,
    factoryCost: state.factoryCost,
    prestigeShards: state.prestigeShards,
    prestigeMultiplier: state.prestigeMultiplier,
    elapsedMs: state.elapsedMs,
    lastEvent: state.lastEvent,
  };
}

export function setScenarioForTesting(state, scenario) {
  if (typeof scenario !== "object" || !scenario) {
    throw new Error("scenario must be an object");
  }
  for (const [key, value] of Object.entries(scenario)) {
    if (key in state) {
      state[key] = value;
    }
  }
}

export function toTextRows(state) {
  return [
    `mode=${state.mode}`,
    `coins=${state.coins.toFixed(3)}`,
    `total=${state.totalCoinsEarned.toFixed(3)}`,
    `click_power=${state.clickPower}`,
    `idle_per_sec=${state.autoRatePerSecond.toFixed(3)}`,
    `prestige_shards=${state.prestigeShards}`,
    `prestige_multiplier=${state.prestigeMultiplier.toFixed(3)}`,
    `cursor_level=${state.cursorLevel} cursor_cost=${state.cursorCost}`,
    `factory_level=${state.factoryLevel} factory_cost=${state.factoryCost}`,
    `elapsed_ms=${state.elapsedMs}`,
  ];
}

export { FIXED_DT_MS };
