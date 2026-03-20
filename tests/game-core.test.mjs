import assert from "node:assert/strict";
import {
  advanceByMs,
  createGame,
  setBoardForTesting,
  setNearMatchScenario,
  snapshot,
  startGame,
  stepGame,
  togglePause,
} from "../src/game-core.js";

function pulse(input, key) {
  input[key] = true;
  stepGame(gameRef.state, input);
  input[key] = false;
}

const emptyInput = () => ({
  leftPressed: false,
  rightPressed: false,
  upPressed: false,
  downPressed: false,
  selectPressed: false,
});

const gameRef = { state: null };

{
  const a = createGame(1234);
  const b = createGame(1234);
  startGame(a);
  startGame(b);
  assert.deepEqual(snapshot(a).board, snapshot(b).board, "same seed should yield same board");
}

{
  gameRef.state = createGame(20260319);
  startGame(gameRef.state);
  setNearMatchScenario(gameRef.state);
  const input = emptyInput();

  pulse(input, "rightPressed");
  pulse(input, "selectPressed");
  pulse(input, "rightPressed");
  pulse(input, "selectPressed");

  const view = snapshot(gameRef.state);
  assert.ok(view.score >= 180, "successful match swap should award score");
  assert.equal(view.mode, "playing");
}

{
  const state = createGame(99);
  startGame(state);
  setBoardForTesting(state, [
    [0, 1, 2, 3, 4, 5, 0, 1],
    [1, 2, 3, 4, 5, 0, 1, 2],
    [2, 3, 4, 5, 0, 1, 2, 3],
    [3, 4, 5, 0, 1, 2, 3, 4],
    [4, 5, 0, 1, 2, 3, 4, 5],
    [5, 0, 1, 2, 3, 4, 5, 0],
    [0, 1, 2, 3, 4, 5, 0, 1],
    [1, 2, 3, 4, 5, 0, 1, 2],
  ]);
  state.levelTimeLeftMs = 40;
  state.levelTargetScore = 50;
  state.score = 80;
  advanceByMs(state, emptyInput(), 50);
  assert.equal(state.level, 2, "meeting target before timeout should advance timed level");
  assert.equal(state.mode, "playing");
}

{
  const state = createGame(88);
  startGame(state);
  state.levelTimeLeftMs = 20;
  state.levelTargetScore = 800;
  state.score = 100;
  advanceByMs(state, emptyInput(), 40);
  assert.equal(state.mode, "gameover", "missing target at timer end should end run");
}

{
  const state = createGame(77);
  startGame(state);
  togglePause(state);
  const before = snapshot(state);
  advanceByMs(state, emptyInput(), 1000);
  const after = snapshot(state);
  assert.equal(after.mode, "paused");
  assert.equal(before.levelTimeLeftMs, after.levelTimeLeftMs, "pause should freeze timer");
}

console.log("game-core tests passed");
