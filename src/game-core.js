const ROWS = 8;
const COLS = 8;
const GEM_TYPES = 6;
const FIXED_DT_MS = 100;
const LEVEL_DURATION_MS = 30000;

function createRng(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function areAdjacent(a, b) {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
}

function swapCells(board, a, b) {
  const temp = board[a.row][a.col];
  board[a.row][a.col] = board[b.row][b.col];
  board[b.row][b.col] = temp;
}

function findMatches(board) {
  const marked = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  let count = 0;

  for (let row = 0; row < ROWS; row += 1) {
    let runStart = 0;
    for (let col = 1; col <= COLS; col += 1) {
      const same = col < COLS && board[row][col] === board[row][runStart];
      if (same) continue;
      const runLength = col - runStart;
      if (runLength >= 3) {
        for (let fill = runStart; fill < col; fill += 1) {
          if (!marked[row][fill]) {
            marked[row][fill] = true;
            count += 1;
          }
        }
      }
      runStart = col;
    }
  }

  for (let col = 0; col < COLS; col += 1) {
    let runStart = 0;
    for (let row = 1; row <= ROWS; row += 1) {
      const same = row < ROWS && board[row][col] === board[runStart][col];
      if (same) continue;
      const runLength = row - runStart;
      if (runLength >= 3) {
        for (let fill = runStart; fill < row; fill += 1) {
          if (!marked[fill][col]) {
            marked[fill][col] = true;
            count += 1;
          }
        }
      }
      runStart = row;
    }
  }

  return { marked, count };
}

function collapseAndRefill(board, marked, rng) {
  for (let col = 0; col < COLS; col += 1) {
    const kept = [];
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (!marked[row][col]) kept.push(board[row][col]);
    }

    let writeRow = ROWS - 1;
    for (const gem of kept) {
      board[writeRow][col] = gem;
      writeRow -= 1;
    }

    while (writeRow >= 0) {
      board[writeRow][col] = Math.floor(rng() * GEM_TYPES);
      writeRow -= 1;
    }
  }
}

function boardHasInitialMatches(board) {
  return findMatches(board).count > 0;
}

function generateCleanBoard(rng) {
  let board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => Math.floor(rng() * GEM_TYPES)),
  );

  let guard = 0;
  while (boardHasInitialMatches(board) && guard < 120) {
    board = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => Math.floor(rng() * GEM_TYPES)),
    );
    guard += 1;
  }
  return board;
}

function levelTarget(level) {
  return 600 + (level - 1) * 450;
}

function clearSelection(state) {
  state.cursor.selected = null;
}

function processBoard(state) {
  let cascades = 0;
  while (true) {
    const { marked, count } = findMatches(state.board);
    if (count === 0) break;
    cascades += 1;
    const combo = Math.max(1, cascades);
    state.score += count * 60 * combo;
    collapseAndRefill(state.board, marked, state.rng);
    state.lastEvent = cascades > 1 ? `Cascade x${cascades}` : `Matched ${count} gems`;
  }
}

function trySwapSelection(state, nextCell) {
  const selected = state.cursor.selected;
  if (!selected) {
    state.cursor.selected = { row: nextCell.row, col: nextCell.col };
    state.lastEvent = "Gem selected";
    return;
  }

  if (!areAdjacent(selected, nextCell)) {
    state.cursor.selected = { row: nextCell.row, col: nextCell.col };
    state.lastEvent = "Selection moved";
    return;
  }

  swapCells(state.board, selected, nextCell);
  const firstPass = findMatches(state.board);
  if (firstPass.count === 0) {
    swapCells(state.board, selected, nextCell);
    state.score = Math.max(0, state.score - 10);
    state.lastEvent = "No match: swap reverted";
    clearSelection(state);
    return;
  }

  state.moves += 1;
  processBoard(state);
  clearSelection(state);
}

function handleInput(state, input) {
  if (input.leftPressed) state.cursor.col = Math.max(0, state.cursor.col - 1);
  if (input.rightPressed) state.cursor.col = Math.min(COLS - 1, state.cursor.col + 1);
  if (input.upPressed) state.cursor.row = Math.max(0, state.cursor.row - 1);
  if (input.downPressed) state.cursor.row = Math.min(ROWS - 1, state.cursor.row + 1);

  if (input.selectPressed) {
    trySwapSelection(state, { row: state.cursor.row, col: state.cursor.col });
  }
}

function updateTimer(state) {
  state.levelTimeLeftMs = Math.max(0, state.levelTimeLeftMs - FIXED_DT_MS);
  if (state.levelTimeLeftMs > 0) return;

  if (state.score >= state.levelTargetScore) {
    state.level += 1;
    state.levelTimeLeftMs = LEVEL_DURATION_MS;
    state.levelTargetScore = levelTarget(state.level);
    state.lastEvent = `Level ${state.level} started`;
    return;
  }

  state.mode = "gameover";
  state.lastEvent = "Time expired before target";
}

export function createGame(seed = 20260319) {
  const rng = createRng(seed);
  return {
    seed,
    rng,
    mode: "title",
    board: generateCleanBoard(rng),
    level: 1,
    levelTimeLeftMs: LEVEL_DURATION_MS,
    levelTargetScore: levelTarget(1),
    score: 0,
    moves: 0,
    elapsedMs: 0,
    cursor: { row: 0, col: 0, selected: null },
    lastEvent: "Press Enter to start",
  };
}

export function startGame(state) {
  state.rng = createRng(state.seed);
  state.board = generateCleanBoard(state.rng);
  state.mode = "playing";
  state.level = 1;
  state.levelTimeLeftMs = LEVEL_DURATION_MS;
  state.levelTargetScore = levelTarget(1);
  state.score = 0;
  state.moves = 0;
  state.elapsedMs = 0;
  state.cursor = { row: 0, col: 0, selected: null };
  state.lastEvent = "Level 1 started";
}

export function resetToTitle(state, seed = state.seed) {
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

export function stepGame(state, input) {
  if (state.mode !== "playing") return;
  handleInput(state, input);
  updateTimer(state);
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
    level: state.level,
    score: state.score,
    moves: state.moves,
    levelTimeLeftMs: state.levelTimeLeftMs,
    levelTargetScore: state.levelTargetScore,
    cursor: {
      row: state.cursor.row,
      col: state.cursor.col,
      selected: state.cursor.selected,
    },
    board: cloneBoard(state.board),
    lastEvent: state.lastEvent,
  };
}

export function setBoardForTesting(state, board) {
  if (!Array.isArray(board) || board.length !== ROWS) {
    throw new Error("board must have 8 rows");
  }
  for (const row of board) {
    if (!Array.isArray(row) || row.length !== COLS) {
      throw new Error("board rows must have 8 cols");
    }
  }
  state.board = cloneBoard(board);
}

export function setNearMatchScenario(state) {
  const board = [
    [4, 1, 2, 3, 4, 5, 2, 1],
    [2, 4, 1, 0, 3, 5, 1, 2],
    [3, 5, 1, 2, 4, 0, 3, 5],
    [0, 2, 4, 5, 1, 3, 2, 4],
    [1, 3, 5, 4, 2, 1, 0, 3],
    [5, 0, 3, 1, 5, 2, 4, 0],
    [2, 4, 0, 3, 1, 4, 5, 2],
    [1, 2, 5, 0, 3, 2, 1, 4],
  ];
  state.board = board;
  state.cursor.row = 0;
  state.cursor.col = 0;
  state.cursor.selected = null;
  state.lastEvent = "Scenario loaded";
}

export function toTextRows(state) {
  return state.board.map((row) => row.join(" "));
}

export { COLS, GEM_TYPES, LEVEL_DURATION_MS, ROWS };
