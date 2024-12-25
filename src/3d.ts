interface User {
  x: number;
  y: number;
  z: number;
  horzAngle: number;
  vertAngle: number;
  fov: number;
  moveSpeed: number;
  rotSpeed: number;
}

const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;

// @ts-ignore
const ctx = canvas.getContext("2d")!;

const textureUrls: string[] = ["/img.jpg"];
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

// window.addEventListener("resize", resizeCanvas);
// resizeCanvas();

const user: User = {
  x: 3,
  y: 3,
  z: 3,
  horzAngle: 180,
  vertAngle: 0,
  fov: 100,
  moveSpeed: 0.05,
  rotSpeed: 3,
};

// const totalRays = canvas.width;

let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

const map = [
  [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  ],
  [
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 2, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],

  [
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
];

const mapZ = map.length;
const mapY = map[0].length;
const mapX = map[0][0].length;

function keepWithin(x: number, y: number, z: number) {
  const clampedX = Math.max(0, Math.min(x, mapX - 1));

  const clampedY = Math.max(0, Math.min(y, mapY - 1));
  const clampedZ = Math.max(0, Math.min(z, mapZ - 1));

  return { x: clampedX, y: clampedY, z: clampedZ };
}

const keys: { [key: string]: boolean } = {};

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

  // drawSkybox();
  castRays();

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

/*
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
  */

function handleInput() {
  if (keys["w"]) {
    moveUser(user.moveSpeed, "y");
  }

  if (keys["r"]) {
    moveUser(-user.moveSpeed, "y");
  }

  if (keys["s"]) {
    moveUser(user.moveSpeed, "x");
  }

  if (keys["a"]) {
    moveUser(-user.moveSpeed, "x");
  }

  if (keys["f"]) {
    moveUser(user.moveSpeed, "z");
  }

  if (keys["q"]) {
    moveUser(-user.moveSpeed, "z");
  }

  if (keys["ArrowUp"]) {
    user.vertAngle = Math.max(-90, user.vertAngle - user.rotSpeed);
  }

  if (keys["ArrowDown"]) {
    user.vertAngle = Math.min(90, user.vertAngle + user.rotSpeed);
  }

  if (keys["ArrowLeft"]) {
    user.horzAngle = (user.horzAngle - user.rotSpeed) % 360;
    // if (user.angle < 0) user.angle += 360;
  }

  if (keys["ArrowRight"]) {
    user.horzAngle = (user.horzAngle + user.rotSpeed) % 360;
  }
}

function moveUser(amount: number, dir: "y" | "x" | "z") {
  let thisAngle;
  if (dir === "x") {
    thisAngle = user.horzAngle + 90;
  } else if (dir === "y") {
    thisAngle = user.horzAngle;
  } else {
    const userZ = user.z + amount;

    const colliding = findColliding(user.x, user.y, userZ);

    if (colliding) {
      return;
    }
    const { z } = keepWithin(user.x, user.y, userZ);
    user.z = z;
    return;
  }

  const radians = (thisAngle / 180) * Math.PI;
  const thisX = Math.cos(radians) * amount;
  const thisY = Math.sin(radians) * amount;

  const userX = user.x + thisX;
  const userY = user.y + thisY;

  const colliding = findColliding(userX, userY, user.z);

  if (colliding) {
    return;
  }

  const { x, y } = keepWithin(userX, userY, 0);
  user.x = x;
  user.y = y;
}

function castRays() {
  const maxDist = 1000;
  const moveDist = 0.1;
  let textureX = 0;
  // let lastVertical = false;
  for (let i = 0; i < canvas.height; i++) {
    const vertRayAngle =
      (i * (user.fov / canvas.height) - user.fov / 2 + user.vertAngle) % 360;

    const vertRadians = (vertRayAngle / 180) * Math.PI;

    const zMove = Math.sin(vertRadians) * moveDist;

    for (let j = 0; j < canvas.width; j++) {
      const horzRayAngle =
        (j * (user.fov / canvas.width) - user.fov / 2 + user.horzAngle) % 360;

      const horzRadians = (horzRayAngle / 180) * Math.PI;

      // x is sid to side
      // y is forward
      // z is up and down

      const xMove = Math.cos(horzRadians) * Math.cos(vertRadians) * moveDist;
      const yMove = Math.sin(horzRadians) * Math.cos(vertRadians) * moveDist;

      let x = user.x + xMove;
      let y = user.y + yMove;
      let z = user.z + zMove;
      let colliding = false;
      let dist = moveDist;

      while (dist < maxDist && !colliding) {
        x += xMove;
        y += yMove;
        z += zMove;
        dist += moveDist;
        colliding = findColliding(x, y, z);
      }

      /*
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
      */

      const wallType = findWallType(x, y, z);

      if (wallType !== 0) {
        drawRay(i, j, dist, wallType, textureX);
      }
    }
  }
}

function drawRay(
  y: number,
  x: number,
  dist: number,
  wallType: number = 1,
  textureX: number
) {
  /*
  const barWidth = canvas.width / totalRays;
  const startX = (i / totalRays) * canvas.width;
*/

  // const hue = Math.random() * 360;
  const hue = wallType * 20;
  ctx.fillStyle = `hsl(${hue}, 50%, ${Math.min(dist * 5 + 20, 100)}%)`;

  // ctx.fillStyle = "red";
  /*
  let height = ((1 / dist) * canvas.height) / 1;

  const yHeight = canvas.height / 2 - height / 2;
*/
  // const texture = wallTextures[0];

  ctx.fillRect(x, y, 1, 1);

  /*
  ctx.drawImage(
    texture,
    textureX,
    0,
    1,
    texture.height,
    startX,
    yHeight,
    barWidth,
    height
  );
  */
}

function findWallType(x: number, y: number, z: number) {
  const wall = roundToGrid(x, y, z);
  if (z <= 0 || z >= map.length) {
    return 0;
  } else {
    return wall;
  }
}

/*
function getRounded(x: number, y: number) {
  return { x: Math.floor(x), y: Math.floor(y) };
}
  */

function roundToGrid(x: number, y: number, z: number) {
  const {
    x: floorX,
    y: floorY,
    z: floorZ,
  } = keepWithin(Math.floor(x), Math.floor(y), Math.floor(z));
  return map[floorZ][floorY][floorX];
}
function findColliding(x: number, y: number, z: number) {
  const thing = roundToGrid(x, y, z);

  if (thing !== 0) {
    return true;
  } else {
    return false;
  }
}