const WIN_CONDITION = 5;
const AI_DEPTH_7 = 3;
const AI_DEPTH_13 = 2;

let boardSize = 7;
let board = [];
let currentPlayer = 'X';
let playerFirst = true;
let gameActive = false;

let stats = {
  "7x7_player": { playerWins: 0, aiWins: 0, gamesPlayed: 0 },
  "7x7_ai":     { playerWins: 0, aiWins: 0, gamesPlayed: 0 },
  "13x13_player": { playerWins: 0, aiWins: 0, gamesPlayed: 0 },
  "13x13_ai":     { playerWins: 0, aiWins: 0, gamesPlayed: 0 }
};

function loadStats() {
  const saved = localStorage.getItem("tic_tac_toe_stats");
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.assign(stats, parsed);
  }
}

function saveStats() {
  localStorage.setItem("tic_tac_toe_stats", JSON.stringify(stats));
}

function updateStatsUI(s) {
  document.getElementById('player-wins').textContent = s.playerWins;
  document.getElementById('ai-wins').textContent = s.aiWins;
  document.getElementById('games-played').textContent = s.gamesPlayed;
}

let currentModeKey = "";

function getModeKey(size, playerFirst) {
  return `${size}x${size}_${playerFirst ? 'player' : 'ai'}`;
}

function startGame(size, isPlayerFirst) {
  boardSize = size;
  playerFirst = isPlayerFirst;
  currentPlayer = isPlayerFirst ? 'X' : 'O';
  gameActive = true;
  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));

  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  document.getElementById('game-status').textContent = playerFirst ? 'Your turn (X)' : 'AI is thinking...';

  currentModeKey = getModeKey(size, isPlayerFirst);
  updateStatsUI(stats[currentModeKey]);
  renderBoard();

  if (!playerFirst) {
    setTimeout(makeAIMove, 500);
  }
}

function renderBoard() {
  const boardElement = document.getElementById('board');
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, minmax(30px, 1fr))`;

  const textSize = boardSize > 10 ? 'text-2xl' : 'text-4xl';
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement('div');
      cell.className = `cell bg-white flex items-center justify-center ${textSize}`;
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.id = `cell-${i}-${j}`;
      const val = board[i][j];
      if (val) {
        cell.textContent = val;
        cell.classList.add(val === 'X' ? 'text-blue-600' : 'text-red-600');
      } else {
        cell.classList.add('cursor-pointer');
        cell.addEventListener('click', () => handleCellClick(i, j));
      }

      boardElement.appendChild(cell);
    }
  }
}
function highlightCell(row, col) {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('last-move');
  });
  const cell = document.getElementById(`cell-${row}-${col}`);
  if (cell) {
    cell.classList.add('last-move');
  }
}

function handleCellClick(row, col) {
  if (!gameActive || board[row][col] || currentPlayer !== 'X') return;
  board[row][col] = 'X';
  renderBoard();
  highlightCell(row, col);

  if (checkWin('X')) {
    endGame('You win! 🎉');
    return;
  } else if (isBoardFull()) {
    endGame("It's a tie!");
    return;
  }

  currentPlayer = 'O';
  document.getElementById('game-status').textContent = 'AI is thinking...';
  setTimeout(makeAIMove, 500);
}

function endGame(message) {
  gameActive = false;
  document.getElementById('game-status').textContent = message;

  const s = stats[currentModeKey];
  s.gamesPlayed++;
  if (message.includes('You win')) {
    s.playerWins++;
    showPopup("You Win! 🎉", 'blue');
  }
  else if (message.includes('AI wins')) {
    s.aiWins++;
    showPopup("You Lose! 💀", 'red');
  }
  else {
    showPopup("It's a Tie 😐", 'gray');
  }

  saveStats();
  updateStatsUI(s);
}


function showPopup(message, color = 'blue') {
  const overlay = document.getElementById('popup-overlay');
  const box = document.getElementById('popup-box');
  const msg = document.getElementById('popup-message');

  msg.textContent = message;
  msg.className = `text-2xl font-bold mb-4 text-${color}-600`;
  overlay.classList.add('show');
  box.classList.add('show');

  generateParticles(color);
}

function hidePopup() {
  const overlay = document.getElementById('popup-overlay');
  const box = document.getElementById('popup-box');
  overlay.classList.remove('show');
  box.classList.remove('show');
  showMainMenu();
}

function generateParticles(color) {
  const overlay = document.getElementById('popup-overlay');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = `particle bg-${color}-500`;
    p.style.left = '50%';
    p.style.top = '50%';
    const angle = Math.random() * 2 * Math.PI;
    const distance = 80 + Math.random() * 40;
    p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    overlay.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}



function makeAIMove() {
  if (!gameActive || currentPlayer !== 'O') return;

  const depth = boardSize === 7 ? AI_DEPTH_7 : AI_DEPTH_13;
  const move = getBestMoveMinimax(board, depth, true);

  if (move && board[move.row][move.col] === null) {
    board[move.row][move.col] = 'O';
    renderBoard();
    highlightCell(move.row, move.col);

    if (checkWin('O')) {
      endGame('AI wins! 🤖');
    } else if (isBoardFull()) {
      endGame("It's a tie!");
    } else {
      currentPlayer = 'X';
      document.getElementById('game-status').textContent = 'Your turn (X)';
    }
  }
}

function getBestMoveMinimax(currentBoard, depth, isMaximizing) {
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMoves = [];
  const moves = getCandidateMoves(currentBoard);

  for (const { row, col } of moves) {
    currentBoard[row][col] = isMaximizing ? 'O' : 'X';
    const score = minimax(currentBoard, depth - 1, !isMaximizing, -Infinity, Infinity);
    currentBoard[row][col] = null;

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [{ row, col }];
      } else if (score === bestScore) {
        bestMoves.push({ row, col });
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMoves = [{ row, col }];
      } else if (score === bestScore) {
        bestMoves.push({ row, col });
      }
    }
  }

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return null;
}


function minimax(board, depth, isMaximizing, alpha, beta) {
  if (evaluateWinner(board, 'O')) return 100000; // kemenangan AI mutlak
  if (evaluateWinner(board, 'X')) return -100000; // kekalahan AI mutlak
  if (isBoardFull() || depth === 0) return evaluateBoard(board);

  const moves = getCandidateMoves(board);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const { row, col } of moves) {
      board[row][col] = 'O';
      const eval = minimax(board, depth - 1, false, alpha, beta);
      board[row][col] = null;
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const { row, col } of moves) {
      board[row][col] = 'X';
      const eval = minimax(board, depth - 1, true, alpha, beta);
      board[row][col] = null;
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function evaluateWinner(b, player) {
  return checkWin(player);
}

function checkWin(player) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] !== player) continue;

      for (const [dx, dy] of directions) {
        let win = true;
        const positions = [{ row: i, col: j }];

        for (let k = 1; k < WIN_CONDITION; k++) {
          const x = i + k * dx, y = j + k * dy;
          if (x < 0 || x >= boardSize || y < 0 || y >= boardSize || board[x][y] !== player) {
            win = false;
            break;
          }
          positions.push({ row: x, col: y });
        }

        if (win) return positions;
      }
    }
  }
  return null;
}
function highlightWinningCells(cells) {
  for (const { row, col } of cells) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    if (cell) cell.classList.add('winner-cell');
  }
}


function evaluateBoard(board) {
  if (evaluateWinner(board, 'O')) return 100000;
  if (evaluateWinner(board, 'X')) return -100000;

  const aiScore = scoreBoard(board, 'O');
  const playerScore = scoreBoard(board, 'X');
  const aiThreats = countThreats(board, 'O');
  const playerThreats = countThreats(board, 'X');

  return aiScore - playerScore + (aiThreats * 500) - (playerThreats * 400);
}

function scoreBoard(board, player) {
  let score = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  const max = board.length;

  for (let i = 0; i < max; i++) {
    for (let j = 0; j < max; j++) {
      for (const [dx, dy] of directions) {
        let count = 0, blocked = 0;
        for (let k = 0; k < WIN_CONDITION; k++) {
          const x = i + dx * k, y = j + dy * k;
          if (x >= 0 && y >= 0 && x < max && y < max) {
            if (board[x][y] === player) count++;
            else if (board[x][y] !== null) blocked++;
          } else blocked++;
        }

        if (count === 5) score += 10000;
        else if (count === 4 && blocked === 0) score += 1000;
        else if (count === 3 && blocked <= 1) score += 100;
        else if (count === 2 && blocked <= 1) score += 10;
        else if (count === 1 && blocked === 0) score += 1;
      }
    }
  }
  return score;
}

function getCandidateMoves(board) {
  const moves = [];
  const range = 1;
  const max = board.length;

  for (let i = 0; i < max; i++) {
    for (let j = 0; j < max; j++) {
      if (board[i][j] !== null) continue;

      let hasNeighbor = false;
      outer: for (let di = -range; di <= range; di++) {
        for (let dj = -range; dj <= range; dj++) {
          const ni = i + di, nj = j + dj;
          if (ni >= 0 && nj >= 0 && ni < max && nj < max && board[ni][nj] !== null) {
            hasNeighbor = true;
            break outer;
          }
        }
      }

      if (hasNeighbor) moves.push({ row: i, col: j });
    }
  }

  if (moves.length === 0) {
    const center = Math.floor(board.length / 2);
    moves.push({ row: center, col: center });
  }

  return moves;
}

function isBoardFull() {
  return board.every(row => row.every(cell => cell !== null));
}

function countThreats(board, player) {
  let count = 0;
  const directions = [[0,1],[1,0],[1,1],[1,-1]];
  const max = board.length;

  for (let i = 0; i < max; i++) {
    for (let j = 0; j < max; j++) {
      if (board[i][j] !== null) continue;

      let threats = 0;
      board[i][j] = player;

      for (const [dx, dy] of directions) {
        let line = '';
        for (let k = -4; k <= 4; k++) {
          const x = i + k * dx;
          const y = j + k * dy;
          line += (x < 0 || y < 0 || x >= max || y >= max) ? ' ' : (board[x][y] || '.');
        }

        if (line.includes(`${player}${player}${player}${player}.`) || line.includes(`.${player}${player}${player}${player}`)) {
          threats++;
        }
      }

      board[i][j] = null;
      if (threats >= 2) count++;
    }
  }

  return count;
}
function restartGame() {
  startGame(boardSize, playerFirst);
}

// UI Controls
function showMainMenu() {
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('game-container').classList.add('hidden');
}

function showAbout() {
  document.getElementById('about-modal').classList.remove('hidden');
}

function hideAbout() {
  document.getElementById('about-modal').classList.add('hidden');
}
function showRestartConfirm() {
  document.getElementById('restart-modal').classList.remove('hidden');
}

function hideRestartConfirm() {
  document.getElementById('restart-modal').classList.add('hidden');
}
function showResetStatsConfirm() {
  document.getElementById('reset-stats-modal').classList.remove('hidden');
}

function hideResetStatsConfirm() {
  document.getElementById('reset-stats-modal').classList.add('hidden');
}

function confirmResetStats() {
  stats = {
    "7x7_player": { playerWins: 0, aiWins: 0, gamesPlayed: 0 },
    "7x7_ai":     { playerWins: 0, aiWins: 0, gamesPlayed: 0 },
    "13x13_player": { playerWins: 0, aiWins: 0, gamesPlayed: 0 },
    "13x13_ai":     { playerWins: 0, aiWins: 0, gamesPlayed: 0 }
  };
  saveStats();
  if (currentModeKey) updateStatsUI(stats[currentModeKey]);
  hideResetStatsConfirm();
  alert("All stats have been reset.");
}
async function exportStats() {
  const encoder = new TextEncoder();
  const salt = 'SuperSecretSalt123!'; // Jangan ubah ini kalau mau validasi ulang
  const jsonData = JSON.stringify(stats);
  const data = encoder.encode(jsonData + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const output = {
    stats,
    hash: hashHex
  };

  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tic_tac_toe_stats_export.json';
  a.click();
  URL.revokeObjectURL(url);
}

function confirmRestart() {
  hideRestartConfirm();
  // animasi fade-out board
  const gameContainer = document.getElementById('game-container');
  gameContainer.classList.add('opacity-0', 'transition-opacity', 'duration-300');
  
  setTimeout(() => {
    restartGame();
    gameContainer.classList.remove('opacity-0');
  }, 300);
}

// DOM Setup
document.addEventListener('DOMContentLoaded', () => {
  loadStats(); // ← tambahkan ini
  document.getElementById('btn-7x7').addEventListener('click', () => startGame(7, true));
  document.getElementById('btn-7x7-ai').addEventListener('click', () => startGame(7, false));
  document.getElementById('btn-13x13').addEventListener('click', () => startGame(13, true));
  document.getElementById('btn-13x13-ai').addEventListener('click', () => startGame(13, false));
  document.getElementById('btn-about').addEventListener('click', showAbout);
});
