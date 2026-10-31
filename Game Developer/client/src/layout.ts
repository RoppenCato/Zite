// The design size: an Android phone, portrait (mine, 2026-10-31). Phaser scales it to fit whatever screen it gets.
export const DESIGN_WIDTH = 412;
export const DESIGN_HEIGHT = 915;

/** The HUD panel across the top; the world is seen under it. */
export const HUD_HEIGHT = 90;
/** The band the world camera looks through: from under the HUD panel to above the message line and the buttons. */
export const VIEW_HEIGHT = 680;

export const COLORS = {
  background: '#1b1f2a',
  ground: 0x20263a,
  panel: 0x121521,
  link: 0x3a4256,
  border: 0x4a5470,
  text: '#e8e4d8',
  dim: '#8e97ab',
  button: 0x4fb06d,
  buttonText: '#0f1a12',
  log: 0x2b3245,
} as const;

export const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';
