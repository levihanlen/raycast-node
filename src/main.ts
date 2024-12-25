interface User {
  x: number;
  y: number;
  angle: number;
  yAngle: number;
  fov: number;
  moveSpeed: number;
  rotSpeed: number;
}

const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;

// @ts-ignore
const ctx = canvas.getContext("2d")!;

const textureUrls: string[] = ["/public/wall.jpeg"];
const wallTextures: HTMLImageElement[] = [];

function preloadTextures(urls: string[]): Promise<HTMLImageElement[]> {
  const promises = urls.map((url) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });
  });
  return Promise.all(promises);
}

preloadTextures(textureUrls)
  .then((images) => {
    wallTextures.push(...images);
    console.log("All textures loaded successfully.");
    // You can now start the game or rendering loop
    startGameLoop();
  })
  .catch((error) => {
    console.error(error);
  });

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Recalculate any dependent variables here
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // Initial call

const user: User = {
  x: 3,
  y: 3,
  angle: 180,
  yAngle: 0,
  fov: 100,
  moveSpeed: 0.05, // Movement speed
  rotSpeed: 3, // Rotation speed
};

const totalRays = canvas.width;

const using2d = false;

let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

const map = [
  [1, 1, 1, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
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
const yAngleMult = 15;
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
function startGameLoop() {
  requestAnimationFrame(gameLoop);
}

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

  frameCount++;
  const currentTime = performance.now();
  const delta = currentTime - lastTime;

  if (delta >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = currentTime;
  }
  const thing = document.querySelector("#fps");

  if (thing) {
    thing.textContent = fps.toString();
  }

  requestAnimationFrame(gameLoop);
}

function drawSkybox() {
  ctx.fillStyle = `hsl(208, 39.90%, 70.00%)`;
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height / 2 + user.yAngle * yAngleMult
  );
  ctx.fillStyle = `hsl(19, 39.90%, 70.00%)`;
  ctx.fillRect(
    0,
    canvas.height / 2 + user.yAngle * yAngleMult,
    canvas.width,
    canvas.height - (canvas.height / 2 + user.yAngle * yAngleMult)
  );
}

function handleInput() {
  /*
  if (keys["ArrowUp"]) {
    moveUser(user.moveSpeed);
  }

  if (keys["ArrowDown"]) {
    moveUser(-user.moveSpeed);
  }
  */
  if (keys["w"]) {
    moveUser(user.moveSpeed, "fwd");
  }

  if (keys["r"]) {
    moveUser(-user.moveSpeed, "fwd");
  }

  if (keys["s"]) {
    moveUser(user.moveSpeed, "side");
  }

  if (keys["a"]) {
    moveUser(-user.moveSpeed, "side");
  }

  if (keys["ArrowUp"]) {
    user.yAngle = Math.min(180, user.yAngle + user.rotSpeed);
  }

  if (keys["ArrowDown"]) {
    user.yAngle = Math.max(-180, user.yAngle - user.rotSpeed);
  }

  if (keys["ArrowLeft"]) {
    user.angle = (user.angle - user.rotSpeed) % 360;
    // if (user.angle < 0) user.angle += 360;
  }

  if (keys["ArrowRight"]) {
    user.angle = (user.angle + user.rotSpeed) % 360;
  }
}

function moveUser(amount: number, dir: "fwd" | "side") {
  const thisAngle = dir === "fwd" ? user.angle : user.angle + 90;

  const radians = (thisAngle / 180) * Math.PI;
  const thisX = Math.cos(radians) * amount;
  const thisY = Math.sin(radians) * amount;

  const userX = user.x + thisX;
  const userY = user.y + thisY;

  const colliding = findColliding(userX, userY);

  if (colliding) {
    return;
  }

  const { x, y } = keepWithin(userX, userY);
  user.x = x;
  user.y = y;
}

function castRays() {
  const maxDist = 1000;
  const moveDist = 0.01;
  let textureX = 0;
  let lastVertical = false;
  // let lastCoord: { x: number; y: number } = { x: 0, y: 0 };
  for (let i = 0; i < totalRays; i++) {
    const rayAngle =
      (i * (user.fov / totalRays) - user.fov / 2 + user.angle) % 360;
    const radians = (rayAngle / 180) * Math.PI;

    const xMove = Math.cos(radians) * moveDist;
    const yMove = Math.sin(radians) * moveDist;

    let x = user.x + xMove;
    let y = user.y + yMove;
    let colliding = false;
    let dist = moveDist;

    while (dist < maxDist && !colliding) {
      x += xMove;
      y += yMove;
      dist += moveDist;
      colliding = findColliding(x, y);
    }

    // dist = dist * Math.cos(((rayAngle - user.angle) / 180) * Math.PI);

    // const { x: thisCoordX, y: thisCoordY } = getRounded(x, y);

    /*
    if (lastCoord.x === thisCoordX && lastCoord.y === thisCoordY) {
      textureX += dist;
      if (textureX >= wallTextures[0].width) {
        textureX = 0;
      }
    } else {
      textureX = 0;
    }
    lastCoord.x = thisCoordX;
    lastCoord.y = thisCoordY;
    */

    // textureX = wallTextures[0].width *

    const isVertical =
      Math.abs(x - Math.floor(x) - 0.5) < Math.abs(y - Math.floor(y) - 0.5);

    if (isVertical) {
      textureX = wallTextures[0].width * (x % 1);
    } else {
      textureX = wallTextures[0].width * (y % 1);
    }

    if (isVertical !== lastVertical) {
      textureX = 0;
    }
    lastVertical = isVertical;

    textureX = Math.floor(textureX);

    const wallType = findWallType(x, y);
    drawRay(i, dist, wallType, textureX);
    drawRay2d(x, y);
  }
}

function drawRay(
  i: number,
  dist: number,
  wallType: number = 1,
  textureX: number
) {
  const barWidth = canvas.width / totalRays;
  const startX = (i / totalRays) * canvas.width;

  // const hue = Math.random() * 360;
  const hue = wallType * 20;
  ctx.fillStyle = `hsl(${hue}, 50%, ${dist * 5 + 20}%)`;
  let height = ((1 / dist) * canvas.height) / 1;

  const yHeight = canvas.height / 2 - height / 2;

  const texture = wallTextures[0];

  // ctx.fillRect(startX, yHeight + user.yAngle * yAngleMult, barWidth, height);

  ctx.drawImage(
    texture,
    textureX,
    0,
    1,
    texture.height,
    startX,
    yHeight + user.yAngle * yAngleMult,
    barWidth,
    height
  );
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

function getRounded(x: number, y: number) {
  return { x: Math.floor(x), y: Math.floor(y) };
}

function roundToGrid(x: number, y: number) {
  const { x: floorX, y: floorY } = keepWithin(Math.floor(x), Math.floor(y));
  return map[floorY][floorX];
}
function findColliding(x: number, y: number) {
  const thing = roundToGrid(x, y);

  if (thing !== 0) {
    return true;
  } else {
    return false;
  }
}
