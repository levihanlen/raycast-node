interface User {
  x: number;
  y: number;
  angle: number;
  fov: number;
  moveSpeed: number;
  rotSpeed: number;
}

const canvas = document.querySelector("#canvas");

// @ts-ignore dont matter
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

// ctx.fillRect(2, 4, 20, 30);

const user: User = {
  x: 4,
  y: 4,
  angle: 180,
  fov: 60,
  moveSpeed: 0.2, // Movement speed
  rotSpeed: 3, // Rotation speed
};

const totalRays = user.fov * 2;

const map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const tileSize = 8;

function drawMap() {
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] === 1) {
        ctx.fillStyle = "black";
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }
  }
}

const keys: { [key: string]: boolean } = {};

// Event listeners for key presses
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

gameLoop();

function gameLoop() {
  ctx.clearRect(0, 0, 100, 100);

  // Draw the map
  drawMap();

  // Handle user input and update position
  handleInput();

  // Cast rays based on updated user position and angle
  castRays();

  // Draw the user as a circle for visualization
  // drawUser();

  // Request the next frame
  requestAnimationFrame(gameLoop);
}

function handleInput() {
  if (keys["ArrowUp"]) {
    moveUser(user.moveSpeed);
  }

  if (keys["ArrowDown"]) {
    moveUser(-user.moveSpeed);
  }

  if (keys["ArrowLeft"]) {
    user.angle = (user.angle - user.rotSpeed) % 360;
    // if (user.angle < 0) user.angle += 360;
  }

  if (keys["ArrowRight"]) {
    user.angle = (user.angle + user.rotSpeed) % 360;
  }
}

function moveUser(amount: number) {
  const radians = (user.angle / 180) * Math.PI;
  const x = Math.cos(radians) * amount;
  const y = Math.sin(radians) * amount;
  user.x += x;
  user.y += y;
}

function castRays() {
  console.log("in there");
  const maxDist = 1000;
  const moveDist = 1;
  for (let i = 0; i < totalRays; i++) {
    console.log("hi");
    const rayAngle = (i - user.fov + user.angle) % 360;
    const radians = (rayAngle / 180) * Math.PI;

    const xMove = Math.cos(radians) * moveDist;
    const yMove = Math.sin(radians) * moveDist;
    let x = user.x + xMove;
    let y = user.y + yMove;
    let colliding = findColliding(x, y);
    let dist = 1;
    while (dist < maxDist && !colliding) {
      x += xMove;
      y += yMove;
      dist += 1;
      colliding = findColliding(x, y);
    }
    drawRay(x, y);
  }
}

function drawRay(x: number, y: number) {
  ctx.beginPath();
  ctx.moveTo(user.x * 8, user.y * 8);
  ctx.lineTo(x * 8, y * 8);
  // ctx.closePath();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function findColliding(x: number, y: number) {
  const thisX = Math.round(x);
  const thisY = Math.round(y);
  const thing = map[thisY][thisX];
  if (thing === 1) {
    return true;
  } else {
    return false;
  }
}
