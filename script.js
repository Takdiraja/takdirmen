const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".game-panel");
let ccHasStarted = false;

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((btn) => btn.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    tab.classList.add("active");
    const gameId = tab.dataset.game;
    document.getElementById(gameId).classList.add("active");

    if (gameId === 'colorcount' && !ccHasStarted) {
      ccHasStarted = true;
      startColorCount();
    }
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
    mineStatusEl.textContent = "Belum ada langkah untuk dikembalikan.";
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
  mineStatusEl.textContent = "Klik kiri untuk buka, klik kanan untuk tandai.";

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
    mineStatusEl.textContent = "BOOM! Kamu kalah. Klik Kembali jika ingin membatalkan.";
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
    mineStatusEl.textContent = "Kamu menang! Semua bom berhasil dijinakkan.";
  }
}

// =====================
// COLOR COUNT
// =====================
const colorConfig = {
  time: 5000,
  answerTime: 5000,
  amount: 5,
  minCount: 3,
  maxCount: 3,
  x: 10,
  y: 10
};

const colorList = [
  { name: "BLUE", className: "blue" },
  { name: "GREEN", className: "green" },
  { name: "YELLOW", className: "yellow" }
];

const ccTitleEl = document.getElementById("ccTitle");
const ccRoundEl = document.getElementById("ccRound");
const ccScoreEl = document.getElementById("ccScore");
const colorBoardEl = document.getElementById("colorBoard");
const ccQuestionEl = document.getElementById("ccQuestion");
const ccInputEl = document.getElementById("ccInput");
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
  if (ccScoreEl) ccScoreEl.textContent = ccScore;
  if (ccInputEl) ccInputEl.style.opacity = "1";

  ccHasStarted = true;
  showColorCountCountdown(3);
}

function showColorCountCountdown(count) {
  document.getElementById("ccGridWrapper").style.display = "flex";
  document.getElementById("ccAnswerWrapper").style.display = "none";
  colorBoardEl.innerHTML = "";
  ccRoundEl.textContent = `0 / ${colorConfig.amount}`;

  if (count > 0) {
    ccTitleEl.textContent = `BERSIAP: ${count}...`;
    phaseTimer = setTimeout(() => {
      showColorCountCountdown(count - 1);
    }, 1000);
  } else {
    nextColorRound();
  }
}

function nextColorRound() {
  clearTimeout(answerTimer);
  clearTimeout(phaseTimer);

  if (ccRound > colorConfig.amount) {
    finishColorCount();
    return;
  }

  ccTitleEl.textContent = "INGATLAH";
  ccRoundEl.textContent = `${ccRound} / ${colorConfig.amount}`;

  document.getElementById("ccGridWrapper").style.display = "flex";
  document.getElementById("ccAnswerWrapper").style.display = "none";

  if (ccInputEl) {
    ccInputEl.disabled = true;
    ccInputEl.value = "";
  }

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

  const selectedColors = [...colorList];

  const validCombinations = [
    [3, 4, 6], [3, 6, 4], [4, 3, 6], [4, 6, 3], [6, 3, 4], [6, 4, 3],
    [3, 5, 5], [5, 3, 5], [5, 5, 3],
    [4, 4, 5], [4, 5, 4], [5, 4, 4]
  ];
  const counts = validCombinations[randomNumber(0, validCombinations.length - 1)];

  selectedColors.forEach((color, idx) => {
    let placed = 0;
    while (placed < counts[idx]) {
      const index = randomNumber(0, colorCells.length - 1);
      if (!colorCells[index].color) {
        colorCells[index].color = color;
        placed++;
      }
    }
  });

  targetColor = selectedColors[randomNumber(0, selectedColors.length - 1)];
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
  ccTitleEl.textContent = "JAWABLAH";
  document.getElementById("ccGridWrapper").style.display = "none";
  document.getElementById("ccAnswerWrapper").style.display = "flex";

  ccQuestionEl.textContent = `ADA BERAPA KOTAK WARNA ${targetColor.name}?`;

  if (ccInputEl) {
    ccInputEl.disabled = false;
    ccInputEl.value = "";
    setTimeout(() => { ccInputEl.focus(); }, 10);
  }

  startTimerBar(colorConfig.answerTime);

  answerTimer = setTimeout(() => {
    ccQuestionEl.textContent = `WAKTU HABIS! JAWABANNYA ${correctAnswer}`;
    if (ccInputEl) ccInputEl.disabled = true;
    ccRound++;
    phaseTimer = setTimeout(nextColorRound, 1200);
  }, colorConfig.answerTime);
}

if (ccInputEl) {
  ccInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !ccInputEl.disabled) {
      const val = parseInt(ccInputEl.value.trim());
      if (!isNaN(val)) answerColorCount(val);
    }
  });
}

function answerColorCount(value) {
  clearTimeout(answerTimer);
  if (ccInputEl) ccInputEl.disabled = true;

  if (value === correctAnswer) {
    ccScore++;
    if (ccScoreEl) ccScoreEl.textContent = ccScore;
    ccQuestionEl.textContent = "BENAR!";
  } else {
    ccQuestionEl.textContent = `SALAH! JAWABANNYA ${correctAnswer}`;
  }

  ccRound++;
  phaseTimer = setTimeout(nextColorRound, 1200);
}

function finishColorCount() {
  ccTitleEl.textContent = "SELESAI";
  document.getElementById("ccGridWrapper").style.display = "none";
  document.getElementById("ccAnswerWrapper").style.display = "flex";

  ccRoundEl.textContent = "SELESAI";
  ccQuestionEl.textContent = `SKOR: ${ccScore} / ${colorConfig.amount}`;
  if (ccInputEl) {
    ccInputEl.disabled = true;
    ccInputEl.style.opacity = "0";
  }
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
  rounds: 4,
  time: 30000,
  squares: 6
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

const thBoardEl = document.getElementById("thGrid");
const thQuestionEl = document.getElementById("thQuestion");
const thInputEl = document.getElementById("thInput");
const thTimerBar = document.getElementById("thTimerBar");

let thCurrentRound = 1;
let thActive = false;
let thTimer = null;
let thCorrectAnswer = "";
let thGridData = [];
let thDisplayNums = [];

function showThScreen(screenId) {
  document.querySelectorAll('#laptopHack .th-screen').forEach(el => el.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function showThStartScreen() {
  showThScreen('thStartScreen');
}

function initHackerman() {
  let amount = parseInt(document.getElementById("thAmount").value);
  let timeStr = parseInt(document.getElementById("thTime").value);

  if (isNaN(amount) || amount < 1) amount = 1;
  if (amount > 8) amount = 8;

  if (isNaN(timeStr) || timeStr < 3) timeStr = 3;
  if (timeStr > 60) timeStr = 60;

  thConfig.squares = amount;
  thConfig.time = timeStr * 1000;

  showThScreen('thLoadingScreen');
  setTimeout(() => {
    startTerminalHack();
  }, 2000);
}

async function startTerminalHack() {
  thCurrentRound = 1;
  thActive = true;
  thInputEl.disabled = false;
  thInputEl.value = "";

  showThScreen('thGameScreen');
  nextTerminalRound();
}

async function nextTerminalRound() {
  if (thCurrentRound > thConfig.rounds) {
    finishTerminalHack(true);
    return;
  }

  const thRoundEl = document.getElementById("thRound");
  thRoundEl.textContent = `${thCurrentRound} / ${thConfig.rounds}`;
  thQuestionEl.textContent = "Hafalkan angka-angkanya...";
  thInputEl.value = "";
  thInputEl.disabled = true;
  thTimerBar.style.width = "0%";

  const thTimeLeft = document.getElementById("thTimeLeft");
  thTimeLeft.textContent = `${thConfig.time / 1000}s`;

  generateLaptopData();

  await showLaptopNumbers();

  thInputEl.disabled = false;
  thInputEl.focus();
  drawLaptopGrid();
  generateLaptopQuestion();
  startThTimer();
}

function generateLaptopData() {
  thGridData = [];
  const availableNums = [];
  for (let i = 1; i <= thConfig.squares; i++) availableNums.push(i);
  thDisplayNums = shuffleArray(availableNums);

  for (let i = 0; i < thConfig.squares; i++) {
    const bg = thColors[randomNumber(0, thColors.length - 1)];
    const shape = thShapes[randomNumber(0, thShapes.length - 1)];

    let shapeFill = thColors[randomNumber(0, thColors.length - 1)];
    while (shapeFill.name === bg.name) {
      shapeFill = thColors[randomNumber(0, thColors.length - 1)];
    }

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
  switch (type) {
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
  const num1 = thDisplayNums[randomNumber(0, thDisplayNums.length - 1)];
  const target1 = thGridData.find(d => d.displayNum === num1);
  const a1 = thQuestions['SHAPE'](target1);

  if (thDisplayNums.length === 1) {
    thQuestionEl.textContent = `SHAPE (${num1})`;
    thCorrectAnswer = `${a1}`.toLowerCase();
  } else {
    let num2 = thDisplayNums[randomNumber(0, thDisplayNums.length - 1)];
    while (num2 === num1) {
      num2 = thDisplayNums[randomNumber(0, thDisplayNums.length - 1)];
    }
    const target2 = thGridData.find(d => d.displayNum === num2);
    const a2 = thQuestions['SHAPE'](target2);

    thQuestionEl.textContent = `SHAPE (${num1}) AND SHAPE (${num2})`;
    thCorrectAnswer = `${a1} ${a2}`.toLowerCase();
  }
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
  showThScreen('thEndScreen');

  const title = document.getElementById('thEndTitle');
  const subtext = document.getElementById('thEndSubtext');
  const icon = document.getElementById('thEndIcon');

  if (success) {
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="#4caf50" width="80" height="80"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    title.textContent = "AKSES DITERIMA";
    title.style.color = "#4caf50";
    subtext.textContent = "Anda berhasil menembus keamanan sistem.";
  } else {
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="#ff5252" width="80" height="80"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>`;
    title.textContent = "SISTEM MENOLAK JAWABAN ANDA";
    title.style.color = "#ffffff";

    let endMessage = reason === "TIME EXPIRED" ? "Waktu Anda habis" : "Jawaban salah";
    subtext.innerHTML = `${endMessage}, jawaban benarnya: "${thCorrectAnswer}"<br><br><span style="color: #8a9ba8; font-size: 14px;">Terlalu cepat? Berlatihlah dengan menambah waktunya!</span>`;
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



// Let only Minesweeper auto start on load
restartMinesweeper();
