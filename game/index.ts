export type LevelYX = string[][];
export type Game = {
  state: () => LevelYX;
  hasWon: () => boolean;
  move: (dir: XY) => void;
  undo: () => void;
  reset: () => void;
  score: () => MovesAndPushes;
  solution: () => string;
};
type XY = [number, number];
type MovesAndPushes = [number, number];

export const WALL = "#";
export const PLAYER = "@";
export const PLAYER_ON_GOAL = "+";
export const BOX = "$";
export const BOX_ON_GOAL = "*";
export const GOAL = ".";
export const FLOOR = " ";

export function parseLevel(levelText: string): LevelYX {
  return (
    levelText
      .split("\n")
      // Trim trailing lines before/after level
      .filter((line) => line.length !== 0)
      .map((line) => line.split(""))
  );
}

export function findChar(level: LevelYX, char: string): XY[] {
  const found: XY[] = [];
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      if (level[y][x] === char) {
        found.push([x, y]);
      }
    }
  }
  return found;
}

export function movePlayer(
  level: LevelYX,
  dirX: number,
  dirY: number,
  apply: boolean,
  canPush: boolean = true
): false | string {
  const player =
    findChar(level, PLAYER).length === 0
      ? findChar(level, PLAYER_ON_GOAL)
      : findChar(level, PLAYER);
  const [playerX, playerY] = player[0];
  const [targetX, targetY] = [playerX + dirX, playerY + dirY];

  if (level[targetY][targetX] === FLOOR || level[targetY][targetX] === GOAL) {
    if (apply) {
      swapChars(level, playerX, playerY, targetX, targetY);
    }
    return dirToDesc(dirX, dirY);
  }

  if (level[targetY][targetX] === WALL) {
    return false;
  }

  if (!canPush) {
    return false;
  }

  if (
    level[targetY][targetX] === BOX ||
    level[targetY][targetX] === BOX_ON_GOAL
  ) {
    const [boxTargetX, boxTargetY] = [targetX + dirX, targetY + dirY];
    if (
      level[boxTargetY][boxTargetX] === FLOOR ||
      level[boxTargetY][boxTargetX] === GOAL
    ) {
      if (apply) {
        swapChars(level, targetX, targetY, boxTargetX, boxTargetY);
        swapChars(level, playerX, playerY, targetX, targetY);
      }
      return dirToDesc(dirX, dirY).toUpperCase();
    }
    return false;
  }

  throw "Unexpected game state";
}

function dirToDesc(x: number, y: number) {
  if (x === 1 && y === 0) {
    return "r";
  } else if (x === -1 && y === 0) {
    return "l";
  } else if (x === 0 && y === 1) {
    return "d";
  } else if (x === 0 && y === -1) {
    return "u";
  }

  throw "Unknown direction";
}

function swapChars(
  level: LevelYX,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  if (level[y1][x1] === PLAYER && level[y2][x2] === FLOOR) {
    level[y1][x1] = FLOOR;
    level[y2][x2] = PLAYER;
  } else if (level[y1][x1] === PLAYER && level[y2][x2] === GOAL) {
    level[y1][x1] = FLOOR;
    level[y2][x2] = PLAYER_ON_GOAL;
  } else if (level[y1][x1] === PLAYER_ON_GOAL && level[y2][x2] === FLOOR) {
    level[y1][x1] = GOAL;
    level[y2][x2] = PLAYER;
  } else if (level[y1][x1] === PLAYER_ON_GOAL && level[y2][x2] === GOAL) {
    level[y1][x1] = GOAL;
    level[y2][x2] = PLAYER_ON_GOAL;
  } else if (level[y1][x1] === BOX && level[y2][x2] === FLOOR) {
    level[y1][x1] = FLOOR;
    level[y2][x2] = BOX;
  } else if (level[y1][x1] === BOX && level[y2][x2] === GOAL) {
    level[y1][x1] = FLOOR;
    level[y2][x2] = BOX_ON_GOAL;
  } else if (level[y1][x1] === BOX_ON_GOAL && level[y2][x2] === FLOOR) {
    level[y1][x1] = GOAL;
    level[y2][x2] = BOX;
  } else if (level[y1][x1] === BOX_ON_GOAL && level[y2][x2] === GOAL) {
    level[y1][x1] = GOAL;
    level[y2][x2] = BOX_ON_GOAL;
  }
}

export function checkGameWon(level: LevelYX) {
  // We can just check that there are no boxes.
  // All the boxes should be BOX_ON_GOAL
  return findChar(level, BOX).length === 0;
}

export function cloneLevel(level: LevelYX): LevelYX {
  // Can be optimized (structuredClone, etc.)
  return JSON.parse(JSON.stringify(level));
}

export function newGame(levelText: string): Game {
  const history: LevelYX[] = [];
  const path: string[] = [];

  const init = () => {
    history.splice(0);
    history.push(parseLevel(levelText));
    path.splice(0);
  };
  init();

  return {
    state: () => {
      return history[history.length - 1];
    },
    hasWon: () => {
      return checkGameWon(history[history.length - 1]);
    },
    move: (dir) => {
      const clone = cloneLevel(history[history.length - 1]);
      const direction = movePlayer(clone, dir[0], dir[1], true);
      if (direction !== false) {
        history.push(clone);
        path.push(direction);
      }
    },
    undo: () => {
      if (history.length > 1) {
        path.pop();
        history.pop();
      }
    },
    reset: () => init(),
    score: () => {
      return path.reduce(
        (prev, cur) => {
          return [prev[0] + 1, prev[1] + (cur.toUpperCase() === cur ? 1 : 0)];
        },
        [0, 0]
      );
    },
    solution: () => path.join(""),
  };
}
