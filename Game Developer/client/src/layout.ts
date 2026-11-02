// The design size: an Android phone, portrait (mine, 2026-10-31). Phaser scales it to fit whatever screen it gets.
export const DESIGN_WIDTH = 412;
export const DESIGN_HEIGHT = 915;
/**
 * The canvas's width in design pixels (Robin, 2026-11-02: "why isnt the game centered and filling out the screen"). The game's
 * column stays DESIGN_WIDTH wide, centred by the camera; a screen wider than the column, as a phone with a browser's bars is, sees
 * more of the world and wider panels. Beyond the limit, such as on a computer, the rest is left dark.
 */
export const SCREEN_WIDTH = typeof window === 'undefined' ? DESIGN_WIDTH : Math.max(DESIGN_WIDTH, Math.min(620, Math.round((DESIGN_HEIGHT * window.innerWidth) / Math.max(1, window.innerHeight))));
/** The device pixel ratio the canvas draws at (hires.ts): the phone's, capped at 2 for the fill rate; 1 where there is no window. */
export const DPR = typeof window === 'undefined' ? 1 : Math.min(2, Math.max(1, Math.round((window.devicePixelRatio || 1) * 2) / 2));

/** The HUD panel across the top: name, numbers, where you are, the die. The world is seen under it. */
export const HUD_HEIGHT = 100;
/** The top bar's plank (Robin, 2026-11-02: the slim bar, Mitch, AD's): its signs hang over the map down to HUD_HEIGHT. */
export const HUD_PLANK = 74;
/** The bottom bar's plank starts here (Robin, 2026-11-02: bottom bar 1, Mitch, AD's); the board's camera runs down to it. */
export const PLANK_TOP = 835;
/** Roll rises above the plank to here, this wide about the column's centre. */
export const ROLL_TOP = 824;
export const ROLL_LEFT = 146;
export const ROLL_RIGHT = 266;
/** The band the world camera looks through: from under the HUD panel to above the chips, the message and the buttons. */
export const VIEW_HEIGHT = 640;

export const COLORS = {
  background: '#1b1f2a',
  ground: 0x20263a,
  panel: 0x121521,
  link: 0x3a4256,
  border: 0x4a5470,
  text: '#f6f2e6',
  dim: '#c9d0de',
  gold: '#e8b84a',
  button: 0x4fb06d,
  buttonText: '#0f1a12',
  log: 0x2b3245,
  mana: 0x4aa3df,
} as const;

/** The ground of each area's theme (mine; placeholders until the art comes). */
export const THEME_COLORS: Record<string, number> = {
  meadow: 0x24332a, // clover green
  forest: 0x1f2a1c, // wobblewood leaf and bark
  harvest: 0x34301c, // honey and wheat
  glimmerlake: 0x1c2f36, // turquoise water
  moonwhisper: 0x26203a, // lavender and violet
  thunderstone: 0x262c33, // slate
  sunfall: 0x383020, // sandstone and gold
  frostveil: 0x24303c, // ice blue
  thornhollow: 0x1f2a22, // deep moss and thorn purple
  starfall: 0x1e1b33, // deep purple and star gold
  embercrown: 0x30201c, // charcoal and ember
  shattered: 0x2a2436, // royal violet and ivory
};

/** The colours of the rarities, as text colours. */
export const RARITY_COLORS: Record<string, string> = {
  unique: '#ff9f43',
  common: '#e8e4d8',
  uncommon: '#6fcf7a',
  rare: '#5aa9ff',
  epic: '#c084fc',
  legendary: '#ffb347',
};

/** The same colours as ink on the loot card's cream face (mine, 2026-11-01): darker, so a common piece reads too; gold for coins. */
export const RARITY_INK: Record<string, string> = {
  unique: '#b4480a',
  common: '#4a4234',
  uncommon: '#1f7a33',
  rare: '#1a62b8',
  epic: '#7430c4',
  legendary: '#a86200',
  gold: '#8a6000',
};

/** The colour a reveal's glow, rim and particles take, as a number for a tint: the rarity's colour, a stone grey for common, gold for coins. */
export const RARITY_TINT: Record<string, number> = {
  unique: 0xff9f43,
  common: 0xd6cfbd,
  uncommon: 0x6fcf7a,
  rare: 0x5aa9ff,
  epic: 0xc084fc,
  legendary: 0xffb347,
  gold: 0xe8b84a,
};

/** The text face: Nunito (the UI kit's choice, Mitch, AD, 2026-11-01), the system's when it has not loaded. */
export const FONT = '"Nunito", system-ui, "Segoe UI", Roboto, sans-serif';
/** The display face for titles, numbers and buttons: Fredoka. */
export const FONT_DISPLAY = '"Fredoka", "Nunito", system-ui, "Segoe UI", Roboto, sans-serif';
