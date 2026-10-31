// The world: Ashford Isle drawn in world pixels (links, spaces, rings, the token), a camera that follows the
// character, and the touch input (tap a space, drag to pan, pinch to zoom). The fixed chrome is HudScene, launched
// from here. No art yet: shapes and labels (the Art Director's sprites come later). Everything here is drawing and
// input; what happens is decided by the rules through LocalGame.

import Phaser from 'phaser';
import {
  CLASS_DATA,
  ITEMS,
  reachable,
  SPACE_KIND_DATA,
  type Board,
  type GameEvent,
  type Space,
  type SpaceKind,
} from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, VIEW_HEIGHT } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';
import type { FightOutcome } from './FightScene.ts';
import type { CardChip, HudScene } from './HudScene.ts';

export interface BoardSceneDeps {
  game: LocalGame;
  log: GameLog;
}

const SPACE_RADIUS = 26;
const TAP_RADIUS = 38; // thumbs are wide: the tap area is bigger than the circle
const RING_RADIUS = 34;
const TOKEN_RADIUS = 15;
const STEP_MS = 260;
const LIT = 0xfff27a;

// The camera (mine, 2026-10-31: numbers to start with).
const FOLLOW_ZOOM = 0.8; // walking about
const MAX_ZOOM = 1.4; // the closest a pinch gets
const FRAME_PAD = 80; // world pixels round the token and the lit spaces when a roll is framed
const CAMERA_MS = 350; // a pan or a zoom
const FOLLOW_LERP = 0.12;
const NAME_ZOOM = 0.45; // below this the hub names are hidden
const DRAG_START = 8; // design pixels a finger moves before a touch becomes a drag
const TAP_MAX = 10; // a finger that moved less than this on release tapped
const WHEEL_STEP = 1.1; // one notch of a mouse wheel

// One colour per kind of space (mine, 2026-10-31, placeholders until the art comes).
const KIND_COLORS: Record<SpaceKind, number> = {
  town: 0x4fb06d,
  battle: 0xd9534f,
  shop: 0xe8b84a,
  event: 0x8e6ad9,
  treasure: 0xf0a030,
  quest: 0x4aa3df,
  bossgate: 0x8f2f3b,
  shrine: 0x7fd8d8,
};

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
  private readonly names: Phaser.GameObjects.Text[] = [];
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
    this.drawGround(board);
    this.drawLinks(board.spaces);
    for (const space of Object.values(board.spaces)) this.drawSpace(space);
    this.drawToken();
    this.setupCamera(board);
    this.setupInput();
    this.log.note(`board scene ready: ${Object.keys(board.spaces).length} spaces, ${board.width} by ${board.height}`);
    this.scene.launch('hud');
  }

  /** The HUD is drawn: show the first message, and re-offer a choice the page was closed in the middle of. */
  hudReady(hud: HudScene): void {
    this.hud = hud;
    hud.setFollowing(this.following);
    hud.setBusy(this.busy);
    this.refreshHud();
    const me = this.game_.me;
    if (me.fight) {
      // The page was closed mid-fight: the fight is still on.
      hud.setDie(String(this.game_.state.die.last ?? '–'));
      this.openFight();
    } else if (me.steps > 0) {
      // The roll is still owed, so offer the same choice again.
      hud.setDie(String(this.game_.state.die.last ?? me.steps));
      this.setBusy(true);
      this.offerChoices();
    } else {
      this.setMessage(`Tap Roll to move ${me.name}.`);
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

  /** The shop scene is done: close it and give the turn back. */
  shopLeft(): void {
    this.scene.stop('shop');
    const space = this.game_.state.board.spaces[this.game_.me.space];
    this.finish(`Left ${space?.name || 'the shop'}. Tap it again to go back in.`);
  }

  /** The fight scene is done: close it, and if the character was beaten, put the token in the town it woke in. */
  fightOver(outcome: FightOutcome): void {
    this.scene.stop('fight');
    const me = this.game_.me;
    if (outcome.type === 'died') {
      const town = this.game_.state.board.spaces[me.space]!;
      this.token.setPosition(town.x, town.y - SPACE_RADIUS - 6);
      this.follow(true);
    }
    this.log.note(`fight over: ${outcome.type}, ${me.hp}/${me.maxHp} hp, ${me.gold} gold, level ${me.level}`);
    this.finish(outcome.summary);
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
      if (this.choices_) this.setMessage('Tap a lit space first.');
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

  /** Map: the whole island; Back: the camera returns to the character. */
  toggleMap(): void {
    if (this.following) this.overview();
    else this.follow(false);
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

  // ---- drawing -----------------------------------------------------------------------------------------------------

  /** The island's ground and a thin border on its bounds, so the edge shows when zoomed out. */
  private drawGround(board: Board): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.ground, 1);
    g.fillRect(0, 0, board.width, board.height);
    g.lineStyle(6, COLORS.border, 1);
    g.strokeRect(3, 3, board.width - 6, board.height - 6);
  }

  private drawLinks(spaces: Record<string, Space>): void {
    const g = this.add.graphics().setDepth(1);
    g.lineStyle(6, COLORS.link, 1);
    for (const space of Object.values(spaces)) {
      for (const other of space.links) {
        if (space.id < other) {
          const b = spaces[other];
          if (b) g.lineBetween(space.x, space.y, b.x, b.y);
        }
      }
    }
  }

  private drawSpace(space: Space): void {
    const color = KIND_COLORS[space.kind];
    const ring = this.add.circle(space.x, space.y, RING_RADIUS);
    ring.setStrokeStyle(4, LIT, 1).setVisible(false).setDepth(4);
    this.rings.set(space.id, ring);

    const circle = this.add.circle(space.x, space.y, SPACE_RADIUS, color, 1).setDepth(5);
    circle.setStrokeStyle(space.kind === 'bossgate' ? 5 : 3, 0xffffff, space.kind === 'bossgate' ? 0.6 : 0.25);
    circle.setInteractive(new Phaser.Geom.Circle(SPACE_RADIUS, SPACE_RADIUS, TAP_RADIUS), Phaser.Geom.Circle.Contains);
    // A tap is a release that did not travel: a drag that ends on a space is not a tap.
    circle.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.getDistance() < TAP_MAX) this.onSpaceTap(space.id);
    });

    const label = SPACE_KIND_DATA[space.kind].label;
    this.add
      .text(space.x, space.y, label.charAt(0), { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#101318', resolution: 2 })
      .setOrigin(0.5)
      .setDepth(6);
    if (space.name) {
      // Only hubs have names; road spaces show their kind's letter and nothing more.
      const name = this.add
        .text(space.x, space.y + SPACE_RADIUS + 4, space.name, {
          fontFamily: FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          color: COLORS.text,
          align: 'center',
          resolution: 2,
        })
        .setOrigin(0.5, 0)
        .setDepth(6);
      this.names.push(name);
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
    // Zoomed all the way out, the whole island fits the band.
    this.minZoom = Math.min(cam.width / board.width, cam.height / board.height);
    this.follow(true);
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

  /** The whole island in the band, following stopped. */
  private overview(): void {
    const cam = this.cameras.main;
    const { board } = this.game_.state;
    this.unfollow();
    cam.pan(board.width / 2, board.height / 2, CAMERA_MS, 'Sine.easeInOut', true);
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
    this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, this.minZoom, MAX_ZOOM));
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
   * Light up every space the owed roll can end on. One place to go and no dice card in the bag: walk at once. Otherwise
   * frame them and wait for a tap, with the dice cards offered in the HUD's row (mine: a card can still change the roll).
   */
  private offerChoices(lead = ''): void {
    const me = this.game_.me;
    const { board } = this.game_.state;
    const value = this.game_.state.die.last ?? me.steps;
    const options = reachable(board, me.space, me.steps);
    if (options.length === 0) {
      this.finish(`No way to walk ${me.steps} from here.`);
      return;
    }
    const cards = this.diceCards();
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
    this.hud?.setCards(cards);
    this.setMessage(`${lead || `Rolled ${value}.`} Tap a lit space to walk there.`);
  }

  /** The dice cards in the bag, for the HUD's row. */
  private diceCards(): CardChip[] {
    return Object.entries(this.game_.me.items)
      .filter(([id, n]) => n > 0 && ITEMS[id]?.dice)
      .map(([id, n]) => ({ item: id, label: ITEMS[id]!.name, count: n }));
  }

  private onSpaceTap(id: string): void {
    if (!this.choices_) {
      // Standing on a shop with nothing pending: a tap on it goes back in.
      const me = this.game_.me;
      if (!this.busy && id === me.space && this.game_.state.board.spaces[id]?.kind === 'shop') this.openShop();
      return;
    }
    const path = this.choices_.get(id);
    if (!path) {
      this.setMessage(`Not ${this.game_.me.steps} steps away. Tap a lit space.`);
      return;
    }
    this.clearChoices();
    this.log.note(`chose ${id}`);
    this.go(path);
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
    this.hud?.setCards([]);
  }

  /** Send the move, then follow the token as it walks. */
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
      const where = space.name ? `${space.name} (${kind})` : `${/^[aeiou]/.test(kind) ? 'an' : 'a'} ${kind} space`;
      this.log.note(`landed on ${space.id} (${space.kind}): ${this.describeLanding(moved) || 'nothing'}`);
      if (this.game_.me.fight) {
        this.openFight();
        return;
      }
      if (space.kind === 'shop') {
        this.setMessage(`Rolled ${value}. Landed on ${where}.`);
        this.refreshHud();
        this.openShop();
        return;
      }
      this.finish(`Rolled ${value}. Landed on ${where}. ${this.describeLanding(moved)}`.trimEnd());
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
    this.setMessage(`A ${fight.enemy.name} blocks the way.`);
    this.refreshHud();
    this.scene.launch('fight');
  }

  /** The shop is open: the board waits under the shop scene until the player leaves. */
  private openShop(): void {
    this.setBusy(true);
    this.scene.launch('shop');
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

  /** The HUD's stats line: level, HP, gold and where the character stands. The fight scene calls it after each round. */
  refreshHud(): void {
    const me = this.game_.me;
    const space = this.game_.state.board.spaces[me.space];
    const where = space ? space.name || SPACE_KIND_DATA[space.kind].label : me.space;
    this.hud?.setStats(`Lv ${me.level}   HP ${me.hp}/${me.maxHp}   Gold ${me.gold}   Space ${where}`);
  }

  private setMessage(text: string): void {
    this.hud?.setMessage(text);
  }

  /** What the space did, in words, from the events after `landed`. */
  private describeLanding(events: GameEvent[]): string {
    const parts: string[] = [];
    for (const e of events) {
      if (e.type === 'event') parts.push(e.text);
      else if (e.type === 'gold') parts.push(e.delta > 0 ? `Found ${e.delta} gold.` : e.delta < 0 ? `Lost ${-e.delta} gold.` : 'Your purse was already empty.');
      else if (e.type === 'healed') parts.push(e.amount > 0 ? `Healed ${e.amount} HP.` : 'HP already full.');
    }
    return parts.join(' ');
  }

  private describe(events: GameEvent[]): string {
    const rejected = events.find((e) => e.type === 'rejected');
    if (rejected && rejected.type === 'rejected') return `Not allowed: ${rejected.reason}.`;
    return events.map((e) => e.type).join(', ') || 'Nothing happened.';
  }
}
