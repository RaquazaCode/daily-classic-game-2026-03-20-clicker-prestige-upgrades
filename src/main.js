import {
  advanceByMs,
  createGame,
  resetToTitle,
  setNearMatchScenario,
  snapshot,
  startGame,
  stepGame,
  toTextRows,
  togglePause,
} from "./game-core.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const CELL = 52;
const BOARD_X = 40;
const BOARD_Y = 70;

const palette = ["#ff6b6b", "#ffd166", "#4ecdc4", "#5f7cff", "#b084f5", "#7fd957"];

const state = createGame(20260319);
const input = {
  leftPressed: false,
  rightPressed: false,
  upPressed: false,
  downPressed: false,
  selectPressed: false,
};

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0f1230");
  gradient.addColorStop(1, "#1a2f5a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 20; i += 1) {
    const x = (i * 87 + (state.elapsedMs / 28) % canvas.width) % canvas.width;
    const y = (i * 39 + (state.elapsedMs / 40) % canvas.height) % canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBoardPanel() {
  ctx.fillStyle = "rgba(5, 8, 20, 0.72)";
  ctx.fillRect(24, 52, 440, 440);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 52, 440, 440);
}

function drawGems() {
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const gem = state.board[row][col];
      const x = BOARD_X + col * CELL;
      const y = BOARD_Y + row * CELL;

      ctx.fillStyle = palette[gem];
      ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, CELL - 8, CELL - 8);
    }
  }
}

function drawCursor() {
  const x = BOARD_X + state.cursor.col * CELL;
  const y = BOARD_Y + state.cursor.row * CELL;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);

  if (state.cursor.selected) {
    const selX = BOARD_X + state.cursor.selected.col * CELL;
    const selY = BOARD_Y + state.cursor.selected.row * CELL;
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 4;
    ctx.strokeRect(selX + 1, selY + 1, CELL - 2, CELL - 2);
  }
}

function drawHud() {
  ctx.fillStyle = "rgba(5, 8, 20, 0.72)";
  ctx.fillRect(490, 52, 446, 440);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px 'Trebuchet MS', sans-serif";
  ctx.fillText("Match-3", 520, 102);
  ctx.font = "700 22px 'Trebuchet MS', sans-serif";
  ctx.fillText("Timed Levels", 520, 134);

  ctx.font = "600 22px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Score: ${state.score}`, 520, 188);
  ctx.fillText(`Level: ${state.level}`, 520, 222);
  ctx.fillText(`Moves: ${state.moves}`, 520, 256);

  const secondsLeft = (state.levelTimeLeftMs / 1000).toFixed(1);
  ctx.fillText(`Time: ${secondsLeft}s`, 520, 290);
  ctx.fillText(`Target: ${state.levelTargetScore}`, 520, 324);

  ctx.fillStyle = "#d6deff";
  ctx.font = "500 18px 'Trebuchet MS', sans-serif";
  ctx.fillText(state.lastEvent, 520, 364);

  ctx.fillStyle = "#f6f8ff";
  ctx.font = "500 17px 'Trebuchet MS', sans-serif";
  ctx.fillText("Arrows move cursor", 520, 412);
  ctx.fillText("Space/Enter select & swap", 520, 438);
  ctx.fillText("P pause | R reset", 520, 464);
}

function drawOverlay() {
  if (state.mode === "playing") return;

  ctx.fillStyle = "rgba(3, 4, 12, 0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";

  if (state.mode === "title") {
    ctx.font = "700 64px 'Trebuchet MS', sans-serif";
    ctx.fillText("Match-3", canvas.width / 2, 210);
    ctx.font = "700 34px 'Trebuchet MS', sans-serif";
    ctx.fillText("Timed Levels", canvas.width / 2, 258);
    ctx.font = "500 24px 'Trebuchet MS', sans-serif";
    ctx.fillText("Enter to start", canvas.width / 2, 322);
    ctx.fillText("Reach target score before each timer expires", canvas.width / 2, 358);
  }

  if (state.mode === "paused") {
    ctx.font = "700 64px 'Trebuchet MS', sans-serif";
    ctx.fillText("Paused", canvas.width / 2, 240);
    ctx.font = "500 24px 'Trebuchet MS', sans-serif";
    ctx.fillText("Press P to continue", canvas.width / 2, 296);
  }

  if (state.mode === "gameover") {
    ctx.font = "700 64px 'Trebuchet MS', sans-serif";
    ctx.fillText("Time Up", canvas.width / 2, 230);
    ctx.font = "500 24px 'Trebuchet MS', sans-serif";
    ctx.fillText(`Final score: ${state.score}`, canvas.width / 2, 286);
    ctx.fillText("Enter to retry | R to reset", canvas.width / 2, 322);
  }

  ctx.textAlign = "start";
}

function render() {
  drawBackground();
  drawBoardPanel();
  drawGems();
  drawCursor();
  drawHud();
  drawOverlay();
}

let previous = performance.now();
let accumulator = 0;
let raf = 0;

function frame(now) {
  const dt = Math.min(0.1, now - previous);
  previous = now;
  accumulator += dt;

  while (accumulator >= 100) {
    stepGame(state, input);
    input.leftPressed = false;
    input.rightPressed = false;
    input.upPressed = false;
    input.downPressed = false;
    input.selectPressed = false;
    accumulator -= 100;
  }

  render();
  raf = requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "arrowleft") input.leftPressed = true;
  if (key === "arrowright") input.rightPressed = true;
  if (key === "arrowup") input.upPressed = true;
  if (key === "arrowdown") input.downPressed = true;
  if (key === " " || key === "spacebar" || key === "space") input.selectPressed = true;

  if (key === "enter") {
    if (state.mode === "title" || state.mode === "gameover") {
      startGame(state);
    } else {
      input.selectPressed = true;
    }
  }

  if (key === "p") {
    togglePause(state);
  }

  if (key === "r") {
    resetToTitle(state, 20260319);
  }
});

window.advanceTime = (ms) => {
  advanceByMs(state, input, ms);
  render();
};

window.render_game_to_text = () => {
  const view = snapshot(state);
  return JSON.stringify({
    ...view,
    board_rows: toTextRows(state),
  });
};

window.__setupCascadeScenario = () => {
  setNearMatchScenario(state);
  state.mode = "playing";
  state.score = 0;
  state.level = 1;
  state.levelTimeLeftMs = 30000;
  state.levelTargetScore = 600;
  state.cursor.selected = null;
  state.lastEvent = "Cascade scenario ready";
  render();
};

window.__runCascadeSwap = () => {
  const pulse = (key) => {
    input[key] = true;
    stepGame(state, input);
    input.leftPressed = false;
    input.rightPressed = false;
    input.upPressed = false;
    input.downPressed = false;
    input.selectPressed = false;
  };

  pulse("rightPressed");
  pulse("selectPressed");
  pulse("rightPressed");
  pulse("selectPressed");
  render();
  return snapshot(state);
};

render();
raf = requestAnimationFrame(frame);
window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
