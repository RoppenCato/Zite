// The world: areas by tier drawn in world pixels (each area's ground, the links, the spots, bosses on the board,
// whatever has spawned), a camera that follows the character, and the touch input (tap a spot for a hint or a choice,
// drag to pan, pinch to zoom). The fixed chrome is HudScene, launched from here; the fight, the shop and the bag are
// scenes launched over both. No art yet: shapes and labels. Everything here is drawing and input; what happens is
// decided by the rules through LocalGame.

import Phaser from 'phaser';
import {
  CLASS_DATA,
  countdown,
  describeGear,
  ABILITIES,
  creature,
  powers,
  hintFor,
  ITEMS,
  reachable,
  sellPrice,
  SPACE_KIND_DATA,
  stats,
  type Area,
  type Board,
  type GameEvent,
  type Space,
  type SpaceKind,
} from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, THEME_COLORS, VIEW_HEIGHT } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';
import type { FightOutcome } from './FightScene.ts';
import type { Chip, HudScene } from './HudScene.ts';

export interface BoardSceneDeps {
  game: LocalGame;
  log: GameLog;
}

const SPACE_RADIUS = 26;
const WILD_RADIUS = 20; // the wilds are the many; they stay small
const BOSS_RADIUS = 34;
const TAP_RADIUS = 38; // thumbs are wide: the tap area is bigger than the circle
const RING_RADIUS = 42;
const TOKEN_RADIUS = 15;
const STEP_MS = 260;
const LIT = 0xfff27a;

// The camera (mine, 2026-10-31: numbers to start with).
const FOLLOW_ZOOM = 0.8; // walking about
const MAX_ZOOM = 1.4; // the closest a pinch gets
const HARD_MIN_ZOOM = 0.12; // the overview of the hand-laid world; a world grown wider may go lower, to the floor
const ZOOM_FLOOR = 0.05;
const FRAME_PAD = 80; // world pixels round the token and the lit spaces when a roll is framed
const CAMERA_MS = 350; // a pan or a zoom
const FOLLOW_LERP = 0.12;
const NAME_ZOOM = 0.45; // below this the hub names are hidden
const DRAG_START = 8; // design pixels a finger moves before a touch becomes a drag
const TAP_MAX = 10; // a finger that moved less than this on release tapped
const WHEEL_STEP = 1.1; // one notch of a mouse wheel

// One colour and one letter per kind of spot (mine, 2026-10-31, placeholders until the art comes).
const KIND_COLORS: Record<SpaceKind, number> = {
  town: 0x4fb06d,
  shop: 0xe8b84a,
  normal: 0x5d6678,
  chest: 0xf0a030,
  potion: 0x4aa3df,
  spell: 0x8e6ad9,
  boss: 0x8f2f3b,
};
const KIND_LETTERS_SHOWN: Record<SpaceKind, string> = { town: 'T', shop: '$', normal: '', chest: 'C', potion: '+', spell: '*', boss: 'B' };

const CLASS_COLORS: Record<string, number> = {
  warrior: 0xf2f2f2,
  rogue: 0xcfcfcf,
  mage: 0xd8c8ff,
  ranger: 0xc8f0c8,
};

interface Drag {
  pointer: number;
  lastX: number;
  lastY: number;
  /** True once the finger has moved further than DRAG_START: the camera is being dragged, this is no tap. */
  moved: boolean;
}

interface Pinch {
  zoom: number;
  distance: number;
}

export class BoardScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private readonly rings = new Map<string, Phaser.GameObjects.Arc>();
  private readonly circles = new Map<string, Phaser.GameObjects.Arc>();
  private readonly names: Phaser.GameObjects.Text[] = [];
  private readonly bossLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly covers = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly spawnMarks = new Map<string, Phaser.GameObjects.Container>();
  /** The areas drawn so far: the world grows as bosses fall, and a new area is drawn when it comes (mine, 2026-10-31). */
  private readonly drawn = new Set<string>();
  /** When the fight, the shop or the bag last closed, in ms and in frames: the tap that closed it must not also reach the spot
   * under the button (mine, 2026-10-31), not even when the closing frame runs long drawing a grown area. */
  private overlayClosedAt = -Infinity;
  private overlayClosedFrame = -Infinity;
  private links!: Phaser.GameObjects.Graphics;
  private border!: Phaser.GameObjects.Graphics;
  private token!: Phaser.GameObjects.Container;
  private hud: HudScene | null = null;
  /** Where the pending roll can end, by landing space, while the player is choosing; null otherwise. */
  private choices_: Map<string, string[]> | null = null;
  private busy = false;
  /** True while the camera follows the token; false after a drag, in the overview, or while a roll is framed. */
  private following = false;
  private minZoom = FOLLOW_ZOOM;
  private lastZoom = -1;
  private drag: Drag | null = null;
  private pinch: Pinch | null = null;

  constructor(deps: BoardSceneDeps) {
    super('board');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    const { board } = this.game_.state;
    this.links = this.add.graphics().setDepth(1);
    this.border = this.add.graphics().setDepth(2);
    this.drawBoard();
    this.drawToken();
    this.drawSpawns();
    this.refreshClocks();
    this.setupCamera(board);
    this.setupInput();
    this.game_.onSpawns = () => this.drawSpawns();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshClocks() });
    this.log.note(`board scene ready: ${Object.keys(board.spaces).length} spaces, ${board.width} by ${board.height}`);
    this.scene.launch('hud');
  }

  /** The HUD is drawn: show the first message, and take up again whatever the page was closed in the middle of. */
  hudReady(hud: HudScene): void {
    this.hud = hud;
    hud.setFollowing(this.following);
    hud.setBusy(this.busy);
    this.refreshHud();
    const me = this.game_.me;
    hud.setDie(this.game_.state.die.last === null ? '–' : String(this.game_.state.die.last));
    if (me.fight) {
      this.openFight();
    } else if (me.offer || me.picks.length) {
      this.offerChoice();
    } else if (me.steps > 0) {
      this.setBusy(true);
      this.offerChoices();
    } else {
      this.setMessage(`Tap Roll to move ${me.name}. Tap any spot to hear about it.`);
    }
  }

  /** The map of landing space to path while the player is choosing; null otherwise. The pane reads it. */
  get choices(): Map<string, string[]> | null {
    return this.choices_;
  }

  override update(_time: number, delta: number): void {
    this.log.frame(delta);
    const zoom = this.cameras.main.zoom;
    if (zoom !== this.lastZoom) {
      const hidden = zoom < NAME_ZOOM;
      if (this.lastZoom < 0 || hidden !== this.lastZoom < NAME_ZOOM) {
        for (const name of this.names) name.setVisible(!hidden);
      }
      this.lastZoom = zoom;
    }
  }

  // ---- what the HUD's buttons call ---------------------------------------------------------------------------------

  /** Roll the die; then walk, or light up the places the roll can end and wait for a tap. */
  roll(): void {
    if (this.busy) {
      if (this.choices_) this.setMessage('Tap a lit spot first.');
      return;
    }
    this.setBusy(true);
    const rolled = this.game_.act({ type: 'roll', player: this.game_.player });
    const roll = rolled.find((e) => e.type === 'rolled');
    if (!roll || roll.type !== 'rolled') {
      this.finish(this.describe(rolled));
      return;
    }
    this.hud?.setDie(String(roll.value), true);
    this.log.note(`rolled ${roll.value}`);
    this.offerChoices();
  }

  /** Map: everything open; Back: the camera returns to the character. */
  toggleMap(): void {
    if (this.following) this.overview();
    else this.follow(false);
  }

  /** The bag: what you wear and carry. Not while a fight or a shop is up. */
  openBag(): void {
    if (this.game_.me.fight || this.scene.isActive('shop') || this.scene.isActive('bag')) return;
    this.scene.launch('bag');
  }

  /** The bag is closed: the numbers may have changed. */
  bagClosed(): void {
    this.scene.stop('bag');
    this.overlayClosedAt = this.time.now;
    this.overlayClosedFrame = this.game.loop.frame;
    this.refreshHud();
  }

  downloadLog(): void {
    this.log.note('log downloaded');
    try {
      this.log.download();
    } catch (e) {
      this.log.error(`download failed: ${String(e)}`);
      this.setMessage('Could not download the log.');
    }
  }

  /** A dice card from the HUD's row: change the pending roll and offer the new choices. */
  useCard(item: string, value?: number): void {
    if (!this.choices_) return;
    const events = this.game_.act({ type: 'use', player: this.game_.player, item, ...(value !== undefined ? { value } : {}) });
    const steps = events.find((e) => e.type === 'steps');
    if (!steps || steps.type !== 'steps') {
      this.setMessage(this.describe(events));
      return;
    }
    this.log.note(`used ${item}${value !== undefined ? ` ${value}` : ''}: ${steps.steps} steps`);
    this.hud?.setDie(String(steps.steps), true);
    this.clearChoices();
    this.offerChoices(`${ITEMS[item]?.name ?? item}: now ${steps.steps} ${steps.steps === 1 ? 'step' : 'steps'}.`);
  }

  /** The gambler's answer. */
  answerGamble(choice: 'high' | 'low' | 'pass'): void {
    const events = this.game_.act({ type: 'gamble', player: this.game_.player, choice });
    this.hud?.setChips([]);
    const gambled = events.find((e) => e.type === 'gambled');
    if (gambled?.type === 'gambled') {
      this.log.note(`gambled ${choice}: rolled ${gambled.roll}, ${gambled.won ? 'won' : 'lost'} ${Math.abs(gambled.delta)}`);
      this.finish(`The die shows ${gambled.roll}: you ${gambled.won ? 'win' : 'lose'} ${Math.abs(gambled.delta)} gold.`);
    } else {
      this.finish(this.describe(events) || 'You walk on.');
    }
  }

  /** The shop scene is done: close it and give the turn back. */
  shopLeft(): void {
    this.scene.stop('shop');
    this.overlayClosedAt = this.time.now;
    this.overlayClosedFrame = this.game.loop.frame;
    const space = this.game_.state.board.spaces[this.game_.me.space];
    const again = space?.kind === 'shop' || space?.kind === 'town' ? ' Tap it again to go back in.' : '';
    this.finish(`Left ${space?.name || 'the shop'}.${again}`);
  }

  /** The fight scene is done: close it; a beaten character wakes in a town; a beaten boss may have opened an area. */
  fightOver(outcome: FightOutcome): void {
    this.scene.stop('fight');
    this.overlayClosedAt = this.time.now;
    this.overlayClosedFrame = this.game.loop.frame;
    const me = this.game_.me;
    if (outcome.type === 'died') {
      const town = this.game_.state.board.spaces[me.space]!;
      this.token.setPosition(town.x, town.y - SPACE_RADIUS - 6);
      this.follow(true);
    }
    this.drawBoard();
    this.refreshCovers();
    this.drawSpawns();
    this.refreshClocks();
    this.log.note(`fight over: ${outcome.type}, ${me.hp}/${stats(me).maxHp} hp, ${me.gold} gold, level ${me.level}`);
    this.finish(outcome.summary);
    // A level crossed in the fight may ask for a pick of abilities now; a full bag asks about the loot.
    if (this.game_.me.offer || this.game_.me.picks.length) this.offerChoice();
  }

  // ---- drawing -----------------------------------------------------------------------------------------------------

  /**
   * Everything on the board not drawn yet: at the start the whole world, later each area the board has grown (the ground
   * in its theme's colour, its name, its roads, its spots, its cover). The border and the camera's bounds follow the map.
   */
  private drawBoard(): void {
    const { board } = this.game_.state;
    const fresh = Object.values(board.areas).filter((a) => !this.drawn.has(a.id));
    if (!fresh.length) return;
    for (const area of fresh) {
      this.drawGround(area);
      this.drawn.add(area.id);
    }
    const spaces = Object.values(board.spaces).filter((s) => !this.circles.has(s.id));
    this.drawLinks(spaces, board.spaces);
    for (const space of spaces) this.drawSpace(space);
    for (const area of fresh) this.drawCover(area);
    this.border.clear();
    this.border.lineStyle(6, COLORS.border, 1);
    this.border.strokeRect(3, 3, board.width - 6, board.height - 6);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, board.width, board.height);
    this.minZoom = this.overviewZoom();
    if (this.lastZoom >= 0) {
      // Names drawn now follow the zoom's rule for names, like the rest.
      const hidden = cam.zoom < NAME_ZOOM;
      for (const name of this.names) name.setVisible(!hidden);
    }
    this.refreshCovers();
    if (this.drawn.size > fresh.length) this.log.note(`board grown: ${fresh.map((a) => a.name).join(', ')}; ${Object.keys(board.spaces).length} spaces, ${board.width} by ${board.height}`);
  }

  /** An area's ground in its theme's colour, its name written large and faint. */
  private drawGround(area: Area): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(THEME_COLORS[area.theme] ?? COLORS.ground, 1);
    g.fillRoundedRect(area.bounds.x, area.bounds.y, area.bounds.width, area.bounds.height, 60);
    // The name sits in the margin above the area's top spots, faint, readable from the overview.
    this.add
      .text(area.bounds.x + area.bounds.width / 2, area.bounds.y + 6, `${area.name} · tier ${area.tier} · levels ${area.levels[0]} to ${area.levels[1]}`, { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: COLORS.text, resolution: 2 })
      .setOrigin(0.5, 0)
      .setAlpha(0.4)
      .setDepth(1);
  }

  /** The roads of the given spots: each link once, and a link to a spot drawn earlier (the passage from a boss into a grown area). */
  private drawLinks(spaces: Space[], all: Record<string, Space>): void {
    const fresh = new Set(spaces.map((s) => s.id));
    this.links.lineStyle(6, COLORS.link, 1);
    for (const space of spaces) {
      for (const other of space.links) {
        if (!fresh.has(other) || space.id < other) {
          const b = all[other];
          if (b) this.links.lineBetween(space.x, space.y, b.x, b.y);
        }
      }
    }
  }

  private drawSpace(space: Space): void {
    const color = KIND_COLORS[space.kind];
    const radius = space.kind === 'boss' ? BOSS_RADIUS : space.kind === 'normal' ? WILD_RADIUS : SPACE_RADIUS;
    const ring = this.add.circle(space.x, space.y, RING_RADIUS);
    ring.setStrokeStyle(4, LIT, 1).setVisible(false).setDepth(4);
    this.rings.set(space.id, ring);

    const circle = this.add.circle(space.x, space.y, radius, color, 1).setDepth(5);
    circle.setStrokeStyle(space.kind === 'boss' ? 6 : 3, 0xffffff, space.kind === 'boss' ? 0.7 : 0.25);
    circle.setInteractive(new Phaser.Geom.Circle(radius, radius, TAP_RADIUS), Phaser.Geom.Circle.Contains);
    // A tap is a release that did not travel: a drag that ends on a spot is not a tap.
    circle.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.getDistance() < TAP_MAX && this.time.now - this.overlayClosedAt > 250 && this.game.loop.frame - this.overlayClosedFrame > 3) this.onSpaceTap(space.id);
    });
    this.circles.set(space.id, circle);

    const letter = KIND_LETTERS_SHOWN[space.kind];
    if (letter) {
      this.add
        .text(space.x, space.y, letter, { fontFamily: FONT, fontSize: space.kind === 'boss' ? '26px' : '20px', fontStyle: 'bold', color: '#101318', resolution: 2 })
        .setOrigin(0.5)
        .setDepth(6);
    }
    if (space.name) {
      // Only hubs have names; the wilds of the road show their circle and nothing more.
      const name = this.add
        .text(space.x, space.y + radius + 4, space.name, { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: COLORS.text, align: 'center', resolution: 2 })
        .setOrigin(0.5, 0)
        .setDepth(6);
      this.names.push(name);
      if (space.kind === 'boss') {
        const label = this.add
          .text(space.x, space.y + radius + 20, '', { fontFamily: FONT, fontSize: '12px', color: COLORS.dim, align: 'center', resolution: 2 })
          .setOrigin(0.5, 0)
          .setDepth(6);
        this.bossLabels.set(space.id, label);
        this.names.push(label);
      }
    }
  }

  /** A dark cover over an area, shown while it is not yet open: you can see there is more, not what. */
  private drawCover(area: Area): void {
    const b = area.bounds;
    const cover = this.add.rectangle(b.x + b.width / 2, b.y + b.height / 2, b.width, b.height, 0x0b0d14, 0.72).setDepth(8);
    this.covers.set(area.id, cover);
  }

  private refreshCovers(): void {
    const opened = new Set(this.game_.me.opened);
    for (const [areaId, cover] of this.covers) cover.setVisible(!opened.has(areaId));
  }

  /** Whatever has spawned: a mini-boss prowling or a merchant camped, as a badge above the spot. */
  private drawSpawns(): void {
    for (const mark of this.spawnMarks.values()) mark.destroy();
    this.spawnMarks.clear();
    const { board, spawns } = this.game_.state;
    for (const [spaceId, spawn] of Object.entries(spawns)) {
      const space = board.spaces[spaceId];
      if (!space) continue;
      const mini = spawn.kind === 'miniboss';
      const badge = this.add.circle(0, 0, 14, mini ? 0xd9534f : 0xe8b84a, 1).setStrokeStyle(3, 0x101318, 1);
      const text = this.add.text(0, 0, mini ? '!' : '$', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#101318', resolution: 2 }).setOrigin(0.5);
      const mark = this.add.container(space.x + 22, space.y - 24, [badge, text]).setDepth(9);
      this.tweens.add({ targets: mark, y: mark.y - 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.spawnMarks.set(spaceId, mark);
    }
  }

  /** The boss labels: level, and how long until a beaten boss is back. Once a second. */
  private refreshClocks(): void {
    const me = this.game_.me;
    const now = this.game_.now();
    for (const [spaceId, label] of this.bossLabels) {
      const space = this.game_.state.board.spaces[spaceId]!;
      const boss = space.boss ? creature(space.boss, this.game_.state.board.bestiary) : undefined;
      const left = (me.cooldowns[spaceId] ?? 0) - now;
      label.setText(left > 0 ? `${boss?.name ?? 'boss'} · back in ${countdown(left)}` : `${boss?.name ?? 'boss'} · level ${boss?.level ?? '?'}`);
      this.circles.get(spaceId)?.setAlpha(left > 0 ? 0.45 : 1);
    }
  }

  private drawToken(): void {
    const me = this.game_.me;
    const space = this.game_.state.board.spaces[me.space]!;
    const body = this.add.circle(0, 0, TOKEN_RADIUS, CLASS_COLORS[me.classId] ?? 0xffffff, 1);
    body.setStrokeStyle(3, 0x101318, 1);
    const letter = this.add
      .text(0, 0, CLASS_DATA[me.classId].name.charAt(0), { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#101318', resolution: 2 })
      .setOrigin(0.5);
    this.token = this.add.container(space.x, space.y - SPACE_RADIUS - 6, [body, letter]).setDepth(10);
  }

  // ---- the camera --------------------------------------------------------------------------------------------------

  private setupCamera(board: Board): void {
    const cam = this.cameras.main;
    // The band between the HUD panel and the bottom controls; the HUD scene draws over the rest.
    cam.setViewport(0, HUD_HEIGHT, DESIGN_WIDTH, VIEW_HEIGHT);
    cam.setBounds(0, 0, board.width, board.height);
    cam.setRoundPixels(true);
    this.minZoom = this.overviewZoom();
    this.follow(true);
  }

  /** The box round everything open, and the zoom that fits it in the band. */
  private openBounds(): { x: number; y: number; width: number; height: number } {
    const areas = Object.values(this.game_.state.board.areas).filter((a) => this.game_.me.opened.includes(a.id));
    const list: Area[] = areas.length ? areas : Object.values(this.game_.state.board.areas);
    const x = Math.min(...list.map((a) => a.bounds.x));
    const y = Math.min(...list.map((a) => a.bounds.y));
    const right = Math.max(...list.map((a) => a.bounds.x + a.bounds.width));
    const bottom = Math.max(...list.map((a) => a.bounds.y + a.bounds.height));
    return { x, y, width: right - x, height: bottom - y };
  }

  private overviewZoom(): number {
    const cam = this.cameras.main;
    const b = this.openBounds();
    // The hand-laid world fits at 0.12 or more; a world grown wider than that may pull back further, down to the floor.
    const fit = Math.min(cam.width / b.width, cam.height / b.height);
    return Math.max(fit >= HARD_MIN_ZOOM ? HARD_MIN_ZOOM : ZOOM_FLOOR, fit);
  }

  /** Follow the token at the follow zoom. `snap` puts the camera there at once; otherwise it glides from where it is. */
  private follow(snap: boolean): void {
    const cam = this.cameras.main;
    cam.panEffect.reset();
    const { scrollX, scrollY } = cam;
    cam.startFollow(this.token, true, FOLLOW_LERP, FOLLOW_LERP);
    if (snap) {
      cam.zoomEffect.reset();
      cam.setZoom(FOLLOW_ZOOM);
    } else {
      // startFollow jumps to the token; put the camera back and let the lerp carry it there.
      cam.setScroll(scrollX, scrollY);
      cam.zoomTo(FOLLOW_ZOOM, CAMERA_MS, 'Sine.easeInOut', true);
    }
    this.setFollowing(true);
  }

  private unfollow(): void {
    this.cameras.main.stopFollow();
    this.setFollowing(false);
  }

  private setFollowing(following: boolean): void {
    if (this.following === following) return;
    this.following = following;
    this.hud?.setFollowing(following);
  }

  /** Everything open in the band, following stopped. */
  private overview(): void {
    const cam = this.cameras.main;
    const b = this.openBounds();
    this.minZoom = this.overviewZoom();
    this.unfollow();
    cam.pan(b.x + b.width / 2, b.y + b.height / 2, CAMERA_MS, 'Sine.easeInOut', true);
    cam.zoomTo(this.minZoom, CAMERA_MS, 'Sine.easeInOut', true);
    this.log.note('map overview');
  }

  /** Frame these points: their box plus padding, zoomed between the minimum and the follow zoom, following stopped. */
  private frame(points: { x: number; y: number }[]): void {
    const cam = this.cameras.main;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    minX -= FRAME_PAD;
    minY -= FRAME_PAD;
    maxX += FRAME_PAD;
    maxY += FRAME_PAD;
    const zoom = Phaser.Math.Clamp(Math.min(cam.width / (maxX - minX), cam.height / (maxY - minY)), this.minZoom, FOLLOW_ZOOM);
    this.unfollow();
    cam.pan((minX + maxX) / 2, (minY + maxY) / 2, CAMERA_MS, 'Sine.easeInOut', true);
    cam.zoomTo(zoom, CAMERA_MS, 'Sine.easeInOut', true);
  }

  private setZoom(zoom: number): void {
    this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, Math.min(this.minZoom, HARD_MIN_ZOOM * 1.5), MAX_ZOOM));
  }

  // ---- touch: drag to pan, pinch to zoom, wheel to zoom -----------------------------------------------------------

  private setupInput(): void {
    this.input.addPointer(1); // two fingers for a pinch (plus the mouse)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.input.on('wheel', (p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => this.onWheel(p, dy));
  }

  /** Inside the band the world is seen through; a touch on the HUD's panel or strip is not the world's. */
  private inView(p: Phaser.Input.Pointer): boolean {
    return p.y >= HUD_HEIGHT && p.y < HUD_HEIGHT + VIEW_HEIGHT;
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (!this.inView(p)) return;
    const { pointer1, pointer2 } = this.input;
    if (pointer1?.isDown && pointer2?.isDown) {
      const cam = this.cameras.main;
      cam.zoomEffect.reset();
      this.pinch = { zoom: cam.zoom, distance: Phaser.Math.Distance.Between(pointer1.x, pointer1.y, pointer2.x, pointer2.y) || 1 };
      this.drag = null;
      return;
    }
    this.drag = { pointer: p.id, lastX: p.x, lastY: p.y, moved: false };
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    const cam = this.cameras.main;
    if (this.pinch) {
      const { pointer1, pointer2 } = this.input;
      if (pointer1?.isDown && pointer2?.isDown) {
        const distance = Phaser.Math.Distance.Between(pointer1.x, pointer1.y, pointer2.x, pointer2.y);
        this.setZoom((this.pinch.zoom * distance) / this.pinch.distance);
      }
      return;
    }
    const drag = this.drag;
    if (!drag || p.id !== drag.pointer || !p.isDown) return;
    if (!drag.moved) {
      if (p.getDistance() <= DRAG_START) {
        drag.lastX = p.x;
        drag.lastY = p.y;
        return;
      }
      drag.moved = true;
      this.unfollow();
      cam.panEffect.reset();
    }
    // Design pixels moved on the screen are world pixels over the zoom.
    cam.scrollX -= (p.x - drag.lastX) / cam.zoom;
    cam.scrollY -= (p.y - drag.lastY) / cam.zoom;
    drag.lastX = p.x;
    drag.lastY = p.y;
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (this.pinch) {
      const { pointer1, pointer2 } = this.input;
      if (!(pointer1?.isDown && pointer2?.isDown)) this.pinch = null;
      this.drag = null;
      return;
    }
    if (this.drag && p.id === this.drag.pointer) this.drag = null;
  }

  private onWheel(p: Phaser.Input.Pointer, deltaY: number): void {
    if (!this.inView(p) || deltaY === 0) return;
    const cam = this.cameras.main;
    cam.zoomEffect.reset();
    this.setZoom(deltaY > 0 ? cam.zoom / WHEEL_STEP : cam.zoom * WHEEL_STEP);
  }

  // ---- play --------------------------------------------------------------------------------------------------------

  /**
   * Light up every spot the owed roll can end on, inside the open areas. One place to go and no dice card in the bag:
   * walk at once. Otherwise frame them and wait for a tap, with the dice cards offered in the HUD's row.
   */
  private offerChoices(lead = ''): void {
    const me = this.game_.me;
    const { board } = this.game_.state;
    const value = this.game_.state.die.last ?? me.steps;
    const options = reachable(board, me.space, me.steps, new Set(me.opened));
    if (options.length === 0) {
      this.finish(`No way to walk ${me.steps} from here.`);
      return;
    }
    const cards = this.diceChips();
    if (options.length === 1 && cards.length === 0) {
      this.setMessage(`Rolled ${value}.`);
      this.go(options[0]!.path);
      return;
    }
    this.choices_ = new Map(options.map((o) => [o.space, o.path]));
    const rings: Phaser.GameObjects.Arc[] = [];
    for (const o of options) {
      const ring = this.rings.get(o.space);
      if (ring) rings.push(ring.setVisible(true).setAlpha(1));
    }
    this.tweens.add({ targets: rings, alpha: 0.25, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.frame([this.token, ...options.map((o) => board.spaces[o.space]!)]);
    this.hud?.setChips(cards);
    this.setMessage(`${lead || `Rolled ${value}.`} Tap a lit spot to walk there.`);
  }

  /** The dice cards in the bag, as chips for the HUD's row. Exactly N turns the row into the numbers. */
  private diceChips(): Chip[] {
    const me = this.game_.me;
    const chips: Chip[] = [];
    for (const [id, n] of Object.entries(me.items)) {
      const item = ITEMS[id];
      if (!item?.dice || n <= 0) continue;
      const text = n > 1 ? `${item.name} ×${n}` : item.name;
      if (item.dice === 'exact') {
        chips.push({
          text,
          onTap: () => {
            const sides = this.game_.state.die.sides;
            const numbers: Chip[] = Array.from({ length: sides }, (_, i) => ({ text: String(i + 1), onTap: () => this.useCard(id, i + 1) }));
            this.hud?.setChips([...numbers, { text: '×', onTap: () => this.hud?.setChips(this.diceChips()) }]);
          },
        });
      } else {
        chips.push({ text, onTap: () => this.useCard(id) });
      }
    }
    // A Lucky Charm worn: a re-roll, once every so often.
    const lucky = powers(me).lucky;
    if (lucky) {
      const left = (me.cooldowns.charm ?? 0) - this.game_.now();
      chips.push({ text: left > 0 ? `Charm ${countdown(left)}` : 'Charm', onTap: () => (left > 0 ? this.setMessage(`The charm is spent; again in ${countdown(left)}.`) : this.useCard('charm')) });
    }
    return chips;
  }

  /** Whatever question is pending: the gambler's, a town's errand, a piece with no room in the bag, or a level's pick of one ability in two. */
  private offerChoice(): void {
    const me = this.game_.me;
    const offer = me.offer;
    if (offer?.kind === 'gamble') this.offerGamble();
    else if (offer?.kind === 'quest') this.offerQuest();
    else if (offer?.kind === 'loot') this.offerKeep();
    else if (me.picks.length) this.offerPick();
  }

  /** A level's pick: the two abilities as chips; the one tapped is learned (mine, 2026-11-01). */
  private offerPick(): void {
    const options = this.game_.me.picks[0];
    if (!options) return;
    this.setBusy(true);
    const name = (id: string) => ABILITIES[id]?.name ?? id;
    const known = (id: string) => this.game_.me.abilities[id] ?? 0;
    this.setMessage(`Level ${this.game_.me.level}: pick one. ${options.map((id) => `${name(id)}: ${ABILITIES[id]?.text ?? ''}`).join(' ')}`);
    this.hud?.setChips(options.map((id) => ({ text: known(id) ? `${name(id)} R${known(id) + 1}` : name(id), onTap: () => this.answerPick(id) })));
  }

  /** A town's errand: Take it or Not now (mine, 2026-11-01). */
  private offerQuest(): void {
    const offer = this.game_.me.offer;
    if (!offer || offer.kind !== 'quest') return;
    this.setBusy(true);
    const q = offer.quest;
    this.setMessage(`An errand from ${this.game_.state.board.spaces[q.town]?.name ?? 'the town'}: ${q.text} Pays ${q.gold} gold and ${q.xp} xp${q.unique ? ', maybe a unique' : ''}.`);
    this.hud?.setChips([
      { text: 'Take it', onTap: () => this.answerQuest(true) },
      { text: 'Not now', onTap: () => this.answerQuest(false) },
    ]);
  }

  answerQuest(accept: boolean): void {
    const events = this.game_.act({ type: 'quest', player: this.game_.player, accept });
    this.hud?.setChips([]);
    const taken = events.find((e) => e.type === 'questTaken');
    this.log.note(`quest ${accept ? 'taken' : 'declined'}`);
    this.finish(taken?.type === 'questTaken' ? `Errand taken: ${taken.quest.text}` : this.describe(events) === 'questDeclined' ? 'Maybe another time.' : this.describe(events));
  }

  /** A piece with no room in the bag: sold on the spot, or left (Robin, 2026-10-31: a bag limit with a sell-or-drop choice). */
  private offerKeep(): void {
    const offer = this.game_.me.offer;
    if (!offer || offer.kind !== 'loot') return;
    this.setBusy(true);
    const g = offer.gear;
    this.setMessage(`Your bag is full. ${describeGear(g)}: sell it here for ${sellPrice(g)} gold, or leave it?`);
    this.hud?.setChips([
      { text: `Sell for ${sellPrice(g)}`, onTap: () => this.answerKeep('sell') },
      { text: 'Leave it', onTap: () => this.answerKeep('drop') },
    ]);
  }

  answerKeep(choice: 'sell' | 'drop'): void {
    const events = this.game_.act({ type: 'keep', player: this.game_.player, choice });
    this.hud?.setChips([]);
    const sold = events.find((e) => e.type === 'sold');
    const dropped = events.find((e) => e.type === 'dropped');
    this.finish(sold?.type === 'sold' ? `Sold ${sold.gear.name} for ${sold.price} gold.` : dropped?.type === 'dropped' ? `Left ${dropped.gear.name} behind.` : this.describe(events));
  }

  answerPick(ability: string): void {
    const events = this.game_.act({ type: 'pick', player: this.game_.player, ability });
    this.hud?.setChips([]);
    const picked = events.find((e) => e.type === 'picked');
    if (picked?.type === 'picked') {
      this.log.note(`picked ${picked.ability} rank ${picked.rank}`);
      this.finish(`Learned ${ABILITIES[picked.ability]?.name ?? picked.ability}${picked.rank > 1 ? `, rank ${picked.rank}` : ''}. ${ABILITIES[picked.ability]?.text ?? ''}`.trim());
    } else {
      this.finish(this.describe(events));
    }
  }

  /** The gambler's question in the HUD's row. */
  private offerGamble(): void {
    const offer = this.game_.me.offer;
    if (!offer || offer.kind !== 'gamble') return;
    this.setBusy(true);
    this.setMessage(`A gambler offers double or nothing on ${offer.stake} gold. The die: high (4 to 6) or low (1 to 3)?`);
    this.hud?.setChips([
      { text: 'High', onTap: () => this.answerGamble('high') },
      { text: 'Low', onTap: () => this.answerGamble('low') },
      { text: 'Walk on', onTap: () => this.answerGamble('pass') },
    ]);
  }

  private onSpaceTap(id: string): void {
    const me = this.game_.me;
    if (!this.choices_) {
      const space = this.game_.state.board.spaces[id];
      if (!space) return;
      // Standing on a shop or a town with nothing pending: a tap on it goes back in. Any other spot tells about itself.
      if (!this.busy && id === me.space && (space.kind === 'shop' || space.kind === 'town')) {
        this.openShop(false);
        return;
      }
      this.flashHint(id);
      this.setMessage(hintFor(this.game_.state, id, this.game_.player, this.game_.now()));
      return;
    }
    const path = this.choices_.get(id);
    if (!path) {
      this.setMessage(`Not ${me.steps} steps away. Tap a lit spot.`);
      return;
    }
    this.clearChoices();
    this.log.note(`chose ${id}`);
    this.go(path);
  }

  /** A short flash on a spot the player asked about. */
  private flashHint(id: string): void {
    const ring = this.rings.get(id);
    if (!ring || this.choices_) return;
    this.tweens.killTweensOf(ring);
    ring.setVisible(true).setAlpha(1);
    this.tweens.add({ targets: ring, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => ring.setVisible(false).setAlpha(1) });
  }

  private clearChoices(): void {
    if (!this.choices_) return;
    for (const id of this.choices_.keys()) {
      const ring = this.rings.get(id);
      if (ring) {
        this.tweens.killTweensOf(ring);
        ring.setVisible(false).setAlpha(1);
      }
    }
    this.choices_ = null;
    this.hud?.setChips([]);
  }

  /** Send the move, then follow the token as it walks; what the landing brought comes after. */
  private go(path: string[]): void {
    const moved = this.game_.act({ type: 'move', player: this.game_.player, path });
    const landed = moved.find((e) => e.type === 'landed');
    if (!landed || landed.type !== 'landed') {
      this.finish(this.describe(moved));
      return;
    }
    const value = this.game_.state.die.last;
    this.follow(false);
    this.walk(path, () => {
      const space = this.game_.state.board.spaces[landed.space]!;
      const kind = SPACE_KIND_DATA[space.kind].label.toLowerCase();
      const where = space.name ? `on ${space.name} (${kind})` : space.kind === 'normal' ? 'in the wilds' : `on a ${kind}`;
      const story = this.describeLanding(moved);
      this.log.note(`landed on ${space.id} (${space.kind}): ${story || 'nothing'}`);
      const me = this.game_.me;
      if (me.fight) {
        this.openFight();
        return;
      }
      if (me.offer || me.picks.length) {
        this.offerChoice();
        return;
      }
      if (space.kind === 'shop' || space.kind === 'town' || moved.some((e) => e.type === 'merchant')) {
        this.setMessage(`Rolled ${value}. Landed ${where}. ${story}`.trimEnd());
        this.refreshHud();
        this.openShop(moved.some((e) => e.type === 'merchant'));
        return;
      }
      this.finish(`Rolled ${value}. Landed ${where}. ${story}`.trimEnd());
    });
  }

  private walk(path: string[], done: () => void): void {
    const spaces = this.game_.state.board.spaces;
    this.tweens.chain({
      targets: this.token,
      tweens: path.map((id) => {
        const s = spaces[id]!;
        return { x: s.x, y: s.y - SPACE_RADIUS - 6, duration: STEP_MS, ease: 'Sine.easeInOut' };
      }),
      onComplete: done,
    });
  }

  /** A fight is on: the board waits under the fight scene until it is over. */
  private openFight(): void {
    const fight = this.game_.me.fight;
    if (!fight) return;
    this.setBusy(true);
    this.setMessage(`${fight.enemy.name} (level ${fight.enemy.level}) blocks the way.`);
    this.refreshHud();
    this.scene.launch('fight');
  }

  /** The shop is open: the board waits under the shop scene until the player leaves. */
  private openShop(merchant: boolean): void {
    this.setBusy(true);
    this.scene.launch('shop', { merchant });
  }

  private finish(message: string): void {
    this.setMessage(message);
    this.refreshHud();
    this.setBusy(false);
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.hud?.setBusy(busy);
  }

  /** The HUD's lines: level, HP, mana, gold; the area and the spot. The fight, shop and bag scenes call it too. */
  refreshHud(): void {
    const me = this.game_.me;
    const s = stats(me);
    const space = this.game_.state.board.spaces[me.space];
    const area = space ? this.game_.state.board.areas[space.area] : undefined;
    const where = space ? space.name || SPACE_KIND_DATA[space.kind].label : me.space;
    this.hud?.setStats(`Lv ${me.level} · HP ${me.hp}/${s.maxHp} · MP ${me.mana}/${s.maxMana} · Gold ${me.gold}`, `${area?.name ?? ''} · ${where}`);
  }

  private setMessage(text: string): void {
    this.hud?.setMessage(text);
  }

  /** What the landing brought, in words, from the events after `landed`. */
  private describeLanding(events: GameEvent[]): string {
    const parts: string[] = [];
    for (const e of events) {
      switch (e.type) {
        case 'rested':
          parts.push('Rested: HP and mana full.');
          break;
        case 'chest':
          parts.push('A chest!');
          break;
        case 'gold':
          parts.push(e.delta > 0 ? `+${e.delta} gold.` : e.delta < 0 ? `−${-e.delta} gold.` : '');
          break;
        case 'loot':
          parts.push(`Found ${describeGear(e.gear)}.`);
          break;
        case 'found':
          parts.push(`+${e.count} ${ITEMS[e.item]?.name ?? e.item}.`);
          break;
        case 'healed':
          parts.push(e.amount > 0 ? `Healed ${e.amount} HP.` : '');
          break;
        case 'learned':
          parts.push(`Learned ${ABILITIES[e.ability]?.name ?? e.ability}, rank ${e.rank}.`);
          break;
        case 'picked':
          parts.push(`Learned ${ABILITIES[e.ability]?.name ?? e.ability}, rank ${e.rank}.`);
          break;
        case 'questProgress':
          parts.push(`Errand: ${e.quest.done} of ${e.quest.count}.`);
          break;
        case 'questDone':
          parts.push(`Errand done: ${e.quest.text}`);
          break;
        case 'bagFull':
          parts.push(e.sold !== null ? `No room in the bag: ${e.gear.name} sold for ${e.sold} gold.` : '');
          break;
        case 'levelled':
          parts.push(`Level ${e.level}!`);
          break;
        case 'empty':
          parts.push(`Empty for now; again in ${countdown(e.until - this.game_.now())}.`);
          break;
        case 'nothing':
          parts.push(e.text);
          break;
        case 'merchant':
          parts.push('A wandering merchant has set up here.');
          break;
        default:
          break;
      }
    }
    return parts.filter(Boolean).join(' ');
  }

  private describe(events: GameEvent[]): string {
    const rejected = events.find((e) => e.type === 'rejected');
    if (rejected && rejected.type === 'rejected') return `Not allowed: ${rejected.reason}.`;
    return events.map((e) => e.type).join(', ') || 'Nothing happened.';
  }
}
