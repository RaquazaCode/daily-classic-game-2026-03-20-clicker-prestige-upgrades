import {
  FIXED_DT_MS,
  advanceByMs,
  createGame,
  hardResetToTitle,
  setScenarioForTesting,
  snapshot,
  startGame,
  stepGame,
  toTextRows,
  togglePause,
} from "./game-core.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const CLICKER = { x: 120, y: 180, w: 360, h: 220 };
const BTN_CURSOR = { x: 560, y: 200, w: 320, h: 80 };
const BTN_FACTORY = { x: 560, y: 300, w: 320, h: 80 };
const BTN_PRESTIGE = { x: 560, y: 400, w: 320, h: 80 };

const state = createGame(20260320);
const input = {
  clickPressed: false,
  buyCursorPressed: false,
  buyFactoryPressed: false,
  prestigePressed: false,
};

function inRect(pointX, pointY, rect) {
  return (
    pointX >= rect.x &&
    pointX <= rect.x + rect.w &&
    pointY >= rect.y &&
    pointY <= rect.y + rect.h
  );
}

function pulse(action) {
  input[action] = true;
}

function resetInput() {
  input.clickPressed = false;
  input.buyCursorPressed = false;
  input.buyFactoryPressed = false;
  input.prestigePressed = false;
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1b1029");
  gradient.addColorStop(1, "#0f223a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 81 + (state.elapsedMs / 20) % canvas.width) % canvas.width;
    const y = (i * 53 + (state.elapsedMs / 33) % canvas.height) % canvas.height;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawPanel(rect, color = "rgba(7,9,20,0.72)") {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function drawMainBoard() {
  drawPanel({ x: 52, y: 80, w: 440, h: 440 });

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 42px 'Trebuchet MS', sans-serif";
  ctx.fillText("Clicker Core", 106, 142);

  const orbGradient = ctx.createRadialGradient(300, 290, 24, 300, 290, 170);
  orbGradient.addColorStop(0, "#ffd166");
  orbGradient.addColorStop(1, "#ef476f");
  ctx.fillStyle = orbGradient;
  ctx.fillRect(CLICKER.x, CLICKER.y, CLICKER.w, CLICKER.h);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 3;
  ctx.strokeRect(CLICKER.x, CLICKER.y, CLICKER.w, CLICKER.h);

  ctx.fillStyle = "#fff8e8";
  ctx.font = "700 28px 'Trebuchet MS', sans-serif";
  ctx.fillText("CLICK ZONE", CLICKER.x + 92, CLICKER.y + 120);

  ctx.font = "600 20px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Coins: ${state.coins.toFixed(1)}`, 100, 460);
  ctx.fillText(`Total earned: ${state.totalCoinsEarned.toFixed(1)}`, 100, 492);
}

function drawUpgradeButton(rect, title, body) {
  drawPanel(rect, "rgba(18,26,44,0.78)");
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 24px 'Trebuchet MS', sans-serif";
  ctx.fillText(title, rect.x + 20, rect.y + 34);
  ctx.font = "500 18px 'Trebuchet MS', sans-serif";
  ctx.fillText(body, rect.x + 20, rect.y + 63);
}

function drawHud() {
  drawPanel({ x: 524, y: 80, w: 372, h: 440 });

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 32px 'Trebuchet MS', sans-serif";
  ctx.fillText("Prestige Idle", 550, 132);

  ctx.font = "600 20px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Click Power: ${state.clickPower.toFixed(1)}`, 550, 170);
  ctx.fillText(`Idle / sec: ${state.autoRatePerSecond.toFixed(1)}`, 550, 194);

  drawUpgradeButton(
    BTN_CURSOR,
    `Cursor Lv${state.cursorLevel} - ${state.cursorCost}c`,
    "C key: +1 click power",
  );
  drawUpgradeButton(
    BTN_FACTORY,
    `Factory Lv${state.factoryLevel} - ${state.factoryCost}c`,
    "F key: +0.6 idle / sec",
  );
  drawUpgradeButton(
    BTN_PRESTIGE,
    "Prestige (K key)",
    `Shards: ${state.prestigeShards}  Mult: x${state.prestigeMultiplier.toFixed(1)}`,
  );

  ctx.fillStyle = "#dce9ff";
  ctx.font = "500 17px 'Trebuchet MS', sans-serif";
  ctx.fillText("Enter start/restart", 550, 548);
  ctx.fillText("P pause | R hard reset", 550, 572);
  ctx.fillText(state.lastEvent, 550, 598);
}

function drawOverlay() {
  if (state.mode === "playing") return;

  ctx.fillStyle = "rgba(6,7,18,0.64)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";

  if (state.mode === "title") {
    ctx.font = "700 58px 'Trebuchet MS', sans-serif";
    ctx.fillText("Clicker / Idle", canvas.width / 2, 240);
    ctx.font = "600 32px 'Trebuchet MS', sans-serif";
    ctx.fillText("Prestige Upgrades", canvas.width / 2, 290);
    ctx.font = "500 24px 'Trebuchet MS', sans-serif";
    ctx.fillText("Enter to start", canvas.width / 2, 350);
  }

  if (state.mode === "paused") {
    ctx.font = "700 64px 'Trebuchet MS', sans-serif";
    ctx.fillText("Paused", canvas.width / 2, 270);
    ctx.font = "500 24px 'Trebuchet MS', sans-serif";
    ctx.fillText("Press P to continue", canvas.width / 2, 320);
  }

  ctx.textAlign = "start";
}

function render() {
  drawBackground();
  drawMainBoard();
  drawHud();
  drawOverlay();
}

let previous = performance.now();
let accumulator = 0;
let raf = 0;

function frame(now) {
  const dt = Math.min(100, now - previous);
  previous = now;
  accumulator += dt;

  while (accumulator >= FIXED_DT_MS) {
    stepGame(state, input);
    resetInput();
    accumulator -= FIXED_DT_MS;
  }

  render();
  raf = requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "enter") {
    if (state.mode === "title") {
      startGame(state);
      return;
    }
    pulse("clickPressed");
  }

  if (key === "c") pulse("buyCursorPressed");
  if (key === "f") pulse("buyFactoryPressed");
  if (key === "k") pulse("prestigePressed");

  if (key === "p") {
    togglePause(state);
  }

  if (key === "r") {
    hardResetToTitle(state, 20260320);
  }
});

canvas.addEventListener("click", (event) => {
  if (state.mode !== "playing") return;
  const bounds = canvas.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * canvas.width;
  const y = ((event.clientY - bounds.top) / bounds.height) * canvas.height;

  if (inRect(x, y, CLICKER)) pulse("clickPressed");
  if (inRect(x, y, BTN_CURSOR)) pulse("buyCursorPressed");
  if (inRect(x, y, BTN_FACTORY)) pulse("buyFactoryPressed");
  if (inRect(x, y, BTN_PRESTIGE)) pulse("prestigePressed");
});

window.advanceTime = (ms) => {
  advanceByMs(state, { clickPressed: false, buyCursorPressed: false, buyFactoryPressed: false, prestigePressed: false }, ms);
  render();
};

window.render_game_to_text = () => {
  return JSON.stringify({
    ...snapshot(state),
    rows: toTextRows(state),
  });
};

window.__runDeterministicVerification = () => {
  startGame(state);
  setScenarioForTesting(state, {
    coins: 1600,
    totalCoinsEarned: 1600,
    clickPower: 4,
    autoRatePerSecond: 1.2,
    cursorLevel: 3,
    factoryLevel: 2,
    cursorCost: 128,
    factoryCost: 310,
  });
  pulse("prestigePressed");
  stepGame(state, input);
  resetInput();

  pulse("clickPressed");
  stepGame(state, input);
  resetInput();

  advanceByMs(
    state,
    { clickPressed: false, buyCursorPressed: false, buyFactoryPressed: false, prestigePressed: false },
    3000,
  );
  render();
  return snapshot(state);
};

render();
raf = requestAnimationFrame(frame);
window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
