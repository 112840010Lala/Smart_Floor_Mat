// ===============================
// 遊戲開始時間
// ===============================
const gameStartTime = Date.now();

// ===============================
// 指令清單
// ===============================
const instructions = [
  { LR: "L", type: "Foot", img: "./img/footprint.png", color: "red" },
  { LR: "L", type: "Foot", img: "./img/footprint.png", color: "blue" },
  { LR: "L", type: "Foot", img: "./img/footprint.png", color: "green" },
  { LR: "L", type: "Foot", img: "./img/footprint.png", color: "orange" },
  { LR: "L", type: "Foot", img: "./img/footprint.png", color: "yellow" },
  { LR: "R", type: "Foot", img: "./img/footprint.png", color: "red" },
  { LR: "R", type: "Foot", img: "./img/footprint.png", color: "blue" },
  { LR: "R", type: "Foot", img: "./img/footprint.png", color: "green" },
  { LR: "R", type: "Foot", img: "./img/footprint.png", color: "orange" },
  { LR: "R", type: "Foot", img: "./img/footprint.png", color: "yellow" },
  { LR: "L", type: "Hand", img: "./img/hand.png", color: "red" },
  { LR: "L", type: "Hand", img: "./img/hand.png", color: "blue" },
  { LR: "L", type: "Hand", img: "./img/hand.png", color: "green" },
  { LR: "L", type: "Hand", img: "./img/hand.png", color: "orange" },
  { LR: "L", type: "Hand", img: "./img/hand.png", color: "yellow" },
  { LR: "R", type: "Hand", img: "./img/hand.png", color: "red" },
  { LR: "R", type: "Hand", img: "./img/hand.png", color: "blue" },
  { LR: "R", type: "Hand", img: "./img/hand.png", color: "green" },
  { LR: "R", type: "Hand", img: "./img/hand.png", color: "orange" },
  { LR: "R", type: "Hand", img: "./img/hand.png", color: "yellow" },
];

// ===============================
// Firebase 初始化
// ===============================
const firebaseConfig = {
    apiKey: "my API Key",
    authDomain: "smart-floor-mat.firebaseapp.com",
    databaseURL: "https://smart-floor-mat-default-rtdb.firebaseio.com",
    projectId: "smart-floor-mat",
    storageBucket: "smart-floor-mat.firebasestorage.app",
    messagingSenderId: "854162617207",
    appId: "1:854162617207:web:4e356938ef597628946772"
};
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const matPressRef = firebase.database().ref("mat_presses");

// ===============================
// 音效
// ===============================
const correctSound = new Audio("./audio/correct.mp3");
const wrongSound = new Audio("./audio/wrong.mp3");
const fallSound = new Audio("./audio/fall.mp3");
const alertSound = new Audio("./audio/warning.mp3");

// ===============================
// Seeded Random
// ===============================
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function shuffleWithSeed(array, seed) {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(s++) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===============================
// 生成顏色
// ===============================
function generateColors(totalCircles, availableColors, seed) {
  const colors = [];
  const maxPerColor = {};
  availableColors.forEach(color => {
    colors.push(color);
    maxPerColor[color] = 1 + Math.floor(seededRandom(seed++) * 2);
    maxPerColor[color]--;
  });
  let remaining = totalCircles - colors.length;
  while (remaining > 0) {
    const candidates = availableColors.filter(c => maxPerColor[c] > 0);
    if (candidates.length === 0) break;
    const randIndex = Math.floor(seededRandom(seed++) * candidates.length);
    const chosen = candidates[randIndex];
    colors.push(chosen);
    maxPerColor[chosen]--;
    remaining--;
  }
  while (colors.length < totalCircles) {
    const randIndex = Math.floor(seededRandom(seed++) * availableColors.length);
    colors.push(availableColors[randIndex]);
  }
  return colors;
}

// ===============================
// 隨機下一步動作
// ===============================
function nextMove() {
  const random = Math.floor(Math.random() * instructions.length);
  const step = instructions[random];
  document.getElementById("LR").innerText = step.LR;
  document.getElementById("HandFoot").src = step.img;
  document.getElementById("ColorDot").style.backgroundColor = step.color;
}

// ===============================
// 重新排列地墊顏色
// ===============================
function rearrangeMatColors() {
  const circles = document.querySelectorAll(".mat .circle");
  const availableColors = ["red","blue","green","orange","yellow"];
  const seed = Date.now();
  const newColors = generateColors(circles.length, availableColors, seed);
  const shuffledColors = shuffleWithSeed(newColors, seed);
  circles.forEach((circle, index) => circle.className = "circle " + shuffledColors[index]);
  localStorage.setItem("stepfit-mat-colors", JSON.stringify(shuffledColors));
  localStorage.setItem("stepfit-mat-seed", seed);
}

// ===============================
// alert 功能
// ===============================
const alertBox = document.getElementById("alertBox");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");
alertBox.style.display = "none"; // 初始隱藏

function showAlert() {
  alertBox.style.display = "block";

  // 10 秒自動 confirm
  const autoConfirm = setTimeout(() => {
    alertSound.currentTime = 0;
    alertSound.play().catch(()=>{});
    hideAlert();
  }, 10000);

  // Confirm 播音效
  confirmBtn.onclick = () => {
    clearTimeout(autoConfirm);
    alertSound.currentTime = 0;
    alertSound.play().catch(()=>{});
    hideAlert();
  };
  // Cancel 不播音效
  cancelBtn.onclick = () => {
    clearTimeout(autoConfirm);
    hideAlert();
  };
}

function hideAlert() {
  alertBox.style.display = "none";
}

// ===============================
// 主程式
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const circles = document.querySelectorAll(".mat .circle");
  const availableColors = ["red","blue","green","orange","yellow"];
  const totalCircles = circles.length;
  let seed, colors;
  let successCount = 0;

  if (sessionStorage.getItem("isRestart") === "1") {
    colors = JSON.parse(localStorage.getItem("stepfit-mat-colors"));
    seed = localStorage.getItem("stepfit-mat-seed");
    sessionStorage.removeItem("isRestart");
  } else {
    seed = Date.now();
    colors = generateColors(totalCircles, availableColors, seed);
    localStorage.setItem("stepfit-mat-colors", JSON.stringify(colors));
    localStorage.setItem("stepfit-mat-seed", seed);
  }

  let shuffledColors = shuffleWithSeed(colors, Number(seed));
  circles.forEach((circle, index) => circle.className = "circle " + shuffledColors[index]);
  nextMove();

  // 測試按鈕
  //const testBtn = document.getElementById("testAlertBtn");
 // if (testBtn) testBtn.addEventListener("click", showAlert);
});

// ===============================
// 踩踏監聽與邏輯
// ===============================
let pressedMatsSet = new Set();
let stepLocked = false;

matPressRef.on("child_added", snapshot => {
  const data = snapshot.val();
  if (!data) return;
  const ts = new Date(data.date).getTime();
  if (!ts || ts < gameStartTime) return;

  const matNumber = data.matNumber;
  if (!matNumber || stepLocked) return;

  pressedMatsSet.add(matNumber);

  highlightMat(matNumber);
  checkCorrectStep(matNumber);

  // 超過 4 個地墊觸發 alert
  if (pressedMatsSet.size > 4) {
    showAlert();
  }

  setTimeout(() => pressedMatsSet.delete(matNumber), 300);
});

function highlightMat(matNumber) {
  const target = document.querySelector(`.mat .circle[data-mat="${matNumber}"]`);
  if (!target) return;
  target.classList.add("pressed");
  setTimeout(() => target.classList.remove("pressed"), 300);
}

let successCount = 0;

function checkCorrectStep(matNumber) {
  const target = document.querySelector(`.mat .circle[data-mat="${matNumber}"]`);
  if (!target) return;

  const color = [...target.classList].find(c => ["red","blue","green","yellow","orange"].includes(c));
  const instructionColor = document.getElementById("ColorDot").style.backgroundColor;

  if (instructionColor === color) {
    // 踩對
    target.classList.add("correct");
    correctSound.currentTime = 0;
    correctSound.play();
    stepLocked = true;

    setTimeout(() => {
      target.classList.remove("correct");
      nextMove();
      stepLocked = false;

      // ✅ 每五個成功動作重新排列地墊顏色
      successCount++;
      if (successCount % 5 === 0) {
        rearrangeMatColors();
      }
    }, 500);
  } else {
    // 踩錯
    target.classList.add("wrong");
    wrongSound.currentTime = 0;
    wrongSound.play();
    setTimeout(() => target.classList.remove("wrong"), 500);
  }
}
