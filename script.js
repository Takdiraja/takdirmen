const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".game-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((btn) => btn.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.game).classList.add("active");
  });
});

// =====================
// MINESWEEPER
// =====================
const mineConfig = {
  x: 9,
  y: 9,
  mineCount: 10
};

const mineBoardEl = document.getElementById("mineBoard");
const mineStatusEl = document.getElementById("mineStatus");

let mineBoard = [];
let mineHistory = [];
let mineGameOver = false;

function saveMineHistory() {
  mineHistory.push({
    board: JSON.parse(JSON.stringify(mineBoard)),
    gameOver: mineGameOver,
    status: mineStatusEl.textContent
  });
}

function undoMineMove() {
  if (mineHistory.length === 0) {
    mineStatusEl.textContent = "Belum ada langkah untuk di-undo.";
    return;
  }

  const last = mineHistory.pop();
  mineBoard = last.board;
  mineGameOver = last.gameOver;
  mineStatusEl.textContent = last.status;
  drawMineBoard();
}

function restartMinesweeper() {
  mineBoard = [];
  mineHistory = [];
  mineGameOver = false;
  mineStatusEl.textContent = "Klik kiri untuk buka, klik kanan untuk flag.";

  for (let y = 0; y < mineConfig.y; y++) {
    mineBoard[y] = [];
    for (let x = 0; x < mineConfig.x; x++) {
      mineBoard[y][x] = {
        mine: false,
        open: false,
        flag: false,
        number: 0
      };
    }
  }

  let placed = 0;
  while (placed < mineConfig.mineCount) {
    const x = Math.floor(Math.random() * mineConfig.x);
    const y = Math.floor(Math.random() * mineConfig.y);

    if (!mineBoard[y][x].mine) {
      mineBoard[y][x].mine = true;
      placed++;
    }
  }

  for (let y = 0; y < mineConfig.y; y++) {
    for (let x = 0; x < mineConfig.x; x++) {
      mineBoard[y][x].number = countMinesAround(x, y);
    }
  }

  drawMineBoard();
}

function countMinesAround(cx, cy) {
  let count = 0;

  for (let y = cy - 1; y <= cy + 1; y++) {
    for (let x = cx - 1; x <= cx + 1; x++) {
      if (mineBoard[y] && mineBoard[y][x] && mineBoard[y][x].mine) {
        count++;
      }
    }
  }

  return count;
}

function drawMineBoard() {
  mineBoardEl.innerHTML = "";

  for (let y = 0; y < mineConfig.y; y++) {
    for (let x = 0; x < mineConfig.x; x++) {
      const cell = mineBoard[y][x];
      const div = document.createElement("div");

      div.className = "mine-cell";

      if (cell.open) {
        div.classList.add("open");

        if (cell.mine) {
          div.classList.add("mine");
          div.textContent = "💣";
        } else if (cell.number > 0) {
          div.textContent = cell.number;
          div.classList.add("n" + cell.number);
        }
      }

      if (cell.flag && !cell.open) {
        div.classList.add("flag");
        div.textContent = "🚩";
      }

      div.addEventListener("click", () => openMineCell(x, y));
      div.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        toggleMineFlag(x, y);
      });

      mineBoardEl.appendChild(div);
    }
  }
}

function openMineCell(x, y) {
  if (mineGameOver) return;

  const cell = mineBoard[y][x];
  if (cell.open || cell.flag) return;

  saveMineHistory();
  cell.open = true;

  if (cell.mine) {
    mineGameOver = true;
    revealMines();
    mineStatusEl.textContent = "BOOM! Kamu kalah. Pakai Undo kalau mau mundur.";
    drawMineBoard();
    return;
  }

  if (cell.number === 0) {
    openEmptyMineArea(x, y);
  }

  checkMineWin();
  drawMineBoard();
}

function openEmptyMineArea(x, y) {
  for (let yy = y - 1; yy <= y + 1; yy++) {
    for (let xx = x - 1; xx <= x + 1; xx++) {
      if (mineBoard[yy] && mineBoard[yy][xx]) {
        const cell = mineBoard[yy][xx];

        if (!cell.open && !cell.flag && !cell.mine) {
          cell.open = true;

          if (cell.number === 0) {
            openEmptyMineArea(xx, yy);
          }
        }
      }
    }
  }
}

function toggleMineFlag(x, y) {
  if (mineGameOver) return;

  const cell = mineBoard[y][x];
  if (cell.open) return;

  saveMineHistory();
  cell.flag = !cell.flag;
  drawMineBoard();
}

function revealMines() {
  for (let y = 0; y < mineConfig.y; y++) {
    for (let x = 0; x < mineConfig.x; x++) {
      if (mineBoard[y][x].mine) {
        mineBoard[y][x].open = true;
      }
    }
  }
}

function checkMineWin() {
  let opened = 0;

  for (let y = 0; y < mineConfig.y; y++) {
    for (let x = 0; x < mineConfig.x; x++) {
      if (mineBoard[y][x].open) opened++;
    }
  }

  if (opened === mineConfig.x * mineConfig.y - mineConfig.mineCount) {
    mineGameOver = true;
    mineStatusEl.textContent = "Kamu menang! Semua bom berhasil dihindari.";
  }
}

// =====================
// COLOR COUNT
// =====================
const colorConfig = {
  time: 5000,
  answerTime: 5000,
  amount: 5,
  maxCount: 6,
  x: 10,
  y: 10
};

const colorList = [
  { name: "biru", className: "blue" },
  { name: "hijau", className: "green" },
  { name: "kuning", className: "yellow" }
];

const ccTitleEl = document.getElementById("ccTitle");
const ccRoundEl = document.getElementById("ccRound");
const ccScoreEl = document.getElementById("ccScore");
const colorBoardEl = document.getElementById("colorBoard");
const ccQuestionEl = document.getElementById("ccQuestion");
const ccAnswersEl = document.getElementById("ccAnswers");
const ccTimerBar = document.getElementById("ccTimerBar");

let ccRound = 1;
let ccScore = 0;
let colorCells = [];
let targetColor = null;
let correctAnswer = 0;
let answerTimer = null;
let phaseTimer = null;

function startColorCount() {
  clearTimeout(answerTimer);
  clearTimeout(phaseTimer);
  ccRound = 1;
  ccScore = 0;
  ccScoreEl.textContent = ccScore;
  nextColorRound();
}

function nextColorRound() {
  clearTimeout(answerTimer);
  clearTimeout(phaseTimer);

  if (ccRound > colorConfig.amount) {
    finishColorCount();
    return;
  }

  ccTitleEl.textContent = "REMEMBER";
  ccRoundEl.textContent = `${ccRound} / ${colorConfig.amount}`;
  ccQuestionEl.textContent = "Ingat jumlah warna yang muncul.";
  ccAnswersEl.classList.remove("active");
  ccAnswersEl.innerHTML = "";

  generateColorBoard();
  drawColorBoard(false);
  startTimerBar(colorConfig.time);

  phaseTimer = setTimeout(() => {
    startAnswerPhase();
  }, colorConfig.time);
}

function generateColorBoard() {
  colorCells = [];

  for (let i = 0; i < colorConfig.x * colorConfig.y; i++) {
    colorCells.push({ color: null });
  }

  colorList.forEach((color) => {
    const count = randomNumber(1, colorConfig.maxCount);
    let placed = 0;

    while (placed < count) {
      const index = randomNumber(0, colorCells.length - 1);
      if (!colorCells[index].color) {
        colorCells[index].color = color;
        placed++;
      }
    }
  });

  targetColor = colorList[randomNumber(0, colorList.length - 1)];
  correctAnswer = colorCells.filter((cell) => cell.color && cell.color.name === targetColor.name).length;
}

function drawColorBoard(hideColors) {
  colorBoardEl.innerHTML = "";

  colorCells.forEach((cell) => {
    const div = document.createElement("div");
    div.className = "color-cell";

    if (cell.color) {
      div.classList.add(cell.color.className);
    }

    if (hideColors) {
      div.classList.add("hidden");
    }

    colorBoardEl.appendChild(div);
  });
}

function startAnswerPhase() {
  ccTitleEl.textContent = "ANSWER";
  drawColorBoard(true);
  ccQuestionEl.innerHTML = `Berapa jumlah kotak warna <b>${targetColor.name}</b>?`;

  ccAnswersEl.classList.add("active");
  ccAnswersEl.innerHTML = "";

  for (let i = 0; i <= colorConfig.maxCount; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.addEventListener("click", () => answerColorCount(i));
    ccAnswersEl.appendChild(button);
  }

  startTimerBar(colorConfig.answerTime);

  answerTimer = setTimeout(() => {
    ccQuestionEl.textContent = `Waktu habis! Jawaban benar: ${correctAnswer}`;
    ccAnswersEl.classList.remove("active");
    drawColorBoard(false);
    ccRound++;
    phaseTimer = setTimeout(nextColorRound, 1200);
  }, colorConfig.answerTime);
}

function answerColorCount(value) {
  clearTimeout(answerTimer);

  if (value === correctAnswer) {
    ccScore++;
    ccScoreEl.textContent = ccScore;
    ccQuestionEl.textContent = "Benar!";
  } else {
    ccQuestionEl.textContent = `Salah! Jawaban benar: ${correctAnswer}`;
  }

  ccAnswersEl.classList.remove("active");
  drawColorBoard(false);
  ccRound++;
  phaseTimer = setTimeout(nextColorRound, 1200);
}

function finishColorCount() {
  ccTitleEl.textContent = "FINISH";
  ccRoundEl.textContent = "Done";
  ccQuestionEl.textContent = `Skor akhir kamu: ${ccScore} / ${colorConfig.amount}`;
  ccAnswersEl.classList.remove("active");
  ccTimerBar.style.transition = "none";
  ccTimerBar.style.width = "0%";
}

function startTimerBar(duration) {
  ccTimerBar.style.transition = "none";
  ccTimerBar.style.width = "100%";

  setTimeout(() => {
    ccTimerBar.style.transition = `width ${duration}ms linear`;
    ccTimerBar.style.width = "0%";
  }, 30);
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =====================
// LAPTOP HACK (FLEECA)
// =====================
const thConfig = {
  rounds: 4, // Successes needed
  time: 30000, // Default time 30s
  squares: 6 // Default squares 6
};

const thColors = [
  { name: "BLACK", hex: "#000000", class: "black" },
  { name: "WHITE", hex: "#FFFFFF", class: "white" },
  { name: "BLUE", hex: "#2195ee", class: "blue" },
  { name: "RED", hex: "#7b0100", class: "red" },
  { name: "YELLOW", hex: "#fceb3d", class: "yellow" },
  { name: "ORANGE", hex: "#fd9802", class: "orange" },
  { name: "GREEN", hex: "#4cae4f", class: "green" },
  { name: "PURPLE", hex: "#9926ac", class: "purple" }
];

const thShapes = [
  { name: "SQUARE", class: "square" },
  { name: "TRIANGLE", class: "triangle" },
  { name: "RECTANGLE", class: "rectangle" },
  { name: "CIRCLE", class: "circle" }
];

const thQuestions = {
  'BACKGROUND COLOR': (d) => d.bg.name,
  'COLOR TEXT BACKGROUND COLOR': (d) => d.textColor.name,
  'SHAPE TEXT BACKGROUND COLOR': (d) => d.textShapeColor.name,
  'NUMBER COLOR': (d) => d.numberColor.name,
  'SHAPE COLOR': (d) => d.shapeFill.name,
  'COLOR TEXT': (d) => d.textColorName.name,
  'SHAPE TEXT': (d) => d.textShapeName.name,
  'SHAPE': (d) => d.shape.name
};

const thTitleEl = document.getElementById("thTitle");
const thRoundEl = document.getElementById("thRound");
const thStatusEl = document.getElementById("thStatus");
const thBoardEl = document.getElementById("terminalBoard");
const thQuestionEl = document.getElementById("thQuestion");
const thInputEl = document.getElementById("thInput");
const thTimerBar = document.getElementById("thTimerBar");
const thStartBtn = document.getElementById("thStartBtn");

let thCurrentRound = 1;
let thActive = false;
let thTimer = null;
let thCorrectAnswer = "";
let thGridData = [];
let thDisplayNums = [];

async function startTerminalHack() {
  thCurrentRound = 1;
  thActive = true;
  thStartBtn.disabled = true;
  thInputEl.disabled = false;
  thInputEl.value = "";
  thStatusEl.textContent = "IN PROGRESS";
  thStatusEl.className = "th-success";
  
  nextTerminalRound();
}

async function nextTerminalRound() {
  if (thCurrentRound > thConfig.rounds) {
    finishTerminalHack(true);
    return;
  }

  thRoundEl.textContent = `${thCurrentRound} / ${thConfig.rounds}`;
  thTitleEl.textContent = "ATTEMPTING BYPASS...";
  thQuestionEl.textContent = "Remember the numbers...";
  thInputEl.value = "";
  thInputEl.disabled = true;
  thTimerBar.style.width = "0%";

  generateLaptopData();
  
  // Phase 1: Show Numbers
  await showLaptopNumbers();
  
  // Phase 2: Show Puzzles
  thInputEl.disabled = false;
  thInputEl.focus();
  drawLaptopGrid();
  generateLaptopQuestion();
  startThTimer();
}

function generateLaptopData() {
  thGridData = [];
  // Generate a shuffled array of numbers from 1 up to the number of squares
  const availableNums = [];
  for(let i = 1; i <= thConfig.squares; i++) availableNums.push(i);
  thDisplayNums = shuffleArray(availableNums);
  
  for (let i = 0; i < thConfig.squares; i++) {
    const bg = thColors[randomNumber(0, thColors.length - 1)];
    const shape = thShapes[randomNumber(0, thShapes.length - 1)];
    const shapeFill = thColors[randomNumber(0, thColors.length - 1)];
    const textColorName = thColors[randomNumber(0, thColors.length - 1)];
    const textColor = thColors[randomNumber(0, thColors.length - 1)];
    const textShapeName = thShapes[randomNumber(0, thShapes.length - 1)];
    const textShapeColor = thColors[randomNumber(0, thColors.length - 1)];
    const numberColor = thColors[randomNumber(0, thColors.length - 1)];
    const numberValue = randomNumber(1, 9);
    
    thGridData.push({
      bg, shape, shapeFill, textColorName, textColor, 
      textShapeName, textShapeColor, numberColor, numberValue,
      displayNum: thDisplayNums[i]
    });
  }
}

async function showLaptopNumbers() {
  thBoardEl.innerHTML = "";
  thGridData.forEach(data => {
    const square = document.createElement("div");
    square.className = "laptop-square number-phase";
    square.textContent = data.displayNum;
    thBoardEl.appendChild(square);
  });

  await delayMs(1500);
  const squares = document.querySelectorAll(".laptop-square");
  squares.forEach(sq => sq.classList.add("shrinking"));
  await delayMs(1000);
}

function drawLaptopGrid() {
  thBoardEl.innerHTML = "";
  thGridData.forEach(data => {
    const square = document.createElement("div");
    square.className = `laptop-square`;
    square.style.backgroundColor = data.bg.hex;
    
    const svg = `
      <svg viewBox="0 0 150 150">
        ${getShapeSvg(data.shape.class, data.shapeFill.hex)}
        ${getTextSvg(data.textColorName.name, data.textColor.hex, 31)}
        ${getTextSvg(data.textShapeName.name, data.textShapeColor.hex, 67)}
        ${getTextSvg(data.numberValue, data.numberColor.hex, 50, 60, "Arial")}
      </svg>
    `;
    
    square.innerHTML = svg;
    thBoardEl.appendChild(square);
  });
}

function getShapeSvg(type, color) {
  switch(type) {
    case 'square': return `<rect fill="${color}" stroke="#000" stroke-width="1" width="150" height="150"/>`;
    case 'triangle': return `<polygon fill="${color}" stroke="#000" stroke-width="1" points="0 150 75 0 150 150 0 150"/>`;
    case 'rectangle': return `<rect y="30" fill="${color}" stroke="#000" stroke-width="1" width="150" height="90"/>`;
    case 'circle': return `<circle fill="${color}" stroke="#000" stroke-width="1" cx="75" cy="75" r="75"/>`;
    default: return '';
  }
}

function getTextSvg(text, color, y, size = 21, font = "Inter") {
  return `
    <text stroke="black" fill="${color}" stroke-width="0.5" 
      style="font-size:${size}px;" font-weight="900" font-family="${font}, sans-serif" 
      x="50%" y="${y}%" dominant-baseline="middle" text-anchor="middle">
      ${text}
    </text>
  `;
}

function generateLaptopQuestion() {
  const qKeys = Object.keys(thQuestions);
  const q1Key = qKeys[randomNumber(0, qKeys.length - 1)];
  const q2Key = qKeys[randomNumber(0, qKeys.length - 1)];
  
  // Choose random numbers from the ones currently displayed
  const num1 = thDisplayNums[randomNumber(0, thDisplayNums.length - 1)];
  const num2 = thDisplayNums[randomNumber(0, thDisplayNums.length - 1)];
  
  const target1 = thGridData.find(d => d.displayNum === num1);
  const target2 = thGridData.find(d => d.displayNum === num2);
  
  const a1 = thQuestions[q1Key](target1);
  const a2 = thQuestions[q2Key](target2);
  
  thQuestionEl.textContent = `${q1Key} (${num1}) AND ${q2Key} (${num2})`;
  thCorrectAnswer = `${a1} ${a2}`.toLowerCase();
}

function startThTimer() {
  clearTimeout(thTimer);
  thTimerBar.style.transition = "none";
  thTimerBar.style.width = "100%";

  setTimeout(() => {
    thTimerBar.style.transition = `width ${thConfig.time}ms linear`;
    thTimerBar.style.width = "0%";
  }, 30);

  thTimer = setTimeout(() => {
    finishTerminalHack(false, "TIME EXPIRED");
  }, thConfig.time);
}

function finishTerminalHack(success, reason = "") {
  thActive = false;
  clearTimeout(thTimer);
  thInputEl.disabled = true;
  thStartBtn.disabled = false;
  
  if (success) {
    thTitleEl.textContent = "SYSTEM BYPASSED";
    thQuestionEl.textContent = "Access granted.";
    thStatusEl.textContent = "SUCCESS";
    thStatusEl.className = "th-success";
  } else {
    thTitleEl.textContent = "ACCESS DENIED";
    thQuestionEl.innerHTML = `<span class="th-error">${reason}</span>`;
    thStatusEl.textContent = "FAILED";
    thStatusEl.className = "th-error";
  }
}

thInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && thActive) {
    const val = thInputEl.value.trim().toLowerCase();
    if (val === thCorrectAnswer) {
      thCurrentRound++;
      nextTerminalRound();
    } else {
      finishTerminalHack(false, "WRONG SEQUENCE");
    }
  }
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function delayMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const thAmountRange = document.getElementById("thAmountRange");
const thAmountVal = document.getElementById("thAmountVal");
const thTimeRange = document.getElementById("thTimeRange");
const thTimeVal = document.getElementById("thTimeVal");

thAmountRange.addEventListener("input", () => {
  thConfig.squares = parseInt(thAmountRange.value);
  thAmountVal.textContent = thAmountRange.value;
});

thTimeRange.addEventListener("input", () => {
  thConfig.time = parseInt(thTimeRange.value) * 1000;
  thTimeVal.textContent = thTimeRange.value;
});

restartMinesweeper();
startColorCount();
