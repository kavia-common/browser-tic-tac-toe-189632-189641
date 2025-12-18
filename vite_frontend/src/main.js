import "./style.css";

/**
 * Winning line indices for a 3x3 board.
 * @type {ReadonlyArray<ReadonlyArray<number>>}
 */
const WIN_LINES = Object.freeze([
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6],
]);

/**
 * @typedef {"X" | "O"} Player
 */

/**
 * @typedef {Object} GameState
 * @property {Array<"X" | "O" | null>} board
 * @property {Player} currentPlayer
 * @property {Player | null} winner
 * @property {boolean} isDraw
 * @property {ReadonlyArray<number> | null} winningLine
 */

/**
 * Create a fresh initial game state.
 * @returns {GameState}
 */
function createInitialState() {
  return {
    board: Array.from({ length: 9 }, () => null),
    currentPlayer: "X",
    winner: null,
    isDraw: false,
    winningLine: null,
  };
}

/**
 * Determine winner and winning line for a given board.
 * @param {Array<"X" | "O" | null>} board
 * @returns {{ winner: Player | null, winningLine: ReadonlyArray<number> | null }}
 */
function getWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, winningLine: line };
    }
  }
  return { winner: null, winningLine: null };
}

/**
 * Returns true when all squares are filled.
 * @param {Array<"X" | "O" | null>} board
 * @returns {boolean}
 */
function isBoardFull(board) {
  return board.every((cell) => cell !== null);
}

/**
 * Compute the status message for the UI.
 * @param {GameState} state
 * @returns {string}
 */
function getStatusText(state) {
  if (state.winner) return `Winner: ${state.winner}`;
  if (state.isDraw) return "It's a draw.";
  return `Turn: ${state.currentPlayer}`;
}

/**
 * Render the app UI.
 * @param {GameState} state
 */
function render(state) {
  const app = document.querySelector("#app");
  if (!app) return;

  const statusText = getStatusText(state);

  app.innerHTML = `
    <main class="page">
      <section class="shell" aria-label="Tic Tac Toe">
        <header class="header">
          <div class="brand">
            <div class="brand__mark" aria-hidden="true"></div>
            <div class="brand__text">
              <h1 class="title">Tic Tac Toe</h1>
              <p class="subtitle">Two-player, local play — clean & modern.</p>
            </div>
          </div>
        </header>

        <div class="card">
          <div class="status" role="status" aria-live="polite">
            <span class="status__label">Status</span>
            <span class="status__value" data-status-value>${statusText}</span>
          </div>

          <div class="board" role="grid" aria-label="3 by 3 tic tac toe board">
            ${state.board
              .map((value, idx) => {
                const isWinningCell =
                  state.winningLine?.includes(idx) ?? false;
                const isDisabled = Boolean(value) || Boolean(state.winner) || state.isDraw;

                const markClass =
                  value === "X" ? "cell--x" : value === "O" ? "cell--o" : "";

                const winClass = isWinningCell ? "cell--win" : "";
                const disabledAttr = isDisabled ? "disabled" : "";

                const ariaLabel = value
                  ? `Cell ${idx + 1}, ${value}`
                  : `Cell ${idx + 1}, empty`;

                return `
                  <button
                    class="cell ${markClass} ${winClass}"
                    type="button"
                    role="gridcell"
                    aria-label="${ariaLabel}"
                    data-idx="${idx}"
                    ${disabledAttr}
                  >
                    <span class="cell__inner" aria-hidden="true">${value ?? ""}</span>
                  </button>
                `;
              })
              .join("")}
          </div>

          <div class="actions">
            <button class="btn btn--primary" type="button" data-action="reset">
              New game
            </button>
            <p class="hint">
              Tip: First to align three marks wins. Good luck.
            </p>
          </div>
        </div>

        <footer class="footer">
          <span class="footer__badge">Ocean Professional</span>
          <span class="footer__sep">•</span>
          <span class="footer__muted">Client-side only</span>
        </footer>
      </section>
    </main>
  `;
}

/**
 * Apply a move at index for the current player, returning the next state.
 * @param {GameState} state
 * @param {number} idx
 * @returns {GameState}
 */
function applyMove(state, idx) {
  if (state.winner || state.isDraw) return state;
  if (idx < 0 || idx > 8) return state;
  if (state.board[idx] !== null) return state;

  const nextBoard = state.board.slice();
  nextBoard[idx] = state.currentPlayer;

  const { winner, winningLine } = getWinner(nextBoard);
  const draw = !winner && isBoardFull(nextBoard);

  /** @type {GameState} */
  const nextState = {
    board: nextBoard,
    currentPlayer: state.currentPlayer === "X" ? "O" : "X",
    winner,
    isDraw: draw,
    winningLine,
  };

  return nextState;
}

// --- App bootstrap & event wiring ---
let state = createInitialState();
render(state);

// Use a single delegated event listener so we can safely re-render via innerHTML.
document.addEventListener("click", (e) => {
  const target = /** @type {HTMLElement | null} */ (e.target instanceof HTMLElement ? e.target : null);
  if (!target) return;

  const cell = target.closest?.("[data-idx]");
  if (cell) {
    const idxRaw = cell.getAttribute("data-idx");
    const idx = idxRaw ? Number.parseInt(idxRaw, 10) : Number.NaN;
    if (!Number.isFinite(idx)) return;

    state = applyMove(state, idx);
    render(state);
    return;
  }

  const action = target.closest?.("[data-action]");
  if (action) {
    const type = action.getAttribute("data-action");
    if (type === "reset") {
      state = createInitialState();
      render(state);
    }
  }
});
