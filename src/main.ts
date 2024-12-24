interface User {
  x: number;
  y: number;
  angle: number;
  fov: number;
  moveSpeed: number;
  rotSpeed: number;
}

const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;

// @ts-ignore dont matter
const ctx = canvas.getContext("2d")!;

// ctx.imageSmoothingEnabled = false;

// ctx.fillRect(2, 4, 20, 30);

const user: User = {
  x: 4,
  y: 4,
  angle: 180,
  fov: 40,
  moveSpeed: 0.05, // Movement speed
  rotSpeed: 3, // Rotation speed
};

const totalRays = 500;

const using2d = false;

const map = [
  [1, 1, 1, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 2, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const mapY = map.length;
const mapX = map[0].length;

function keepWithin(x: number, y: number) {
  const clampedX = Math.max(0, Math.min(x, mapX - 1));

  const clampedY = Math.max(0, Math.min(y, mapY - 1));

  return { x: clampedX, y: clampedY };
}

const tileSize = 8;
function draw2d() {
  drawMap();
}
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
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  handleInput();

  drawSkybox();
  castRays();
  if (using2d) {
    draw2d();
  }

  requestAnimationFrame(gameLoop);
}

function drawSkybox() {
  ctx.fillStyle = `hsl(208, 39.90%, 70.00%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = `hsl(19, 39.90%, 70.00%)`;
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
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
  const thisX = Math.cos(radians) * amount;
  const thisY = Math.sin(radians) * amount;

  const userX = user.x + thisX;
  const userY = user.y + thisY;

  const { x, y } = keepWithin(userX, userY);
  user.x = x;
  user.y = y;
}

function castRays() {
  const maxDist = 1000;
  const moveDist = 0.01;
  for (let i = 0; i < totalRays; i++) {
    //  i = 0, then -fov
    // i = totalrays, then fov

    const rayAngle =
      (i * (user.fov / totalRays) - user.fov / 2 + user.angle) % 360;
    const radians = (rayAngle / 180) * Math.PI;
    /*
    if (i === 0) {
      console.log(rayAngle);
    }
    if (i === totalRays - 1) {
      console.log(rayAngle);
    }
    */

    const xMove = Math.cos(radians) * moveDist;
    const yMove = Math.sin(radians) * moveDist;

    let x = user.x + xMove;
    let y = user.y + yMove;
    let colliding = false;
    let dist = moveDist;
    while (dist < maxDist && !colliding) {
      colliding = findColliding(x, y);

      if (colliding) {
        //  x -=
      } else {
        x += xMove;
        y += yMove;
        dist += moveDist;
      }
    }
    const wallType = findWallType(x, y);
    drawRay(i, dist, wallType);
    drawRay2d(x, y);
  }
}

function drawRay(i: number, dist: number, wallType: number = 1) {
  const bar = canvas.width / totalRays;
  const startX = (i / totalRays) * canvas.width;

  // const hue = Math.random() * 360;
  const hue = wallType * 20;
  ctx.fillStyle = `hsl(${hue}, 50%, ${dist * 5 + 20}%)`;
  const height = ((1 / dist) * canvas.height) / 1;
  ctx.fillRect(startX, canvas.height / 2 - height / 2, bar, height);
}

function findWallType(x: number, y: number) {
  return roundToGrid(x, y);
}

function drawRay2d(x: number, y: number) {
  if (!using2d) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(user.x * 8, user.y * 8);
  ctx.lineTo(x * 8, y * 8);
  // ctx.closePath();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function roundToGrid(x: number, y: number) {
  const { x: floorX, y: floorY } = keepWithin(Math.floor(x), Math.floor(y));
  return map[floorY][floorX];
}
function findColliding(x: number, y: number) {
  const thing = roundToGrid(x, y);

  //  const { x: ceilX, y: ceilY } = keepWithin(Math.ceil(x), Math.ceil(y));
  // console.log("ciel", ceilX, ceilY);
  // const thing2 = map[ceilY][ceilX];
  // debugger;
  // console.log(thing, thing2);
  if (thing !== 0) {
    return true;
  } else {
    return false;
  }
}
