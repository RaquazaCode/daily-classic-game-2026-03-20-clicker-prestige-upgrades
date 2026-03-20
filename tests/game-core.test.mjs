import assert from "node:assert/strict";
import {
  advanceByMs,
  createGame,
  hardResetToTitle,
  setScenarioForTesting,
  snapshot,
  startGame,
  stepGame,
  togglePause,
} from "../src/game-core.js";

const emptyInput = () => ({
  clickPressed: false,
  buyCursorPressed: false,
  buyFactoryPressed: false,
  prestigePressed: false,
});

{
  const a = createGame(77);
  const b = createGame(77);
  startGame(a);
  startGame(b);
  advanceByMs(a, emptyInput(), 3000);
  advanceByMs(b, emptyInput(), 3000);
  assert.deepEqual(snapshot(a), snapshot(b), "same seed/timing should be deterministic");
}

{
  const state = createGame();
  startGame(state);
  stepGame(state, { ...emptyInput(), clickPressed: true });
  assert.equal(state.coins, 1, "click should grant base click power");

  setScenarioForTesting(state, { coins: 30 });
  stepGame(state, { ...emptyInput(), buyCursorPressed: true });
  assert.equal(state.cursorLevel, 1, "cursor level should increase after purchase");
  assert.equal(state.clickPower, 2, "cursor should increase click power");
}

{
  const state = createGame();
  startGame(state);
  setScenarioForTesting(state, {
    coins: 1500,
    totalCoinsEarned: 1500,
    autoRatePerSecond: 2.4,
    factoryLevel: 4,
  });
  stepGame(state, { ...emptyInput(), prestigePressed: true });
  assert.equal(state.prestigeShards, 1, "prestige should award shards at 1000 total");
  assert.equal(state.prestigeMultiplier, 1.2, "prestige multiplier should scale from shards");
  assert.equal(state.coins, 0, "prestige should reset run coins");
  assert.equal(state.factoryLevel, 0, "prestige should reset run upgrades");
}

{
  const state = createGame();
  startGame(state);
  setScenarioForTesting(state, { coins: 200, totalCoinsEarned: 200, autoRatePerSecond: 1.8 });
  togglePause(state);
  const before = snapshot(state);
  advanceByMs(state, emptyInput(), 5000);
  const after = snapshot(state);
  assert.equal(after.mode, "paused");
  assert.equal(after.coins, before.coins, "pause should freeze passive gain");
  assert.equal(after.elapsedMs, before.elapsedMs, "pause should freeze elapsed time");
}

{
  const state = createGame();
  startGame(state);
  setScenarioForTesting(state, { prestigeShards: 3, prestigeMultiplier: 1.6, coins: 500 });
  hardResetToTitle(state);
  assert.equal(state.mode, "title");
  assert.equal(state.prestigeShards, 0, "hard reset should wipe prestige meta");
  assert.equal(state.coins, 0);
}

console.log("game-core tests passed");
