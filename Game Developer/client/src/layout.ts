// The design size: an Android phone, portrait (mine, 2026-10-31). Phaser scales it to fit whatever screen it gets.
export const DESIGN_WIDTH = 412;
export const DESIGN_HEIGHT = 915;

/** The HUD panel across the top: name, numbers, where you are, the die. The world is seen under it. */
export const HUD_HEIGHT = 100;
/** The band the world camera looks through: from under the HUD panel to above the chips, the message and the buttons. */
export const VIEW_HEIGHT = 640;

export const COLORS = {
  background: '#1b1f2a',
  ground: 0x20263a,
  panel: 0x121521,
  link: 0x3a4256,
  border: 0x4a5470,
  text: '#e8e4d8',
  dim: '#8e97ab',
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
  unique: '#d9621a',
  common: '#6b6252',
  uncommon: '#3c9a4c',
  rare: '#2d7fd6',
  epic: '#9450e0',
  legendary: '#dd8a12',
  gold: '#c08a14',
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

export const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';
