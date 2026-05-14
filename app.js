const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const installBtn = document.getElementById('installBtn');

const GRID_SIZE = 20;
const CELL_SIZE = 18;
let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameLoop = null;
let isPlaying = false;

let touchStartX = 0;
let touchStartY = 0;

highScoreEl.textContent = highScore;

function resizeCanvas() {
  const gameArea = canvas.parentElement;
  const size = Math.min(gameArea.clientWidth - 20, gameArea.clientHeight - 20);
  canvas.width = size;
  canvas.height = size;
}

function initGame() {
  snake = [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = score;
  spawnFood();
}

function spawnFood() {
  const gridWidth = Math.floor(canvas.width / CELL_SIZE);
  const gridHeight = Math.floor(canvas.height / CELL_SIZE);
  
  let validPosition = false;
  while (!validPosition) {
    food.x = Math.floor(Math.random() * gridWidth);
    food.y = Math.floor(Math.random() * gridHeight);
    validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
}

function draw() {
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'rgba(0, 255, 170, 0.03)';
  for (let i = 0; i < canvas.width; i += CELL_SIZE) {
    ctx.fillRect(i, 0, 1, canvas.height);
  }
  for (let i = 0; i < canvas.height; i += CELL_SIZE) {
    ctx.fillRect(0, i, canvas.width, 1);
  }
  
  const glowGradient = ctx.createRadialGradient(
    food.x * CELL_SIZE + CELL_SIZE / 2,
    food.y * CELL_SIZE + CELL_SIZE / 2,
    0,
    food.x * CELL_SIZE + CELL_SIZE / 2,
    food.y * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE
  );
  glowGradient.addColorStop(0, 'rgba(255, 0, 170, 0.4)');
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(
    food.x * CELL_SIZE - CELL_SIZE / 2,
    food.y * CELL_SIZE - CELL_SIZE / 2,
    CELL_SIZE * 2,
    CELL_SIZE * 2
  );
  
  ctx.fillStyle = '#ff00aa';
  ctx.beginPath();
  ctx.arc(
    food.x * CELL_SIZE + CELL_SIZE / 2,
    food.y * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const alpha = 1 - (index / snake.length) * 0.5;
    
    if (isHead) {
      ctx.fillStyle = '#00cc88';
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = `rgba(0, 255, 170, ${alpha})`;
      ctx.shadowBlur = 0;
    }
    
    const radius = isHead ? 6 : 5;
    ctx.beginPath();
    ctx.roundRect(
      segment.x * CELL_SIZE + 2,
      segment.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
      radius
    );
    ctx.fill();
    
    if (isHead) {
      const eyeOffsetX = direction.x * 3;
      const eyeOffsetY = direction.y * 3;
      ctx.fillStyle = '#0a0a0f';
      ctx.beginPath();
      ctx.arc(
        segment.x * CELL_SIZE + CELL_SIZE / 2 + eyeOffsetX - 2 + direction.y * 2,
        segment.y * CELL_SIZE + CELL_SIZE / 2 + eyeOffsetY - direction.x * 2,
        2,
        0,
        Math.PI * 2
      );
      ctx.arc(
        segment.x * CELL_SIZE + CELL_SIZE / 2 + eyeOffsetX + 2 - direction.y * 2,
        segment.y * CELL_SIZE + CELL_SIZE / 2 + eyeOffsetY + direction.x * 2,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    ctx.shadowBlur = 0;
  });
}

function update() {
  direction = { ...nextDirection };
  
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  
  const gridWidth = Math.floor(canvas.width / CELL_SIZE);
  const gridHeight = Math.floor(canvas.height / CELL_SIZE);
  
  if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
    gameOver();
    return;
  }
  
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }
  
  snake.unshift(head);
  
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    spawnFood();
  } else {
    snake.pop();
  }
}

function gameOver() {
  isPlaying = false;
  clearInterval(gameLoop);
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore);
    highScoreEl.textContent = highScore;
  }
  
  finalScoreEl.textContent = score;
  gameOverOverlay.classList.remove('hidden');
}

function startGame() {
  initGame();
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  isPlaying = true;
  gameLoop = setInterval(() => {
    update();
    draw();
  }, 120);
}

document.addEventListener('keydown', (e) => {
  if (!isPlaying) return;
  
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
      break;
  }
});

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (!isPlaying) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  const minSwipe = 30;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > minSwipe && direction.x !== -1) {
      nextDirection = { x: 1, y: 0 };
    } else if (deltaX < -minSwipe && direction.x !== 1) {
      nextDirection = { x: -1, y: 0 };
    }
  } else {
    if (deltaY > minSwipe && direction.y !== -1) {
      nextDirection = { x: 0, y: 1 };
    } else if (deltaY < -minSwipe && direction.y !== 1) {
      nextDirection = { x: 0, y: -1 };
    }
  }
}, { passive: true });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
initGame();
draw();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log('Service Worker 已註冊');
  }).catch(err => {
    console.log('Service Worker 註冊失敗:', err);
  });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = 'none';
  }
});