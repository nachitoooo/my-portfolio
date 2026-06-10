/* Shared pixel-art sprites: cat walk cycle + PlayStation controller.
   Used by the loading screen and the roaming PixelCat. */

export const LS = 5; // pixel scale — bigger for more detail

export const CHAR_PAL: Record<string, string> = {
  K: "#1a1a1a",   // black fur + eye
  k: "#333333",   // paw shadow
  W: "#f5f5f5",   // white face
  w: "#d8d8d8",   // belly off-white
  N: "#ff8888",   // pink nose
};

// 10w × 10h — 4-frame walk cycle, profile (cat faces RIGHT, tail at LEFT)
// Tail tip sways L→R each frame; belly has black patches
const CAT_TAILS = [
  ["..K.......", ".KK....K.."],   // f0: tip center-right
  [".K........", "KKK....K.."],   // f1: tip left
  ["..K.......", ".KK....K.."],   // f2: tip center-right
  ["...K......", ".KKK...K.."],   // f3: tip far right
];
const CAT_BODY_ROWS = [
  "KKK...KWK.",   // tail base + head outline (W = white face)
  "KKKKKKwKNK",   // body top + face (K = black eye, N = pink nose)
  ".KwwKwwKKK",   // belly with black patch at col 4 + chin
  ".KwKwwwKK.",   // belly with black patch at col 3
  ".KKKKKKK..",   // body bottom
];
export const CHAR_FRAMES = [
  [...CAT_TAILS[0], ...CAT_BODY_ROWS, ".K.K..K.K.", ".K.K..K.K.", ".k.k..k.k."],
  [...CAT_TAILS[1], ...CAT_BODY_ROWS, "..KK..KK..", "..KK..KK..", "..kk..kk.."],
  [...CAT_TAILS[2], ...CAT_BODY_ROWS, ".K.K..K.K.", ".K.K..K.K.", ".k.k..k.k."],
  [...CAT_TAILS[3], ...CAT_BODY_ROWS, "..KK..KK..", "..KK..KK..", "..kk..kk.."],
];

export const CON_PAL: Record<string, string> = {
  C: "#9040e0", c: "#5c18a8",  // controller body / shadow
  D: "#18083a", d: "#3010a0",  // dark well / dpad arm
  B: "#c084fc", b: "#e0b0ff",  // face button / highlight
};

// 12w × 10h — PlayStation-style controller, 2-frame (buttons blink)
export const CON_FRAMES = [
  [
    "..CCCCCCCC..",
    ".CcCCCCCCcC.",
    "CcDDDDDDDDcC",
    "CcD.dBd.BdcC",
    "CcDdddD.ddcC",
    "CcD.dBd.BdcC",
    "CcDDDDDDDDcC",
    ".CcCCCCCCcC.",
    "...CC....CC.",
    "...CC....CC.",
  ],
  [
    "..CCCCCCCC..",
    ".CcCCCCCCcC.",
    "CcDDDDDDDDcC",
    "CcD.dbd.bdcC",
    "CcDdddD.ddcC",
    "CcD.dbd.bdcC",
    "CcDDDDDDDDcC",
    ".CcCCCCCCcC.",
    "...CC....CC.",
    "...CC....CC.",
  ],
];

export function drawPx(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  pal: Record<string, string>,
  x: number, y: number, sc: number
) {
  for (let ry = 0; ry < grid.length; ry++) {
    for (let rx = 0; rx < grid[ry].length; rx++) {
      const col = pal[grid[ry][rx]];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + rx * sc), Math.round(y + ry * sc), sc, sc);
      }
    }
  }
}
