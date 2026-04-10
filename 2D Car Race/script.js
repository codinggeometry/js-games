const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// Lanes
const lanes = [90, 180, 270];

// Player
const player = {
  lane: 1,
  y: 480,
  width: 50,
  height: 90,
  color: "#00ffcc"
};

// Enemies
let enemies = [];
let colors = ["#ff3c3c", "#ffd93c", "#3c8cff", "#ff6ec7", "#00e6a8"];

let speed = 5;
let score = 0;
let gameOver = false;

// Controls
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" && player.lane > 0) player.lane--;
  if (e.key === "ArrowRight" && player.lane < 2) player.lane++;
});

// Restart
document.addEventListener("keydown", e => {
  if (e.code === "Space" && gameOver) restartGame();
});

// Spawn
function spawnEnemy() {
  if (gameOver) return;

  let r = Math.random();

  if (r < 0.7) {
    enemies.push(createEnemy(randomLane()));
  } 
  else if (r < 0.95) {
    let lanesCopy = shuffle([0,1,2]).slice(0,2);
    lanesCopy.forEach(l => enemies.push(createEnemy(l)));
  } 
  else {
    let blocked = shuffle([0,1,2]).slice(0,2);
    blocked.forEach(l => enemies.push(createEnemy(l)));
  }
}

function randomLane() {
  return Math.floor(Math.random() * 3);
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function createEnemy(lane) {
  return {
    lane: lane,
    y: -100,
    width: 50,
    height: 90,
    color: colors[Math.floor(Math.random() * colors.length)]
  };
}

// Draw Car
function drawCar(car, isPlayer=false) {
  let x = lanes[car.lane];

  if (isPlayer) {
    ctx.shadowColor = "#00ffcc";
    ctx.shadowBlur = 25;
  } else ctx.shadowBlur = 0;

  ctx.fillStyle = car.color;
  ctx.fillRect(x, car.y, car.width, car.height);

  ctx.fillStyle = "#111";
  ctx.fillRect(x+8, car.y+10, 34, 20);
  ctx.fillRect(x+8, car.y+60, 34, 15);

  ctx.fillStyle = "yellow";
  ctx.fillRect(x+5, car.y, 8, 10);
  ctx.fillRect(x+37, car.y, 8, 10);

  ctx.fillStyle = "black";
  ctx.fillRect(x-5, car.y+15, 6, 18);
  ctx.fillRect(x+car.width, car.y+15, 6, 18);
  ctx.fillRect(x-5, car.y+55, 6, 18);
  ctx.fillRect(x+car.width, car.y+55, 6, 18);

  ctx.shadowBlur = 0;
}

// Move Enemies
function moveEnemies() {
  enemies.forEach((e,i)=>{
    e.y += speed;

    let px = lanes[player.lane];
    let ex = lanes[e.lane];

    if (
      px < ex + e.width &&
      px + player.width > ex &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) gameOver = true;

    if (e.y > canvas.height) {
      enemies.splice(i,1);
      score++;
    }
  });
}

// Background
let roadOffset = 0;
let lampOffset = 0;

function drawBackground() {

  ctx.fillStyle = "#145214";
  ctx.fillRect(0, 0, 60, canvas.height);
  ctx.fillRect(canvas.width - 60, 0, 60, canvas.height);

  ctx.fillStyle = "#777";
  ctx.fillRect(60, 0, 10, canvas.height);
  ctx.fillRect(canvas.width - 70, 0, 10, canvas.height);

  ctx.fillStyle = "#2c2c2c";
  ctx.fillRect(70, 0, canvas.width - 140, canvas.height);

  ctx.strokeStyle = "white";
  ctx.setLineDash([20, 20]);
  ctx.lineWidth = 4;

  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(70 + i * ((canvas.width - 140) / 3), roadOffset);
    ctx.lineTo(70 + i * ((canvas.width - 140) / 3), canvas.height);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  for (let i = -100; i < canvas.height; i += 120) {
    let y = i + lampOffset;

    ctx.fillStyle = "#444";
    ctx.fillRect(30, y, 5, 40);
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(32, y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#444";
    ctx.fillRect(canvas.width - 35, y, 5, 40);
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(canvas.width - 32, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  roadOffset += speed;
  lampOffset += speed;

  if (roadOffset > 40) roadOffset = 0;
  if (lampOffset > 120) lampOffset = 0;
}

// UI
function drawUI() {
  ctx.fillStyle = "#00ffcc";
  ctx.font = "18px Arial";
  ctx.fillText("Score: " + score, 10, 30);

  ctx.fillStyle = "#ffcc00";
  ctx.fillText("Speed: " + speed.toFixed(1), 10, 55);
}

// Speed increase
setInterval(()=>{
  if(!gameOver){
    speed += 0.5;
  }
},2000);

// Restart
function restartGame(){
  enemies=[];
  score=0;
  speed=5;
  player.lane=1;
  gameOver=false;
}

// Loop
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawBackground();

  if(!gameOver){
    moveEnemies();
  }

  drawCar(player,true);
  enemies.forEach(e=>drawCar(e));

  drawUI();

  if(gameOver){
    ctx.fillStyle="rgba(0,0,0,0.7)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="red";
    ctx.font="40px Arial";
    ctx.fillText("GAME OVER",90,250);

    ctx.fillStyle="white";
    ctx.font="20px Arial";
    ctx.fillText("Press SPACE to Restart",80,300);
  }

  requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy,900);

gameLoop();