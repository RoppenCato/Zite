// The world: areas by tier drawn in world pixels (each area's ground, the links, the spots, bosses on the board,
// whatever has spawned), a camera that follows the character, and the touch input (tap a spot for a hint or a choice,
// drag to pan, pinch to zoom). The fixed chrome is HudScene, launched from here; the fight, the shop and the bag are
// scenes launched over both. An area whose theme has a kit (boardkit.ts: Cloverfield Meadows since 2026-11-01) is drawn
// from it, tiles, roads, plates and props; the rest is still shapes and labels. Everything here is drawing and input; what happens is
// decided by the rules through the holder (LocalGame alone, or RemoteGame with the server). A chest, a vault or a boss's
// drop opens the loot reveal (RevealScene) before the board goes on.
// Other players stand on the board as small marks with their names; the HUD says whether the world is online.

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
  makeRng,
  plainGear,
  RARITIES,
  reachable,
  rollGear,
  rollUnique,
  sellPrice,
  SLOTS,
  SPACE_KIND_DATA,
  stats,
  TRACES,
  traceLine,
  WORLD_DATA,
  type Area,
  type Board,
  type GameEvent,
  type GearItem,
  type Rarity,
  type Space,
  type SpaceKind,
  groundsOf,
  questLine,
  placeName,
  inTownWalls,
  groundAt, townKind, arenaOpen, arenaSpot, arenaFee, arenaTried, ARENA, nextDay, type ArenaMode, DUNGEONS, walkable, bossKnown, hubOf, strollPath, sealAt, sealsAllWon } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { audio } from '../audio.ts';
import { releaseBackdrops } from '../backdrop.ts';
import secretData from '../../../assets/world_moved/secrets.json';
import { drawArenaBuilding, loadArenaFor, type ArenaDrawn } from '../arena.ts';
import { drawCrownDoor, allProps, groundDepth, placesAtlas, propArea, raiseTallProps, TOP_MARGIN, drawKitBanner, drawKitCover, drawKitGround, drawKitPlate, drawKitProps, drawKitRoads, KIT_DEPTH, kitFor, preloadBoardKits, standingDepth, clearKitProps, dressPlate, freeRegion, preloadRegion, regionHeld, regionPlaces, themedPlaces, SECRET_PLACES } from '../boardkit.ts';
import { releaseCreatures } from '../creatures.ts';
import { feel, sfx } from '../feel.ts';
import { Hero, HERO_BOARD_SCALE, heroReady, preloadHero, preloadWornSets } from '../hero.ts';
import { preloadAbilityIcons, preloadSeals } from '../effects.ts';
import { FOG_FAR_PIECES, FOG_PIECES, PaintedGround, PAINTED, preloadWorldMap, SEA, CHUNK_ZOOM, DUNGEON_LAND, BAKED_ROADS, FOG_EAST_PIECES } from '../worldmap.ts';
import { fx, hasFrame, icon, itemFrame, plate, preloadKit } from '../kit.ts';
import { lootReady, preloadLoot, prizesIn, type Prize, type RevealRequest } from '../loot.ts';
import { COLORS, DESIGN_WIDTH, DPR, FONT, HUD_HEIGHT, THEME_COLORS, VIEW_HEIGHT, SCREEN_WIDTH, HUD_PLANK, PLANK_TOP } from '../layout.ts';
import type { GameHolder, Intent, WorldChange } from '../game-holder.ts';
import { settings } from '../settings.ts';
import { tips } from '../tips.ts';
import type { FightOutcome, FightScene } from './FightScene.ts';
import type { AskRequest } from './AskScene.ts';
import type { ClassId } from '../../../rules/src/index.ts';
import type { Chip, HudScene } from './HudScene.ts';
import { moments } from './MomentScene.ts';

export interface BoardSceneDeps {
  game: GameHolder;
  log: GameLog;
}

const SPACE_RADIUS = 26;
const WILD_RADIUS = 20; // the wilds are the many; they stay small
const BOSS_RADIUS = 34;
const TAP_RADIUS = 38; // thumbs are wide: the tap area is bigger than the circle
const RING_RADIUS = 42;
const TOKEN_RADIUS = 15;
const DOUBLE_TAP_MS = 320;
const MAP_TOP_PAD = 400;
interface WorldBridge {
  from: { x: number; y: number };
  to: { x: number; y: number };
  foot: { x: number; y: number };
  barred: string;
  open: string;
  opens: string;
}
const worldBridge = (): WorldBridge | undefined => (WORLD_DATA as unknown as { bridge?: WorldBridge }).bridge;
type WorldGate = Pick<WorldBridge, 'foot' | 'barred' | 'open' | 'opens'> & { theme?: string };
/** What stands in the way between lands: the bridge, the pass by Grumblebark's Glade, and the gate on the north shore. */
const worldGates = (): WorldGate[] => {
  return (WORLD_DATA as unknown as { gates?: WorldGate[] }).gates ?? [];
};
/** Whether a point lies within `margin` of a line segment. */
function nearSegment(x: number, y: number, a: { x: number; y: number }, b: { x: number; y: number }, margin: number): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(a.x + dx * t - x, a.y + dy * t - y) < margin;
}
/** The steps on an area's ground; the forest takes turns on roots and moss (Nigel, SD), the rest on grass until theirs come. */
function stepSound(theme: string | undefined): string {
  if (theme !== 'forest') return 'ui/step-grass';
  return `ui/step-${Math.random() < 0.5 ? 'roots' : 'moss'}-${1 + Math.floor(Math.random() * 3)}`;
}
const STEP_MS = 260;
const LIT = 0xfff27a;

// The camera (mine, 2026-10-31: numbers to start with).
// The zooms are world pixels per CSS pixel; the camera draws at the device's density, so each is multiplied by DPR (hires.ts).
const FOLLOW_ZOOM = 0.8 * DPR; // walking about
const MAX_ZOOM = 1.4 * DPR; // the closest a pinch gets
/** How near a region comes in and how far it goes out, in world pixels. */
const REGION_NEAR = 900;
const REGION_FAR = 1500;
const HARD_MIN_ZOOM = 0.12 * DPR; // the overview of the hand-laid world; a world grown wider may go lower, to the floor
const ZOOM_FLOOR = 0.0225 * DPR;
const FRAME_PAD = 80; // world pixels round the token and the lit spaces when a roll is framed
/** The lowest row of the screen that a framed spot may use: above the message's sign and its chips. */
const FRAME_BOTTOM = 738;
const CAMERA_MS = 350; // a pan or a zoom
const FOLLOW_LERP = 0.12;
const NAME_ZOOM = 0.45 * DPR; // below this the hub names are hidden
const DRAG_START = 8 * DPR; // in canvas pixels // design pixels a finger moves before a touch becomes a drag
const TAP_MAX = 10 * DPR; // in canvas pixels // a finger that moved less than this on release tapped
const WHEEL_STEP = 1.1; // one notch of a mouse wheel

// One colour and one letter per kind of spot (mine, 2026-10-31, placeholders until the art comes).
const KIND_COLORS: Record<SpaceKind, number> = {
  gear: 0xc98a3c,
  board: 0xe8b84a,
  town: 0x4fb06d,
  shop: 0xe8b84a,
  normal: 0x5d6678,
  chest: 0xf0a030,
  potion: 0x4aa3df,
  spell: 0x8e6ad9,
  church: 0xf4f0e4,
  boss: 0x8f2f3b,
  arena: 0xa23c2c,
  door: 0x6b5a48,
};
const KIND_LETTERS_SHOWN: Record<SpaceKind, string> = { arena: 'A', door: 'D', gear: 'L', board: 'Q', church: 'H', town: 'T', shop: '$', normal: '', chest: 'C', potion: '+', spell: '*', boss: 'B' };

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

/** A land's middle this near the map's edge: its words hang from the edge, so a phone shows them whole. */
const EDGE_WORDS = 2500;
const EDGE_INSET = 460;

export class BoardScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private readonly log: GameLog;
  /** The other players' marks, by player id (mine, 2026-11-01: who is where, dim when offline). */
  private readonly others = new Map<string, Phaser.GameObjects.Container>();
  /** True while an action is on its way to the world: nothing else is sent meanwhile. */
  private inFlight = false;
  private readonly rings = new Map<string, Phaser.GameObjects.Arc>();
  private readonly circles = new Map<string, Phaser.GameObjects.Arc | Phaser.GameObjects.Image>();
  /** True once an area has been drawn from a kit: the token then sorts by its feet among the props. */
  private kitted = false;
  private readonly names: Phaser.GameObjects.Text[] = [];
  /** Every drawn thing of a spot but its ring, to hide what the camera cannot see (mine, 2026-11-01: the board grows to hundreds of spots). */
  private readonly spotParts = new Map<string, { x: number; y: number; parts: (Phaser.GameObjects.Arc | Phaser.GameObjects.Image | Phaser.GameObjects.Text)[]; names: Phaser.GameObjects.Text[] }>();
  private lastCull = { x: NaN, y: NaN, zoom: NaN, count: -1 };
  private readonly bossLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly covers = new Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container>();
  private readonly spawnMarks = new Map<string, Phaser.GameObjects.Container>();
  /** The notes left on spots (mine, 2026-11-01): a small mark to the left of the spot. */
  private readonly traceMarks = new Map<string, Phaser.GameObjects.Container>();
  /** The areas drawn so far: the world grows as bosses fall, and a new area is drawn when it comes (mine, 2026-10-31). */
  private readonly drawn = new Set<string>();
  /** When the fight, the shop or the bag last closed, in ms and in frames: the tap that closed it must not also reach the spot
   * under the button (mine, 2026-10-31), not even when the closing frame runs long drawing a grown area. */
  private overlayClosedAt = -Infinity;
  private overlayClosedFrame = -Infinity;
  private outside: Phaser.GameObjects.TileSprite | null = null;
  private links!: Phaser.GameObjects.Graphics;
  private border!: Phaser.GameObjects.Graphics;
  private token!: Phaser.GameObjects.Container;
  /** The hero drawn from the atlas, when a set is loaded; otherwise the token is a circle with a letter. */
  private hero: Hero | null = null;
  private hud: HudScene | null = null;
  /** Where the pending roll can end, by landing space, while the player is choosing; null otherwise. */
  private choices_: Map<string, string[]> | null = null;
  private busy = false;
  /** The painted ground: what is near the camera, in memory. */
  private painted: PaintedGround | null = null;
  /** The bridge and the pass, barred or open. */
  private readonly gates = new Map<WorldGate, Phaser.GameObjects.Image>();
  /** Roads of a land not open yet: where they run over painted ground no cover hides them. */
  private readonly closedRoads = new Map<string, Phaser.GameObjects.Graphics>();
  private readonly crossed = new Set<object>();
  private reachLabels: Phaser.GameObjects.Text[] = [];
  private wandererSeen = 0;
  private readonly secretsDrawn = new Set<string>();
  private rumourMarks: Phaser.GameObjects.Image[] = [];
  /** The painted regions whose board art is held now. */
  private readonly regions = new Set<string>();
  private readonly dungeonFloors = new Map<string, Phaser.GameObjects.Rectangle>();
  private arenaParts: Phaser.GameObjects.GameObject[] = [];
  private arenaBuildings: ArenaDrawn[] = [];
  private arenaDrawnKey = '';
  private arenaFar = false;
  private arenaWasOpen: boolean | null = null;
  private readonly closedLabels = new Map<string, Phaser.GameObjects.Text>();
  private crownDoor: Phaser.GameObjects.Image | null = null;
  private readonly closedMarks = new Map<string, Phaser.GameObjects.Image[]>();
  /** The other players' figures, by id: `others` holds their marks. */
  private readonly otherHeroes = new Map<string, Hero>();
  /** The area whose creatures and backdrop are kept in memory. */
  private artArea = '';
  /** The last tap on the world, for a double tap. */
  private lastTap = { at: -Infinity, x: 0, y: 0 };
  /** True while a question's window is up. */
  private asking = false;
  /** True while the token is on the road. */
  private walking = false;
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
    this.drawOthers();
    this.drawSpawns();
    this.drawTraces();
    this.refreshClocks();
    this.setupCamera(board);
    this.setupInput();
    this.game_.onSpawns = () => this.drawSpawns();
    this.game_.onChange = (what) => this.onWorldChange(what);
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshClocks() });
    this.log.note(`board scene ready: ${Object.keys(board.spaces).length} spaces, ${board.width} by ${board.height}`);
    audio.init(this.game);
    this.scene.launch('hud');
    this.scene.launch('moment');
    // For looking at the loot reveal without finding a chest: ?reveal=rare, ?reveal=all (the pane, Robin's phone).
    const which = new URLSearchParams(window.location.search).get('reveal');
    if (which) this.time.delayedCall(700, () => this.showcase(which));
  }

  /**
   * The loot reveal on made-up prizes, for looking at it: one rarity, or 'all' (gold, a flask and the six rarities in a
   * row). From the page's ?reveal= switch, or the pane: boardWorld.phaser.scene.getScene('board').showcase('epic').
   */
  showcase(which: string): void {
    if (this.busy || this.game_.me.fight) return;
    const rng = makeRng(Date.now());
    const want = which === 'all' ? [...RARITIES] : RARITIES.includes(which as Rarity) ? [which as Rarity] : ['rare' as Rarity];
    const prizes: Prize[] = which === 'all' ? [{ kind: 'gold', amount: 48 }, { kind: 'item', item: 'potion', count: 2 }] : [];
    want.forEach((rarity, n) => {
      let gear: GearItem | null = null;
      for (let i = 0; i < 80 && !gear; i++) {
        const slot = SLOTS[rng.int(SLOTS.length) - 1]!;
        const piece = rarity === 'unique' ? rollUnique(`look-${n}-${i}`, 1 + rng.int(3), 3, rng) : rollGear(`look-${n}-${i}`, slot, 3, rarity === 'legendary' || rarity === 'epic' ? 3 : 0, rng);
        if (piece?.rarity === rarity) gear = piece;
      }
      prizes.push({ kind: 'gear', gear: gear ?? { ...plainGear(`look-${n}`, 'weapon', 3), rarity }, sold: null });
    });
    this.reveal(prizes, which === 'all' ? 'Every rarity, for looking' : 'For looking', () => this.finish('That was the loot reveal.'));
  }

  /** The HUD is drawn: show the first message, and take up again whatever the page was closed in the middle of. */
  hudReady(hud: HudScene): void {
    this.hud = hud;
    hud.setFollowing(this.following);
    hud.setBusy(this.busy);
    this.refreshHud();
    this.refreshLink();
    hud.setDie(this.game_.state.die.last === null ? '–' : String(this.game_.state.die.last));
    this.resume(tips.take('start') ?? undefined);
  }

  /** Take up whatever the state is in the middle of: a fight, a question, a pending roll, or nothing. */
  private resume(message?: string): void {
    if (this.scene.isActive('fight') || this.scene.isActive('shop') || this.scene.isActive('bag') || this.scene.isActive('quests') || this.scene.isActive('settings') || this.scene.isActive('ask') || this.scene.isActive('reveal')) return;
    const me = this.game_.me;
    this.clearChoices();
    if (me.fight) {
      this.openFight();
    } else if (me.offer) {
      this.offerChoice();
    } else if (me.steps > 0) {
      this.setBusy(true);
      this.offerChoices();
    } else {
      this.finish(message ?? (this.game_.state.board.areas[this.game_.state.board.spaces[me.space]?.area ?? '']?.city ? 'Tap a place in the city to walk there. The die works at the gates.' : `Tap Roll to move ${me.name}. Tap any spot to hear about it.`));
    }
  }

  /** Send an intent and go on with its events; while one is on its way nothing else is sent. No answer: resync and say so. */
  private send(intent: Intent, then: (events: GameEvent[]) => void): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.game_.act(intent).then(
      (events) => {
        this.inFlight = false;
        then(events);
      },
      (e: unknown) => {
        this.inFlight = false;
        this.log.error(`action failed: ${String(e)}`);
        this.hud?.setChips([]);
        this.resume('No answer from the world. Try again.');
      },
    );
  }

  /** The state changed under the player: others moved, the world ticked, the link changed, a reconnect brought a snapshot. */
  private onWorldChange(what: WorldChange): void {
    if (what.board) {
      this.drawBoard();
      this.refreshCovers();
      this.drawSpawns();
    }
    if (what.others || what.board) {
      this.drawOthers();
      this.refreshHud(); // "with Bo" in the place line
    }
    if (what.traces || what.board) this.drawTraces();
    if (what.me) {
      this.refreshHud();
      this.refreshClocks();
      if (!this.scene.isActive('fight') && !this.inFlight && !this.busy) {
        this.placeToken();
        this.resume();
      }
    }
    // The fight screen follows the state too: a world boss hit by others, or a fall that paid this player.
    if ((what.me || what.spawns) && this.scene.isActive('fight')) (this.scene.get('fight') as FightScene).refreshFromState(what.events);
    if (what.link) this.refreshLink();
    const line = this.othersLine(what.events);
    if (line) {
      this.log.note(line);
      if (!this.busy) this.setMessage(line);
    }
  }

  /** One line about what another player just did, when it is worth one. */
  private othersLine(events: GameEvent[]): string {
    const { characters, board } = this.game_.state;
    const name = (id: string) => characters[id]?.name ?? 'Someone';
    for (const e of events) {
      if (e.type === 'spawned' && e.spawn.kind === 'worldboss' && e.spawn.enemy) {
        const sp = board.spaces[e.space];
        return `A world boss rages in ${board.areas[sp?.area ?? '']?.name ?? 'the wilds'}: the ${creature(e.spawn.enemy, board.bestiary)?.name ?? e.spawn.enemy}! Land there to fight it together.`;
      }
      if (e.type === 'spawned' && e.spawn.kind === 'wanderer' && e.spawn.enemy && board.spaces[e.space]?.area === board.spaces[this.game_.me.space]?.area) {
        if (this.wandererSeen !== e.spawn.until) {
          this.wandererSeen = e.spawn.until;
          return `Something huge walks these roads: a Dread ${creature(e.spawn.enemy, board.bestiary)?.name ?? e.spawn.enemy}, level ${e.spawn.level ?? '?'}.`;
        }
      }
      if (e.type === 'bossLeft') return `The ${creature(e.enemy, board.bestiary)?.name ?? e.enemy} is gone from ${board.spaces[e.space]?.name || 'the wilds'}.`;
      if (e.player === this.game_.player) continue;
      switch (e.type) {
        case 'joined':
          return `${e.name} the ${CLASS_DATA[e.classId].name} has joined the world.`;
        case 'worldBossDown': {
          const mine = e.shares.find((x) => x.player === this.game_.player);
          return `${name(e.player)} brought down the ${creature(e.enemy, board.bestiary)?.name ?? e.enemy}!${mine ? ` Your share: +${mine.xp} xp, +${mine.gold} gold.` : ''}`;
        }
        case 'traced':
          return `${e.trace.name} left a note at ${board.spaces[e.space]?.name || 'a spot in the wilds'}: "${e.trace.text}".`;
        case 'opened':
          return `${name(e.player)} opened ${board.areas[e.area]?.name ?? e.area}!`;
        case 'bossDown':
          return `${name(e.player)} beat the boss at ${board.spaces[e.space]?.name ?? e.space}.`;
        case 'linked':
          return `${name(e.player)} and ${name(e.with)} are linked.`;
        case 'sealWon':
          return `${name(e.player)} won the Seal of ${board.areas[e.land]?.name ?? e.land}.`;
        case 'levelled':
          return `${name(e.player)} reached level ${e.level}.`;
        case 'died':
          return `${name(e.player)} fell and woke in ${board.spaces[e.town]?.name ?? e.town}.`;
        default:
          break;
      }
    }
    return '';
  }

  /** The HUD's link line: solo, online with how many, or reconnecting. */
  private refreshLink(): void {
    const link = this.game_.link();
    if (link.kind === 'solo') this.hud?.setLink('solo', COLORS.dim);
    else if (link.kind === 'online') this.hud?.setLink(link.online > 1 ? `online · ${link.online} here` : 'online', '#6fcf7a');
    else this.hud?.setLink(link.tries ? `reconnecting (${link.tries})…` : 'connecting…', '#f0a030');
  }

  /** The map of landing space to path while the player is choosing; null otherwise. The pane reads it. */
  get choices(): Map<string, string[]> | null {
    return this.choices_;
  }

  override update(_time: number, delta: number): void {
    this.log.frame(delta);
    this.hero?.update(delta);
    // The labels keep one size on screen, whatever the zoom.
    const cam = this.cameras.main;
    for (const words of this.closedLabels.values()) words.setScale(DPR / cam.zoom);
    for (const mark of this.rumourMarks) mark.setScale((0.28 * DPR) / cam.zoom);
    for (const marks of this.closedMarks.values()) for (const mark of marks) mark.setScale(((mark.frame.name === 'mark_unknown' ? 0.28 : 0.3) * DPR) / cam.zoom);
    for (const label of this.reachLabels) {
      const scale = DPR / cam.zoom;
      label.setScale(scale).setX((label.getData('x') as number) + 24 * scale);
    }
    for (const other of this.otherHeroes.values()) other.update(delta);
    this.lastZoom = this.cameras.main.zoom;
    if (this.kitted && this.token) this.token.setDepth(standingDepth(this.token.y + SPACE_RADIUS + 6));
    this.cull();
  }

  // ---- what the HUD's buttons call ---------------------------------------------------------------------------------

  /** Roll the die; then walk, or light up the places the roll can end and wait for a tap. */
  roll(): void {
    const { board } = this.game_.state;
    const at = board.spaces[this.game_.me.space];
    if (at && board.areas[at.area]?.city && !at.links.some((l) => board.spaces[l]?.area !== at.area)) {
      this.setMessage('Inside the walls you walk: tap where you want to go. A gate leads out.');
      return;
    }
    // Roll with a sheet open: the sheet goes, or the die would roll and the spots light behind it.
    this.closeSheets();
    if (this.busy) {
      sfx.play('ui/tap-denied');
      if (this.choices_) this.setMessage('Tap a lit spot first.');
      return;
    }
    this.hud?.setChips([]);
    this.setBusy(true);
    this.hud?.startRoll();
    this.send({ type: 'roll', player: this.game_.player }, (rolled) => {
      const roll = rolled.find((e) => e.type === 'rolled');
      if (!roll || roll.type !== 'rolled') {
        this.hud?.cancelRoll();
        this.finish(this.describe(rolled));
        return;
      }
      this.log.note(`rolled ${roll.value}`);
      const stung = rolled.find((e) => e.type === 'stung');
      if (stung?.type === 'stung') {
        sfx.play('ui/stung');
        moments(this)?.find('mark_drop', `Poison: -${stung.damage} HP`, stung.left > 0 ? `${stung.left} more rolls, or a church.` : 'It has worn off.', 0x8fd14f);
        this.refreshHud();
      }
      if (this.hud) this.hud.landDie(roll.value, () => this.offerChoices());
      else this.offerChoices();
    });
  }

  /** Map: everything open; Back: the camera returns to the character. */
  toggleMap(): void {
    if (this.following) this.overview();
    else this.follow(false);
  }

  /** The class being played, for a loot card's weapon. */
  classId(): ClassId {
    return this.game_.me.classId;
  }

  /** Hero: what you wear and carry. */
  openBag(): void {
    this.toggleSheet('bag');
  }

  /** The quest log. */
  openQuests(): void {
    this.toggleSheet('quests');
  }

  /** The settings, and the guide behind them. */
  openSettings(): void {
    this.toggleSheet('settings');
  }

  /** A sheet: its button opens it, closes it, or switches from another (Robin, 2026-11-01). Not over a fight, a shop, a reveal, a question or a walk. */
  private toggleSheet(key: 'bag' | 'quests' | 'settings'): void {
    if (this.game_.me.fight || this.scene.isActive('shop') || this.scene.isActive('reveal') || this.asking) return;
    if (this.walking) {
      sfx.play('ui/tap-denied');
      return;
    }
    const wasOpen = this.scene.isActive(key);
    this.closeSheets();
    if (wasOpen) return;
    sfx.play('ui/sheet-open');
    this.scene.launch(key);
  }

  /** Any sheet goes, and the tap that closed it stays off the board. */
  private closeSheets(): void {
    for (const key of ['bag', 'quests', 'settings'] as const) {
      if (!this.scene.isActive(key)) continue;
      sfx.play('ui/sheet-close');
      this.scene.stop(key);
      this.overlayClosedAt = this.time.now;
      this.overlayClosedFrame = this.game.loop.frame;
      this.refreshHud();
    }
  }

  bagClosed(): void {
    sfx.play('ui/sheet-close');
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
    this.send({ type: 'use', player: this.game_.player, item, ...(value !== undefined ? { value } : {}) }, (events) => {
      const steps = events.find((e) => e.type === 'steps');
      if (!steps || steps.type !== 'steps') {
        this.setMessage(this.describe(events));
        return;
      }
      this.log.note(`used ${item}${value !== undefined ? ` ${value}` : ''}: ${steps.steps} steps`);
      this.hud?.setDie(String(steps.steps), true);
      this.clearChoices();
      this.offerChoices(`${ITEMS[item]?.name ?? item}: now ${steps.steps} ${steps.steps === 1 ? 'step' : 'steps'}.`);
    });
  }

  /** The gambler's answer. */
  answerGamble(choice: 'high' | 'low' | 'pass'): void {
    this.closeAsk();
    this.send({ type: 'gamble', player: this.game_.player, choice }, (events) => {
      this.hud?.setChips([]);
      const gambled = events.find((e) => e.type === 'gambled');
      if (gambled?.type === 'gambled') {
        moments(this)?.find('item_gold', gambled.won ? `You win ${Math.abs(gambled.delta)} gold!` : `You lose ${Math.abs(gambled.delta)} gold`, `The die shows ${gambled.roll}.`, gambled.won ? 0xe8b84a : 0xff7a5c);
        this.log.note(`gambled ${choice}: rolled ${gambled.roll}, ${gambled.won ? 'won' : 'lost'} ${Math.abs(gambled.delta)}`);
        this.finish(`The die shows ${gambled.roll}: you ${gambled.won ? 'win' : 'lose'} ${Math.abs(gambled.delta)} gold.`);
      } else {
        this.finish(this.describe(events) || 'You walk on.');
      }
    });
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
    this.reveal(outcome.loot, `Dropped by ${outcome.enemy}`, () => {
      this.finish(outcome.summary);
      // A full bag asks about the loot.
      if (this.game_.me.offer) this.offerChoice();
    });
  }

  /**
   * What a spot gave, as a picture over the board and not only a line of text (Robin, 2026-11-01: "when you go on a spot and
   * its just a random 'you got this', it needs to be more visual"). A chest has the reveal for this; a wild spot's event
   * says its own line once, whatever numbers follow it.
   */
  private showFinds(events: GameEvent[]): void {
    const m = moments(this);
    if (!m) return;
    const themed = events.find((e) => e.type === 'themeEvent');
    if (themed?.type === 'themeEvent') {
      const look = {
        heal: { icon: 'mark_heart', title: 'Feeling better', color: 0x6fcf7a },
        hurt: { icon: 'mark_alert', title: 'Ouch!', color: 0xff7a5c },
        gold: { icon: 'item_gold', title: 'A lucky find', color: 0xe8b84a },
        mana: { icon: 'mark_drop', title: 'Refreshed', color: 0x5aa9ff },
        flask: { icon: 'potion', title: 'A lucky find', color: 0xe8b84a },
        card: { icon: 'item_do_over', title: 'A lucky find', color: 0xc084fc },
      }[themed.kind];
      m.find(look.icon, look.title, themed.text, look.color);
      return;
    }
    for (const e of events) {
      switch (e.type) {
        case 'rested': {
          const cured = events.find((x) => x.type === 'cured');
          if (cured?.type === 'cured') m.find('mark_star', 'Healed and cured', `HP and mana full; ${cured.ailments.join(' and ')} gone.`, 0xfff1b0);
          else m.find('mark_heart', 'Rested', 'HP and mana full.', 0x6fcf7a);
          break;
        }
        case 'gold':
          if (e.delta > 0) m.find('item_gold', `+${e.delta} gold`, 'Into your purse.', 0xe8b84a);
          else if (e.delta < 0) m.find('item_gold', `${e.delta} gold`, 'Out of your purse.', 0xff7a5c);
          break;
        case 'found':
          m.find(itemFrame(e.item), `+${e.count} ${ITEMS[e.item]?.name ?? e.item}`, ITEMS[e.item]?.text ?? '', 0xfff1b0);
          break;
        case 'healed':
          if (e.amount > 0) m.find('mark_heart', `+${e.amount} HP`, 'You feel better.', 0x6fcf7a);
          break;
        case 'learned':
          m.find('mark_star', ABILITIES[e.ability]?.name ?? e.ability, `Learned, rank ${e.rank}. ${ABILITIES[e.ability]?.text ?? ''}`, 0xc084fc);
          break;
        case 'keyFound':
          m.find('item_key', 'A key!', 'It opens this area\'s vault.', 0xe8b84a);
          break;
        case 'personFound':
          sfx.play('ui/person-found');
          m.find('mark_star', `You found ${e.person}!`, 'Your quest is done.', 0xfff1b0);
          break;
        case 'questDone':
          sfx.play('ui/quest-done');
          m.find('mark_scroll', 'Quest complete!', `+${e.quest.xp} xp, +${e.quest.gold} gold and a chest.`, 0xe8b84a);
          break;
        case 'locked':
          m.find('mark_lock', 'Locked', 'A vault. Its key is carried by this area\'s mini-boss.', 0xd6cfbd);
          break;
        case 'empty':
          m.find('mark_clock', 'Empty for now', `Again in ${countdown(e.until - this.game_.now())}.`, 0xd6cfbd);
          break;
        default:
          break;
      }
    }
  }

  /** The big moments in a batch of events (chapter 1, step 3): a level crossed, an area opened. Fights show their own. */
  private showMoments(events: GameEvent[]): void {
    const m = moments(this);
    if (!m) return;
    for (const e of events) {
      if (e.type === 'levelled') m.levelUp(e.level, `HP ${e.maxHp} · mana ${e.maxMana} · attack ${e.attack} · defense ${e.defense}`);
      else if (e.type === 'opened') m.opened(this.game_.state.board.areas[e.area]?.name ?? e.area);
      else if (e.type === 'rumour') m.find('mark_scroll', 'A rumour', e.rumour.text, 0xe8b84a);
      else if (e.type === 'secretFound') m.find('mark_star', 'A hidden path!', e.name ? `It leads to ${e.name}.` : 'Something lies off the road here.', 0x6fcf7a);
      else if (e.type === 'secretTreasure') m.find('item_gold', `${e.name}!`, 'Nobody has been here in years.', 0xe8b84a);
    }
  }

  /**
   * The loot reveal over the board (chapter 1, step 2): the chest glows, opens and gives its prizes on cards, then `then`
   * runs (the message, the shop, a question). Nothing to show, or the art not loaded: straight on.
   */
  private reveal(prizes: Prize[], title: string, then: () => void): void {
    if (!prizes.length || !lootReady(this) || this.scene.isActive('reveal')) {
      then();
      return;
    }
    this.setBusy(true);
    const request: RevealRequest = { title, prizes, onDone: then };
    this.scene.launch('reveal', request);
  }

  /** The reveal is done: the scene goes, the tap that closed it is kept off the board, and what waited runs. */
  revealClosed(then: () => void): void {
    this.scene.stop('reveal');
    this.overlayClosedAt = this.time.now;
    this.overlayClosedFrame = this.game.loop.frame;
    then();
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
    for (const area of fresh) {
      const kit = kitFor(this, area.theme);
      if (kit) this.log.note(`props: ${drawKitProps(this, kit, area)} on ${area.name}`);
      if (kit && PAINTED[area.id] && area.theme !== 'meadow' && area.theme !== 'city' && regionHeld(this, area.theme)) this.regions.add(area.id);
    }
    for (const area of fresh) this.drawCover(area);
    this.drawGates();
    // Past the areas' edges there is cloud, not a void (the map can be dragged there).
    if (this.textures.exists('board_cover') && !this.painted) {
      this.outside ??= this.add.tileSprite(0, 0, board.width, board.height, 'board_cover').setOrigin(0, 0).setTileScale(0.5).setDepth(-1).setTint(0x8a8fa8);
      this.outside.setSize(board.width, board.height);
    }
    this.border.clear();
    if (!this.painted) {
      this.border.lineStyle(6, COLORS.border, 1);
      this.border.strokeRect(3, 3, board.width - 6, board.height - 6);
    }
    const cam = this.cameras.main;
    this.fitBounds();
    this.minZoom = this.overviewZoom();
    this.lastCull.count = -1; // the new spots take the view's rule at the next frame
    this.refreshCovers();
    if (this.drawn.size > fresh.length) this.log.note(`board grown: ${fresh.map((a) => a.name).join(', ')}; ${Object.keys(board.spaces).length} spaces, ${board.width} by ${board.height}`);
  }

  /** The hunting grounds' names on the map, each by its spot: what mostly roams there (Robin, 2026-11-02). */
  private drawGrounds(area: Area): void {
    const { board } = this.game_.state;
    for (const g of groundsOf(board, area.id)) {
      const hub = board.spaces[g.hub];
      if (!hub) continue;
      this.add
        .text(hub.x, hub.y - 62, `${g.name}${g.levels ? ` · Lv ${g.levels[0]}-${g.levels[1]}` : ''}`, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#fff4c8', stroke: '#2a2030', strokeThickness: 4, align: 'center', resolution: 2 })
        .setOrigin(0.5)
        .setAlpha(0.9)
        .setDepth(KIT_DEPTH.names);
    }
  }

  /** An area's ground in its theme's colour, its name written large and faint. */
  private drawGround(area: Area): void {
    if (area.dungeon) {
      // Dark under its chunks, over the sea of the overview; hidden with the rest while you are outside. Its chunks come with the painted ground.
      const land = DUNGEON_LAND[area.id] ?? { ...area.bounds, fill: 0x1c1620 };
      this.painted ??= new PaintedGround(this);
      this.dungeonFloors.set(area.id, this.add.rectangle(land.x + land.width / 2, land.y + land.height / 2, land.width, land.height, land.fill, 1).setDepth(-2.5).setVisible(false));
      return;
    }
    this.drawGrounds(area);
    if (PAINTED[area.id]) {
      this.painted ??= new PaintedGround(this);
      this.closedWords(area);
      this.cameras.main.setBackgroundColor(SEA);
      this.kitted = true;
      return;
    }
    const kit = kitFor(this, area.theme);
    if (kit) {
      const { board, seed } = this.game_.state;
      drawKitGround(this, kit, area, seed, board.width, board.height, Object.values(PAINTED));
      drawKitBanner(this, kit, area, FONT);
      this.kitted = true;
      return;
    }
    const g = this.add.graphics().setDepth(groundDepth(area.tier));
    g.fillStyle(THEME_COLORS[area.theme] ?? COLORS.ground, 1);
    // Never over painted land, where a road of this area may run.
    g.fillRoundedRect(area.bounds.x, area.bounds.y, area.bounds.width, this.clearOfPainted(area) - area.bounds.y, 60);
    // The name sits in the margin above the area's top spots, faint, readable from the overview.
    this.add
      .text(area.bounds.x + area.bounds.width / 2, area.bounds.y + 6, `${area.name} · tier ${area.tier} · levels ${area.levels[0]} to ${area.levels[1]}`, { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: COLORS.text, resolution: 2 })
      .setOrigin(0.5, 0)
      .setAlpha(0.4)
      .setDepth(1);
  }

  /** The roads of the given spots: each link once, and a link to a spot drawn earlier (the passage from a boss into a grown area). */
  /** The roads of a painted area, each as the line through its hubs and points. Hidden while the land is closed. */
  private drawPaintedRoads(areaId: string): void {
    const data = WORLD_DATA.areas.find((a) => a.id === areaId) ?? DUNGEONS[areaId]?.area;
    const area = this.game_.state.board.areas[areaId];
    const kit = area ? kitFor(this, area.theme) : null;
    if (!data || !kit) return;
    const hubs = new Map(data.hubs.map((h) => [h.id, h]));
    const paths: { x: number; y: number }[][] = [];
    for (const road of data.roads) {
      const from = hubs.get(road.from);
      const to = hubs.get(road.to);
      if (from && to) paths.push([from, ...(road.via ?? []), to]);
    }
    this.closedRoads.set(areaId, this.strokePaths(kit, paths));
  }

  /** The roads between areas that cross painted land, in that land's colours: into the forest over the bridge, out of it through the pass. */
  private drawCrossingRoads(all: Record<string, Space>): void {
    const { areas } = this.game_.state.board;
    for (const road of WORLD_DATA.roads) {
      const from = all[road.from];
      const to = all[road.to];
      if (!from || !to || !road.via?.length || this.crossed.has(road)) continue;
      const land = [road.area, from.area].find((id) => id && PAINTED[id]);
      const kit = land ? kitFor(this, areas[land]?.theme ?? '') : null;
      if (!kit || !road.area || BAKED_ROADS.has(road.area)) continue;
      this.crossed.add(road);
      this.closedRoads.set(`road:${road.area}`, this.strokePaths(kit, [[from, ...road.via, to]]));
    }
    // The road out along the north shore: the grown area's, over Honeyhill's land.
    const exit = (WORLD_DATA as unknown as { exit?: { hub: string; opens: string; path: { x: number; y: number }[] } }).exit;
    const start = exit ? all[exit.hub] : undefined;
    const kit = start ? kitFor(this, areas[start.area]?.theme ?? '') : null;
    if (exit && start && kit && !this.crossed.has(exit)) {
      this.crossed.add(exit);
      this.closedRoads.set(`road:${exit.opens}`, this.strokePaths(kit, [[start, ...exit.path]]));
    }
  }

  private strokePaths(kit: NonNullable<ReturnType<typeof kitFor>>, paths: { x: number; y: number }[][]): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(KIT_DEPTH.roads);
    const deck = worldBridge();
    for (const line of kit.road) {
      g.lineStyle(line.width, line.color, line.alpha);
      g.fillStyle(line.color, line.alpha);
      for (const path of paths) {
        path.forEach((p, i) => {
          const next = path[i + 1];
          // No stroke on the bridge's painted deck.
          const onDeck = !!deck && !!next && nearSegment((p.x + next.x) / 2, (p.y + next.y) / 2, deck.from, deck.to, 40);
          if (!deck || !nearSegment(p.x, p.y, deck.from, deck.to, 5)) g.fillCircle(p.x, p.y, line.width / 2);
          if (next && !onDeck) g.lineBetween(p.x, p.y, next.x, next.y);
        });
      }
    }
    return g;
  }

  private drawLinks(spaces: Space[], all: Record<string, Space>): void {
    const areas = this.game_.state.board.areas;
    const kitted = spaces.filter((s) => kitFor(this, areas[s.area]?.theme ?? ''));
    const kits = new Map(kitted.map((s) => [areas[s.area]!.theme, kitFor(this, areas[s.area]!.theme)!]));
    // A painted area's roads follow their own points, unsmoothed, so they pass through their spots (Mitch, AD); no road on the bridge's painted deck.
    const paintedNow = new Set(kitted.filter((s) => PAINTED[s.area] || areas[s.area]?.dungeon).map((s) => s.area));
    for (const areaId of paintedNow) if (!BAKED_ROADS.has(areaId)) this.drawPaintedRoads(areaId);
    this.drawCrossingRoads(all);
    const onPainted = (x: number, y: number): boolean => Object.values(PAINTED).some((p) => x >= p.x && x < p.x + p.width && y >= p.y && y < p.y + p.height);
    // A road running over painted land is stroked with that land's roads, never smoothed through its spots.
    const onLand = (a: Space, c: Space): boolean => onPainted((a.x + c.x) / 2, (a.y + c.y) / 2);
    for (const [theme, kit] of kits) {
      const own = kitted.filter((s) => areas[s.area]?.theme === theme && !PAINTED[s.area] && !areas[s.area]?.dungeon && !onPainted(s.x, s.y));
      if (own.length) this.closedRoads.set(own[0]!.area, drawKitRoads(this, kit, own, all, onLand));
    }
    spaces = spaces.filter((s) => !kitFor(this, areas[s.area]?.theme ?? ''));
    const fresh = new Set(spaces.map((s) => s.id));
    this.links.lineStyle(6, COLORS.link, 1);
    for (const space of spaces) {
      for (const other of space.links) {
        if (!fresh.has(other) || space.id < other) {
          const b = all[other];
          if (b && onLand(space, b)) continue;
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

    const parts: (Phaser.GameObjects.Arc | Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [];
    const spotNames: Phaser.GameObjects.Text[] = [];
    this.spotParts.set(space.id, { x: space.x, y: space.y, parts, names: spotNames });
    const kit = kitFor(this, this.game_.state.board.areas[space.area]?.theme ?? '');
    let circle: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
    let under = radius + 4;
    if (kit) {
      const plate = drawKitPlate(this, kit, space);
      circle = plate;
      under = plate.displayHeight / 2 + 2;
    } else {
      const arc = this.add.circle(space.x, space.y, radius, color, 1).setDepth(5);
      arc.setStrokeStyle(space.kind === 'boss' ? 6 : 3, 0xffffff, space.kind === 'boss' ? 0.7 : 0.25);
      arc.setInteractive(new Phaser.Geom.Circle(radius, radius, TAP_RADIUS), Phaser.Geom.Circle.Contains);
      circle = arc;
    }
    parts.push(circle);
    // A tap is a release that did not travel: a drag that ends on a spot is not a tap.
    circle.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.getDistance() < TAP_MAX && this.time.now - this.overlayClosedAt > 250 && this.game.loop.frame - this.overlayClosedFrame > 3) {
        if (this.choices_?.has(space.id)) {
          // A lit spot chosen: a ripple of its light, a buzz, and the walk begins.
          feel.sparkle(this, space.x, space.y, LIT, 12, 9);
          fx(this, 'fx_ripple', space.x, space.y, LIT, 4, 1.4);
          feel.buzz(12);
          sfx.play('ui/choice');
        }
        this.onSpaceTap(space.id);
      }
    });
    this.circles.set(space.id, circle);

    const letter = kit ? '' : space.locked ? 'V' : KIND_LETTERS_SHOWN[space.kind];
    if (letter) {
      parts.push(
        this.add
          .text(space.x, space.y, letter, { fontFamily: FONT, fontSize: space.kind === 'boss' ? '26px' : '20px', fontStyle: 'bold', color: '#101318', resolution: 2 })
          .setOrigin(0.5)
          .setDepth(6),
      );
    }
    if (space.name) {
      // Only hubs have names; the wilds of the road show their circle and nothing more.
      const name = this.add
        .text(space.x, space.y + under, space.kind === 'town' ? space.name : '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', align: 'center', resolution: 2, stroke: '#1c2612', strokeThickness: 5 })
        .setOrigin(0.5, 0)
        .setDepth(KIT_DEPTH.names);
      this.names.push(name);
      spotNames.push(name);
      if (space.kind === 'boss') {
        const label = this.add
          .text(space.x, space.y + under, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#fff4d6', align: 'center', resolution: 2, stroke: '#1c2612', strokeThickness: 4 })
          .setOrigin(0.5, 0)
          .setDepth(6);
        this.bossLabels.set(space.id, label);
        this.names.push(label);
        spotNames.push(label);
      }
    }
  }

  /**
   * Hide what the camera cannot see: every spot's circle, letter and names outside the view and a margin. Run when the
   * camera has moved or zoomed or the board has grown. The names also keep their zoom rule; rings and the token are
   * never hidden here.
   */
  private cull(): void {
    const cam = this.cameras.main;
    const v = cam.worldView;
    const count = this.spotParts.size;
    if (v.x === this.lastCull.x && v.y === this.lastCull.y && cam.zoom === this.lastCull.zoom && count === this.lastCull.count) return;
    this.lastCull = { x: v.x, y: v.y, zoom: cam.zoom, count };
    const margin = 120;
    const left = v.x - margin;
    const right = v.right + margin;
    const top = v.y - margin;
    const bottom = v.bottom + margin;
    const namesHidden = cam.zoom < NAME_ZOOM;
    const open = this.shownAreas();
    this.painted?.update(cam, open);
    const zoomedOut = cam.zoom < CHUNK_ZOOM;
    const standing = this.game_.state.board.spaces[this.game_.me.space]?.area;
    const inDungeon = !!this.dungeonHere();
    for (const [areaId, words] of this.closedLabels) words.setVisible(zoomedOut && !inDungeon && areaId !== standing && !(this.game_.state.board.areas[areaId]?.city && !this.game_.me.opened.includes(areaId)));
    const openLand = [...open].flatMap((id) => (PAINTED[id] ? [PAINTED[id]!] : []));
    this.fitArena();
    for (const p of allProps) {
      const area = propArea.get(p) ?? '';
      p.setVisible(p.x >= left - 100 && p.x <= right + 100 && p.y >= top - 100 && p.y <= bottom + 200 && (open.has(area) || !this.painted || openLand.some((l) => p.x >= l.x && p.x < l.x + l.width && p.y >= l.y && p.y < l.y + l.height)));
    }
    const found = new Set(this.game_.me.found ?? []);
    for (const [id, spot] of this.spotParts) {
      // A closed land's spots stay hidden even where its road crosses painted ground.
      const known = this.game_.state.board.spaces[id];
      const inView = spot.x >= left && spot.x <= right && spot.y >= top && spot.y <= bottom && (!this.painted || open.has(known?.area ?? '')) && (!known?.hidden || found.has(id));
      for (const p of spot.parts) p.setVisible(inView);
      for (const n of spot.names) n.setVisible(inView && !namesHidden);
    }
  }

  /** Where an area's own ground must stop, going down, to stay off the painted land under it. */
  private clearOfPainted(area: Area): number {
    const b = area.bounds;
    return Math.min(b.y + b.height, ...Object.values(PAINTED).filter((p) => p.y > b.y && p.x < b.x + b.width && p.x + p.width > b.x).map((p) => p.y));
  }

  /** A dark cover over an area, shown while it is not yet open: you can see there is more, not what. */
  private drawCover(area: Area): void {
    if (area.dungeon) return;
    // Closed land past a painted one is simply sea until it opens: no square cloud (Robin, 2026-11-02).
    if (this.painted) {
      if (PAINTED[area.id]) return;
      const b = area.bounds;
      const under = Object.values(this.game_.state.board.areas).filter((a) => a.tier < area.tier && a.bounds.x < b.x + b.width && a.bounds.x + a.bounds.width > b.x && a.bounds.y > b.y && a.bounds.y < b.y + b.height);
      const bottom = Math.min(this.clearOfPainted(area), ...under.map((a) => a.bounds.y + TOP_MARGIN));
      // It never lies over painted land, where its road's first spots may start.
      const left = Math.max(b.x, ...Object.values(PAINTED).filter((p) => p.y < bottom && p.y + p.height > b.y).map((p) => p.x + p.width));
      const right = Math.max(left, b.x + b.width);
      this.covers.set(area.id, this.add.rectangle((left + right) / 2, b.y + (bottom - b.y) / 2, right - left, bottom - b.y, SEA, 1).setDepth(KIT_DEPTH.cover));
      return;
    }
    // The meadow's cloud over any closed area, kit or not: nothing shows until it opens.
    const kit = kitFor(this, area.theme) ?? kitFor(this, 'meadow');
    if (kit) {
      // A closed area's cloud stops at the top of an area before it, or it would hide that area's first spots and banner.
      const b = area.bounds;
      const under = Object.values(this.game_.state.board.areas).filter((a) => a.tier < area.tier && a.bounds.x < b.x + b.width && a.bounds.x + a.bounds.width > b.x && a.bounds.y > b.y && a.bounds.y < b.y + b.height);
      this.covers.set(area.id, drawKitCover(this, kit, area, Math.min(b.y + b.height, ...under.map((a) => a.bounds.y + TOP_MARGIN))));
      return;
    }
    const b = area.bounds;
    const cover = this.add.rectangle(b.x + b.width / 2, b.y + b.height / 2, b.width, b.height, 0x0b0d14, 0.72).setDepth(8);
    this.covers.set(area.id, cover);
  }

  private refreshCovers(): void {
    this.crownDoor = drawCrownDoor(this, this.crownDoor, sealsAllWon(this.game_.state.board, this.game_.me));
    const opened = new Set(this.game_.me.opened);
    for (const [areaId, cover] of this.covers) cover.setVisible(!opened.has(areaId));
    for (const areaId of opened) raiseTallProps(areaId);
    for (const [areaId, marks] of this.closedMarks) for (const mark of marks) mark.setVisible(!opened.has(areaId));
    for (const [areaId, words] of this.closedLabels) {
      const area = this.game_.state.board.areas[areaId];
      if (area && words.text !== this.landWords(area)) words.setText(this.landWords(area));
    }
    const shown = this.shownAreas();
    for (const [areaId, roads] of this.closedRoads) roads.setVisible(shown.has(areaId.replace('road:', '')));
    for (const [areaId, floor] of this.dungeonFloors) floor.setVisible(shown.has(areaId));
    this.lastCull.count = -1;
    for (const [gate, image] of this.gates) image.setFrame(opened.has(gate.opens) ? gate.open : gate.barred);
    this.fitBounds();
  }

  /** Whatever has spawned: a mini-boss prowling or a merchant camped, as a badge above the spot. */
  /** The hidden trails you have found: a faint path off the road and what stands at its end. Unfound, nothing of them is drawn. */
  private drawSecrets(): void {
    const { board } = this.game_.state;
    const found = new Set(this.game_.me.found ?? []);
    for (const t of secretData.secrets) {
      if (this.secretsDrawn.has(t.id) || !found.has(`${t.id}-1`) || !this.textures.exists(SECRET_PLACES)) continue;
      const anchor = board.spaces[t.anchor];
      if (!anchor) continue;
      this.secretsDrawn.add(t.id);
      const look = (secretData.trail as unknown as Record<string, { outer: [string, number, number]; inner: [string, number, number] } | undefined>)[t.area];
      const g = this.add.graphics().setDepth(KIT_DEPTH.roads);
      for (const stroke of look ? [look.outer, look.inner] : []) {
        g.lineStyle(stroke[1], parseInt(stroke[0].slice(1), 16), stroke[2]);
        g.beginPath();
        g.moveTo(anchor.x, anchor.y);
        for (const p of t.spots) g.lineTo(p.x, p.y);
        g.strokePath();
      }
      this.add.image(t.propAt.x, t.propAt.y, placesAtlas(this, t.prop) ?? SECRET_PLACES, t.prop).setScale(0.5).setDepth(standingDepth(t.propAt.y));
    }
  }

  /** The "?" of each rumour you carry. */
  private drawRumours(): void {
    for (const mark of this.rumourMarks) mark.destroy();
    this.rumourMarks = [];
    if (!this.textures.exists(FOG_PIECES)) return;
    const { board } = this.game_.state;
    const shown = this.shownAreas();
    for (const r of this.game_.me.rumours ?? []) {
      const space = board.spaces[r.space];
      if (!space || !shown.has(space.area)) continue;
      this.rumourMarks.push(this.add.image(space.x, space.y - 40, FOG_PIECES, 'mark_unknown').setDepth(9));
    }
  }

  private drawSpawns(): void {
    this.drawArena();
    this.drawRumours();
    this.drawSecrets();
    for (const mark of this.spawnMarks.values()) mark.destroy();
    this.spawnMarks.clear();
    const { board, spawns } = this.game_.state;
    for (const [spaceId, spawn] of Object.entries(spawns)) {
      const space = board.spaces[spaceId];
      if (!space) continue;
      if (spawn.kind === 'worldboss') {
        // The world boss: a big purple badge with its HP under it, for everyone to see shrink.
        const badge = this.add.circle(0, 0, 20, 0x8e3fd9, 1).setStrokeStyle(3, 0x101318, 1);
        const text = this.add.text(0, 0, 'W', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#fff27a', resolution: 2 }).setOrigin(0.5);
        const hp = this.add.text(0, -24, `${spawn.hp ?? '?'} / ${spawn.maxHp ?? '?'}`, { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#e8e4d8', resolution: 2 }).setOrigin(0.5, 1);
        const mark = this.add.container(space.x + 26, space.y - 34, [badge, text, hp]).setDepth(9);
        this.tweens.add({ targets: mark, y: mark.y - 8, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.spawnMarks.set(spaceId, mark);
        continue;
      }
      if (spawn.kind === 'wanderer') {
        // Too strong, and it says so from far off: the danger mark and its level in red.
        const parts: Phaser.GameObjects.GameObject[] = [];
        if (hasFrame(this, 'mark_elite')) parts.push(icon(this, 'mark_elite', 0, 0).setDisplaySize(46, 46));
        parts.push(this.add.text(0, -33, `Lv ${spawn.level ?? '?'}`, { fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#fff1e0', backgroundColor: '#a23c2c', padding: { x: 7, y: 2 }, resolution: 2 }).setOrigin(0.5));
        const mark = this.add.container(space.x, space.y - 44, parts).setDepth(9);
        this.tweens.add({ targets: mark, y: mark.y - 8, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.spawnMarks.set(spaceId, mark);
        continue;
      }
      const mini = spawn.kind === 'miniboss' || spawn.kind === 'elite';
      const parts: Phaser.GameObjects.GameObject[] = [];
      const markFrame = spawn.kind === 'elite' ? 'mark_elite' : mini ? 'mark_alert' : 'mark_dollar';
      if (hasFrame(this, markFrame)) parts.push(icon(this, markFrame, 0, 0));
      else {
        parts.push(this.add.circle(0, 0, 14, mini ? 0xd9534f : 0xe8b84a, 1).setStrokeStyle(3, 0x101318, 1));
        parts.push(this.add.text(0, 0, mini ? '!' : '$', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#101318', resolution: 2 }).setOrigin(0.5));
      }
      const mark = this.add.container(space.x + 22, space.y - 24, parts).setDepth(9);
      this.tweens.add({ targets: mark, y: mark.y - 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.spawnMarks.set(spaceId, mark);
    }
  }

  /** The notes: a small pale mark to the left of a spot that has any; the tap's hint reads them. */
  private drawTraces(): void {
    for (const mark of this.traceMarks.values()) mark.destroy();
    this.traceMarks.clear();
    const { board, traces } = this.game_.state;
    for (const [spaceId, notes] of Object.entries(traces ?? {})) {
      const space = board.spaces[spaceId];
      if (!space || !notes.length) continue;
      if (hasFrame(this, 'mark_scroll')) {
        this.traceMarks.set(spaceId, this.add.container(space.x - 22, space.y - 22, [icon(this, 'mark_scroll', 0, 0).setScale(0.4)]).setDepth(8));
        continue;
      }
      const badge = this.add.circle(0, 0, 10, 0xe8e4d8, 1).setStrokeStyle(2, 0x101318, 1);
      const text = this.add.text(0, 0, notes.length > 1 ? String(notes.length) : '"', { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#101318', resolution: 2 }).setOrigin(0.5);
      this.traceMarks.set(spaceId, this.add.container(space.x - 22, space.y - 22, [badge, text]).setDepth(8));
    }
  }

  /** Leave one of the set notes on the spot you stand on. */
  private leaveNote(text: string): void {
    this.send({ type: 'trace', player: this.game_.player, text }, (events) => {
      this.hud?.setChips([]);
      const traced = events.find((e) => e.type === 'traced');
      if (traced?.type === 'traced') {
        sfx.play('ui/online-note');
        this.log.note(`note left: ${text}`);
        this.drawTraces();
        this.setMessage(`You leave a note here: "${text}". Others who tap this spot will read it.`);
      } else {
        this.setMessage(this.describe(events));
      }
    });
  }

  /** The boss labels: level, and how long until a beaten boss is back. Once a second; the link line with it. */
  private refreshClocks(): void {
    const me = this.game_.me;
    const now = this.game_.now();
    this.refreshLink();
    this.checkArena();
    this.fitRegions();
    for (const [spaceId, label] of this.bossLabels) {
      const space = this.game_.state.board.spaces[spaceId]!;
      const boss = space.boss ? creature(space.boss, this.game_.state.board.bestiary) : undefined;
      const left = (me.cooldowns[spaceId] ?? 0) - now;
      label.setText(left > 0 ? `${boss?.name ?? 'boss'} · back in ${countdown(left)}` : `${boss?.name ?? 'boss'} · level ${boss?.level ?? '?'}`);
      this.circles.get(spaceId)?.setAlpha(left > 0 ? 0.45 : 1);
    }
  }

  preload(): void {
    // Something to look at while it loads: the art takes a moment on a phone.
    const words = this.add.text(DESIGN_WIDTH / 2, 430, 'Walking to the meadow…', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.add.rectangle(DESIGN_WIDTH / 2, 470, 264, 18, 0x3a4256).setName('bar-back');
    const fill = this.add.rectangle(DESIGN_WIDTH / 2 - 130, 470, 260, 14, 0x6fcf7a).setOrigin(0, 0.5).setScale(0, 1);
    this.load.on(Phaser.Loader.Events.PROGRESS, (share: number) => fill.setScale(share, 1));
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      words.destroy();
      fill.destroy();
      this.children.getByName('bar-back')?.destroy();
    });
    preloadWorldMap(this);
    preloadHero(this, Object.values(this.game_.state.characters).map((c) => c.classId));
    preloadWornSets(this, Object.values(this.game_.state.characters));
    preloadLoot(this);
    // Every open area's kit and the next one's, which waits under the cloud.
    const { areas } = this.game_.state.board;
    // Two tiers ahead for a grown land, whose ground is drawn whole and at once: its kit must be here before it opens (mine).
    // A painted region comes and goes with the camera (`fitRegions`); only the one you stand in comes now.
    const reach = Math.max(...this.game_.me.opened.map((id) => areas[id]?.tier ?? 1)) + 2;
    const here = areas[this.game_.state.board.spaces[this.game_.me.space]?.area ?? ''];
    preloadBoardKits(this, [...Object.values(areas).filter((a) => a.tier <= reach && !PAINTED[a.id] && !a.dungeon).map((a) => a.theme), ...(here && PAINTED[here.id] ? [here.theme] : [])]);
    preloadKit(this);
    preloadAbilityIcons(this);
    preloadSeals(this);
    // The fourth class's sounds only for those who play one; the forest's only once you are in it.
    const me = this.game_.me;
    audio.preload(this, [...(me.classId === 'warrior' ? [] : ['fight-classes']), ...(me.opened.some((id) => areas[id]?.theme === 'forest') ? ['creatures-forest'] : [])]);
  }

  private drawToken(): void {
    const me = this.game_.me;
    const space = this.game_.state.board.spaces[me.space]!;
    if (heroReady(this, me.classId)) {
      // The hero stands on the spot: his feet at the spot's centre, a touch up (the container sits above it).
      this.hero = new Hero(this, me, 0, SPACE_RADIUS + 2, HERO_BOARD_SCALE);
      this.hero.face(true);
      this.token = this.add.container(space.x, space.y - SPACE_RADIUS - 6, [this.hero.root]).setDepth(10);
      return;
    }
    const body = this.add.circle(0, 0, TOKEN_RADIUS, CLASS_COLORS[me.classId] ?? 0xffffff, 1);
    body.setStrokeStyle(3, 0x101318, 1);
    const letter = this.add
      .text(0, 0, CLASS_DATA[me.classId].name.charAt(0), { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#101318', resolution: 2 })
      .setOrigin(0.5);
    this.token = this.add.container(space.x, space.y - SPACE_RADIUS - 6, [body, letter]).setDepth(10);
  }

  /** The token where the state says the character stands, without a walk (after a snapshot). */
  private placeToken(): void {
    const space = this.game_.state.board.spaces[this.game_.me.space];
    if (space) this.token.setPosition(space.x, space.y - SPACE_RADIUS - 6);
  }

  /** The other players: a smaller mark with the class letter and the name, to the right of the spot; dim when offline. */
  private drawOthers(): void {
    const { characters, board } = this.game_.state;
    const online = new Set(this.game_.onlinePlayers());
    const seen = new Set<string>();
    const perSpace = new Map<string, number>();
    for (const c of Object.values(characters)) {
      if (c.id === this.game_.player) continue;
      const space = board.spaces[c.space];
      if (!space) continue;
      seen.add(c.id);
      const n = perSpace.get(c.space) ?? 0;
      perSpace.set(c.space, n + 1);
      let mark = this.others.get(c.id);
      const fresh = !mark;
      if (!mark) {
        // Others stand in what they wear, a little smaller than you (chapter 2, step 8); circles only if the hero's art is missing.
        const figure = heroReady(this, c.classId) ? new Hero(this, c, 0, 8, HERO_BOARD_SCALE * 0.85) : null;
        // Someone of a class not loaded yet: a circle until it is, then the figure.
        if (!figure) {
          const id = c.id;
          preloadHero(this, [c.classId]);
          this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            this.others.get(id)?.destroy();
            this.others.delete(id);
            this.drawOthers();
          });
          this.load.start();
        }
        if (figure) this.otherHeroes.set(c.id, figure);
        const body: Phaser.GameObjects.GameObject[] = figure ? [figure.root] : [this.add.circle(0, 0, TOKEN_RADIUS - 3, CLASS_COLORS[c.classId] ?? 0xffffff, 1).setStrokeStyle(2, 0x101318, 1), this.add.text(0, 0, CLASS_DATA[c.classId].name.charAt(0), { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#101318', resolution: 2 }).setOrigin(0.5)];
        const name = this.add.text(0, 12, c.name, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#1a2030', strokeThickness: 3, resolution: 2 }).setOrigin(0.5, 0);
        mark = this.add.container(0, 0, [...body, name]).setDepth(9);
        this.others.set(c.id, mark);
      }
      this.otherHeroes.get(c.id)?.wear(c);
      const x = space.x + 34 + n * 26;
      const y = space.y + 6;
      if (fresh || settings.get().fewerEffects) mark.setPosition(x, y);
      else if (mark.x !== x || mark.y !== y) this.tweens.add({ targets: mark, x, y, duration: 300, ease: 'Sine.easeInOut' });
      mark.setAlpha(online.has(c.id) ? 1 : 0.45);
    }
    for (const [id, mark] of this.others) {
      if (!seen.has(id)) {
        mark.destroy();
        this.others.delete(id);
        this.otherHeroes.delete(id);
      }
    }
  }

  // ---- the camera --------------------------------------------------------------------------------------------------

  private setupCamera(board: Board): void {
    const cam = this.cameras.main;
    // The band between the HUD panel and the bottom controls; the HUD scene draws over the rest.
    // The band between the HUD and the strip, in canvas pixels (the canvas draws at DPR, hires.ts).
    cam.setViewport(0, HUD_PLANK * DPR, SCREEN_WIDTH * DPR, (PLANK_TOP - HUD_PLANK) * DPR);
    this.fitBounds();
    cam.setRoundPixels(true);
    this.minZoom = this.overviewZoom();
    this.follow(true);
  }

  /** The camera stays over the land that is open: the painted land, or an area's box; on a world with nothing painted, the whole board. */
  private fitBounds(): void {
    const { board } = this.game_.state;
    if (!this.painted) {
      this.cameras.main.setBounds(0, 0, board.width, board.height);
      return;
    }
    const b = this.openBounds();
    // A margin over the top, so the goal line does not sit on the land.
    const pad = this.dungeonHere() ? 0 : MAP_TOP_PAD;
    this.cameras.main.setBounds(b.x, b.y - pad, b.width, b.height + pad);
  }

  /** On the world map, a land you are not in says its name and its level (Robin, 2026-11-02), and what opens it while it is shut. */
  private landWords(area: Area): string {
    const board = this.game_.state.board;
    const gate = Object.values(board.spaces).find((s) => s.opens === (area.openWith ?? area.id));
    const keeper = gate?.boss && !this.game_.me.opened.includes(area.id) ? (creature(gate.boss, board.bestiary)?.name ?? '') : '';
    return `${area.name}${area.city ? '' : `\nLevel ${area.levels[0]} to ${area.levels[1]}`}${keeper ? `\nBeat ${keeper}` : ''}`;
  }

  /** The lands not in the world yet, closed on the map: a silhouette, marks, their name and levels (Robin, 2026-11-02). */
  /** Words over a closed land, read from the zoomed-out map: what opens it, and creatures you have not met. */
  private closedWords(area: Area): void {
    const box = PAINTED[area.id]!;
    const board = this.game_.state.board;
    const gate = Object.values(board.spaces).find((s) => s.opens === area.id);
    // A land behind a gate wears its words under it: its middle has the silhouette and the marks.
    const gated = !!gate?.boss && !!(WORLD_DATA as unknown as { gates?: { opens: string }[] }).gates?.some((g) => g.opens === area.id && g.opens !== 'kingswood');
    const middle = box.x + box.width / 2;
    const hang = middle < EDGE_WORDS ? 0 : middle > board.width - EDGE_WORDS ? 1 : 0.5;
    const wordX = hang === 0 ? EDGE_INSET : hang === 1 ? board.width - EDGE_INSET : middle;
    // The words of a land with a city in its middle sit below the city's own.
    const holdsCity = Object.values(board.areas).some((x) => x.city && x.openWith === area.id);
    const words = this.add.text(wordX, gated ? box.y + box.height + 30 : box.y + box.height / 2 + (holdsCity ? 620 : 0), this.landWords(area), { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#fff8e8', align: 'center', stroke: '#1a2030', strokeThickness: 3 }).setOrigin(0.5).setDepth(KIT_DEPTH.names).setAlpha(0.85);
    words.setOrigin(hang, words.originY);
    this.closedLabels.set(area.id, words);
    // What waits there: the boss's silhouette, and a "?" at each ground (Mitch, AD).
    if (!this.textures.exists(FOG_PIECES) || !(gate?.boss || area.openWith) || (!area.openWith && !(WORLD_DATA as unknown as { gates?: { opens: string }[] }).gates?.some((g) => g.opens === area.id))) return;
    const marks: Phaser.GameObjects.Image[] = [];
    const boss = Object.values(board.spaces).find((s) => s.area === area.id && sealAt(board, s.id));
    const shape = boss?.boss === 'briar-king' ? 'silhouette_grumblebark' : boss?.boss === 'frost-matriarch' ? 'silhouette_queen' : boss?.boss === 'mother-murk' ? 'silhouette_murk' : boss?.boss === 'frostbeard' ? 'silhouette_frostbeard' : null;
    const eastShape = shape === 'silhouette_murk' || shape === 'silhouette_frostbeard';
    if (boss && shape) marks.push(this.add.image(boss.x, boss.y + (shape === 'silhouette_queen' || eastShape ? 40 : 0), eastShape ? FOG_EAST_PIECES : FOG_PIECES, shape));
    if (boss?.boss === 'captain-saltjaw' && this.textures.exists(FOG_FAR_PIECES)) marks.push(this.add.image(boss.x, boss.y, FOG_FAR_PIECES, 'silhouette_captain'));
    if (boss?.boss === 'yeti-king' && this.textures.exists(FOG_FAR_PIECES)) marks.push(this.add.image(boss.x, boss.y, FOG_FAR_PIECES, 'silhouette_yeti_king'));
    for (const g of area.openWith ? [] : groundsOf(board, area.id)) {
      const hub = board.spaces[g.hub];
      if (hub) marks.push(this.add.image(hub.x, hub.y, FOG_PIECES, 'mark_unknown'));
    }
    for (const mark of marks) mark.setOrigin(0.5, 1).setDepth(KIT_DEPTH.names);
    this.closedMarks.set(area.id, marks);
  }

  private drawGates(): void {
    const opened = new Set(this.game_.me.opened);
    for (const gate of worldGates()) {
      const atlas = gate.theme ? themedPlaces(this, gate.theme) : placesAtlas(this, gate.barred);
      if (atlas && !this.gates.has(gate)) this.gates.set(gate, this.add.image(gate.foot.x, gate.foot.y, atlas, opened.has(gate.opens) ? gate.open : gate.barred).setScale(0.5).setDepth(standingDepth(gate.foot.y)));
    }
  }

  /**
   * A painted region's board art is held only near you or near the camera (Robin, 2026-11-02: more land must not hold more memory), with room
   * between coming and going so a border does not churn. Far off, its spots wear the Meadows' plates and its props are not drawn: the ground is baked.
   */
  private fitRegions(): void {
    if (!this.token || !this.painted) return;
    const cam = this.cameras.main;
    const inside = !!this.dungeonHere();
    const points = inside ? [] : [{ x: this.token.x, y: this.token.y }, ...(cam.zoom >= CHUNK_ZOOM ? [cam.midPoint] : [])];
    const away = (land: { x: number; y: number; width: number; height: number }, p: { x: number; y: number }): number =>
      Math.hypot(Math.max(land.x - p.x, 0, p.x - land.x - land.width), Math.max(land.y - p.y, 0, p.y - land.y - land.height));
    const { areas } = this.game_.state.board;
    for (const [id, land] of Object.entries(PAINTED)) {
      const area = areas[id];
      // The Meadows' art stays, and the Kingswood and the city use only that.
      if (!area || area.theme === 'meadow' || area.theme === 'city') continue;
      const nearest = Math.min(Infinity, ...points.map((p) => away(land, p)));
      if (nearest < REGION_NEAR && !this.regions.has(id)) this.bringRegion(area);
      else if (nearest > REGION_FAR && this.regions.has(id)) this.dropRegion(area);
    }
  }

  private bringRegion(area: Area): void {
    this.regions.add(area.id);
    const ready = (): void => {
      // Walked away while it loaded: dropRegion has freed what came.
      if (!this.regions.has(area.id) || !regionHeld(this, area.theme)) return;
      this.dressRegion(area);
    };
    if (regionHeld(this, area.theme)) {
      ready();
      return;
    }
    preloadRegion(this, area.theme);
    this.load.once(Phaser.Loader.Events.COMPLETE, ready);
    this.load.start();
    this.log.note(`region art: loading ${area.name}`);
  }

  private dressRegion(area: Area): void {
    const kit = kitFor(this, area.theme);
    if (!kit) return;
    clearKitProps(area.id);
    drawKitProps(this, kit, area);
    if (this.game_.me.opened.includes(area.id)) raiseTallProps(area.id);
    this.dressPlates(area, kit);
    this.drawGates();
    this.lastCull.count = -1;
  }

  private dressPlates(area: Area, kit: NonNullable<ReturnType<typeof kitFor>>): void {
    for (const space of Object.values(this.game_.state.board.spaces)) {
      if (space.area !== area.id) continue;
      const plate = this.circles.get(space.id);
      if (plate instanceof Phaser.GameObjects.Image) dressPlate(this, kit, space, plate);
    }
  }

  private dropRegion(area: Area): void {
    this.regions.delete(area.id);
    const kit = kitFor(this, area.theme);
    if (!kit) return;
    clearKitProps(area.id);
    // What was drawn from these atlases lets go first.
    const going = [kit.props, kit.ground, ...regionPlaces(area.theme)];
    for (const [gate, image] of this.gates) {
      if (!going.includes(image.texture.key)) continue;
      image.destroy();
      this.gates.delete(gate);
    }
    freeRegion(this, area.theme);
    this.dressPlates(area, kit);
    this.lastCull.count = -1;
    this.log.note(`region art: freed ${area.name}`);
  }

  /** The dungeon you stand in, if any: the map is then only that. */
  private dungeonHere(): Area | null {
    const { board } = this.game_.state;
    const area = board.areas[board.spaces[this.game_.me.space]?.area ?? ''];
    return area?.dungeon ? area : null;
  }

  /** The lands drawn: what is open, but a dungeon only while you stand in it. */
  private shownAreas(): Set<string> {
    const { board } = this.game_.state;
    const here = this.dungeonHere();
    // Inside, only that: its chunks share grid squares with the land outside.
    if (here) return new Set([here.id]);
    return new Set(this.game_.me.opened.filter((id) => !board.areas[id]?.dungeon));
  }

  /** The box round everything open, and the zoom that fits it in the band. */
  private openBounds(): { x: number; y: number; width: number; height: number } {
    // All the painted land, closed or not: what lies ahead is there to look at (Robin, 2026-11-02).
    const all = Object.values(this.game_.state.board.areas);
    const inside = this.dungeonHere();
    // The west is there to look at from the start; each land in the east once the land before it is open.
    const opened = this.game_.me.opened;
    const inSight = (a: Area): boolean => !!PAINTED[a.id];
    const areas = all.filter((a) => !a.dungeon && (opened.includes(a.id) || (this.painted && inSight(a))));
    const list: Area[] = inside ? [inside] : areas.length ? areas : all.filter((a) => !a.dungeon);
    const boxes = list.map((a) => DUNGEON_LAND[a.id] ?? PAINTED[a.id] ?? a.bounds);
    const x = Math.min(...boxes.map((a) => a.x));
    const y = Math.min(...boxes.map((a) => a.y));
    const right = Math.max(...boxes.map((a) => a.x + a.width));
    const bottom = Math.max(...boxes.map((a) => a.y + a.height));
    return { x, y, width: right - x, height: bottom - y };
  }

  private overviewZoom(): number {
    const cam = this.cameras.main;
    const b = this.openBounds();
    // The hand-laid world fits at 0.12 or more; a world grown wider than that may pull back further, down to the floor.
    const fit = Math.min(cam.width / b.width, cam.height / b.height);
    if (this.dungeonHere()) return Math.max(fit, CHUNK_ZOOM + 0.02);
    return Math.max(fit >= HARD_MIN_ZOOM ? HARD_MIN_ZOOM : ZOOM_FLOOR, fit);
  }

  /** Follow the token at the follow zoom. `snap` puts the camera there at once; otherwise it glides from where it is. */
  private follow(snap: boolean): void {
    const cam = this.cameras.main;
    cam.panEffect.reset();
    this.fitBounds();
    const { scrollX, scrollY } = cam;
    cam.startFollow(this.token, true, FOLLOW_LERP, FOLLOW_LERP);
    if (snap) {
      cam.zoomEffect.reset();
      cam.setZoom(FOLLOW_ZOOM);
    } else {
      // startFollow jumps to the token; put the camera back and let the lerp carry it there.
      cam.setScroll(scrollX, scrollY);
      cam.zoomTo(FOLLOW_ZOOM, settings.ms(CAMERA_MS), 'Sine.easeInOut', true);
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
    // A world wider than it is tall sits in the middle of the band, not stuck to its top.
    const spare = Math.max(0, (cam.height / this.minZoom - b.height) / 2);
    cam.setBounds(b.x, b.y - spare, b.width, b.height + spare * 2);
    this.unfollow();
    cam.pan(b.x + b.width / 2, b.y + b.height / 2, settings.ms(CAMERA_MS), 'Sine.easeInOut', true);
    cam.zoomTo(this.minZoom, settings.ms(CAMERA_MS), 'Sine.easeInOut', true);
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
    // The signs and chips stand over the map: frame the spots in what stays clear, from under the top signs to above the chips.
    const clear = FRAME_BOTTOM - HUD_HEIGHT;
    const zoom = Phaser.Math.Clamp(Math.min(cam.width / (maxX - minX), (clear * DPR) / (maxY - minY)), this.minZoom, FOLLOW_ZOOM);
    const shift = ((PLANK_TOP + HUD_PLANK - FRAME_BOTTOM - HUD_HEIGHT) / 2) * DPR / zoom;
    this.unfollow();
    cam.pan((minX + maxX) / 2, (minY + maxY) / 2 + shift, settings.ms(CAMERA_MS), 'Sine.easeInOut', true);
    cam.zoomTo(zoom, settings.ms(CAMERA_MS), 'Sine.easeInOut', true);
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
    // The pointer is in canvas pixels, the band in design pixels (hires.ts).
    const hud = this.scene.get('hud') as HudScene;
    return !hud.covers(p.x / DPR - (SCREEN_WIDTH - DESIGN_WIDTH) / 2, p.y / DPR);
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
    if (this.drag && p.id === this.drag.pointer) {
      const tapped = !this.drag.moved;
      this.drag = null;
      if (tapped) this.onTapped(p);
    }
  }

  /** Two quick taps in the same place zoom all the way out, or from there all the way in where you tapped (Robin, 2026-11-01). */
  private onTapped(p: Phaser.Input.Pointer): void {
    const now = this.time.now;
    const near = Phaser.Math.Distance.Between(p.x, p.y, this.lastTap.x, this.lastTap.y) < 40 * DPR;
    const twice = now - this.lastTap.at < DOUBLE_TAP_MS && near;
    this.lastTap = twice ? { at: -Infinity, x: 0, y: 0 } : { at: now, x: p.x, y: p.y };
    if (!twice || this.walking) return;
    const cam = this.cameras.main;
    if (cam.zoom > this.minZoom * 1.15) {
      this.overview();
      return;
    }
    const at = cam.getWorldPoint(p.x, p.y);
    this.unfollow();
    cam.panEffect.reset();
    cam.zoomEffect.reset();
    cam.pan(at.x, at.y, settings.ms(CAMERA_MS), 'Sine.easeInOut', true);
    cam.zoomTo(MAX_ZOOM, settings.ms(CAMERA_MS), 'Sine.easeInOut', true);
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
    const options = reachable(board, me.space, me.steps, walkable(me));
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
      // What is there, beside it (Robin, 2026-11-02: "some tooltips next to those spots saying what it is").
      const at = board.spaces[o.space]!;
      this.reachLabels.push(this.add.text(at.x, at.y, this.spotWord(at), { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#fff8e8', backgroundColor: '#2a1a0cdd', padding: { x: 5, y: 2 } }).setOrigin(0, 0.5).setDepth(9).setData('x', at.x));
    }
    this.tweens.add({ targets: rings, alpha: 0.25, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.frame([this.token, ...options.map((o) => board.spaces[o.space]!)]);
    this.hud?.setChips(cards);
    const tip = tips.take('choice');
    this.setMessage(`${lead || `Rolled ${value}.`} ${tip ?? 'Tap a lit spot to walk there.'}`);
  }

  /** The dice cards in the bag, as chips for the HUD's row. a Fairy Pick turns the row into the numbers. */
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
    // A Rabbit's Foot worn: a re-roll, once every so often.
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
    if (offer?.kind === 'arena') this.offerArena();
    else if (offer?.kind === 'gamble') this.offerGamble();
    else if (offer?.kind === 'board') this.offerBoard();
    else if (offer?.kind === 'roll') this.offerRoll();
    else if (offer?.kind === 'loot') this.offerKeep();
  }

  /** A question in its window (`AskScene`), once any card on show has gone. */
  private ask(request: AskRequest): void {
    this.setBusy(true);
    // A flag, not isActive: the last window's stop may still be queued when the next question comes in the same frame.
    const open = () => {
      if (this.asking) return;
      this.asking = true;
      this.scene.launch('ask', request);
    };
    const m = moments(this);
    if (m) m.whenQuiet(open);
    else open();
  }

  /** An answer went out: the window goes, and the tap that closed it stays off the board. */
  private closeAsk(): void {
    if (!this.asking) return;
    this.asking = false;
    this.scene.stop('ask');
    this.overlayClosedAt = this.time.now;
    this.overlayClosedFrame = this.game.loop.frame;
  }

  private answerChallenge(space: string): void {
    this.closeAsk();
    this.send({ type: 'challenge', player: this.game_.player, space }, (events) => {
      if (!this.game_.me.fight) {
        this.finish(this.describe(events));
        return;
      }
      this.placeToken();
      this.follow(true);
      this.openFight();
    });
  }

  /** The coach: the shop closes, you are there, rested. */
  travelTo(to: string): void {
    this.send({ type: 'travel', player: this.game_.player, to }, (events) => {
      const went = events.find((e) => e.type === 'traveled');
      if (went?.type !== 'traveled') {
        const shop = this.scene.isActive('shop') ? (this.scene.get('shop') as { showMessage?: (t: string) => void }) : null;
        shop?.showMessage?.(this.describe(events));
        return;
      }
      this.shopLeft();
      sfx.play('ui/arrive-town');
      this.placeToken();
      this.follow(true);
      this.finish(`The coach to ${this.game_.state.board.spaces[to]?.name ?? 'town'}: ${went.price} gold. Rested.`);
    });
  }

  /** A potion or loot spot (Robin, 2026-11-02): a roll for it, seen on the big die. */
  private offerRoll(): void {
    const offer = this.game_.me.offer;
    if (!offer || offer.kind !== 'roll') return;
    const flask = offer.what === 'flask';
    const find = offer.what === 'find';
    this.setMessage(find ? 'You found something!' : flask ? 'A potion spot.' : 'A loot spot.');
    this.refreshHud();
    this.ask({
      icon: flask ? 'potion' : find ? 'mark_star' : 'item_gold',
      color: flask ? 0x5aa9ff : find ? 0xf4c14a : 0xc98a3c,
      title: find ? 'A rare find' : flask ? 'A potion spot' : 'A loot spot',
      text: find ? `${offer.text} Roll ${offer.need === 6 ? 'a 6' : `${offer.need} or better`}: one try.` : `Roll ${offer.need} or better for ${flask ? 'a free potion' : 'a piece of basic gear'}.`,
      options: [{ label: 'Roll', color: COLORS.button, onTap: () => this.answerRoll() }],
    });
  }

  answerRoll(): void {
    this.closeAsk();
    this.hud?.startRoll();
    this.send({ type: 'try', player: this.game_.player }, (events) => {
      const tried = events.find((e) => e.type === 'tried');
      if (tried?.type !== 'tried') {
        this.hud?.cancelRoll();
        this.finish(this.describe(events));
        return;
      }
      const landed = () => {
        if (!tried.won) moments(this)?.find('mark_alert', `You rolled ${tried.roll}`, `It needed ${tried.need}.${tried.what === 'find' ? ' It stays out of reach.' : ' Try again in five minutes.'}`, 0xff7a5c);
        this.showFinds(events);
        this.reveal(prizesIn(events), 'You won!', () => this.finish(tried.won ? `You rolled ${tried.roll} and won it.` : `You rolled ${tried.roll}. No luck.`));
      };
      if (this.hud) this.hud.landDie(tried.roll, landed);
      else landed();
    });
  }

  /** The quest board (Robin, 2026-11-02): pick one of what it offers; with one under way, keep it or drop it. */
  private offerBoard(): void {
    const me = this.game_.me;
    const offer = me.offer;
    if (!offer || offer.kind !== 'board') return;
    sfx.play('ui/board-open');
    this.refreshHud();
    const mine = me.quests[0];
    if (mine) {
      this.setMessage('The quest board.');
      this.ask({
        icon: 'mark_scroll',
        color: 0xe8b84a,
        title: 'You have a quest',
        text: questLine(mine),
        pays: 'One at a time. Drop it to pick another.',
        options: [
          { label: 'Keep going', color: COLORS.button, onTap: () => this.answerQuest(false) },
          { label: 'Drop it', color: COLORS.log, onTap: () => this.answerQuest(false, 0, true) },
        ],
      });
      return;
    }
    this.setMessage(offer.from ? `${offer.from} flags you down.` : 'The quest board.');
    const words = { kill: 'Hunt', loot: 'Gather', mini: 'Mini-boss', find: 'Find someone' };
    this.ask({
      color: 0xe8b84a,
      title: offer.from ?? 'Quest Board',
      text: offer.from ? `${offer.from} has a job for you, if you want it. It pays with a chest.` : 'One at a time. It pays the moment you finish it, with a chest.',
      options: [
        ...offer.quests.map((q, i) => ({ label: `${words[q.kind]}: ${q.xp} xp, ${q.gold} g`, color: COLORS.button, note: q.text, onTap: () => this.answerQuest(true, i) })),
        { label: 'Not now', color: COLORS.log, onTap: () => this.answerQuest(false) },
      ],
    });
  }

  answerQuest(accept: boolean, index = 0, drop = false): void {
    this.closeAsk();
    this.send({ type: 'quest', player: this.game_.player, accept, index, drop }, (events) => {
      this.hud?.setChips([]);
      const taken = events.find((e) => e.type === 'questTaken');
      if (taken?.type === 'questTaken') {
        sfx.play('ui/errand-take');
        moments(this)?.find('mark_scroll', 'Quest taken', taken.quest.text, 0xe8b84a);
      }
      this.log.note(`quest ${accept ? 'taken' : drop ? 'dropped' : 'left'}`);
      // Stopped on the way past: the walk goes on.
      if (events.some((e) => e.type === 'landed')) {
        this.went([], events);
        return;
      }
      this.finish(taken?.type === 'questTaken' ? `Quest: ${taken.quest.text}` : drop ? 'Quest dropped.' : 'Maybe later.');
    });
  }

  /** A piece with no room in the bag: sold on the spot, or left (Robin, 2026-10-31: a bag limit with a sell-or-drop choice). */
  private offerKeep(): void {
    const offer = this.game_.me.offer;
    if (!offer || offer.kind !== 'loot') return;
    const g = offer.gear;
    this.setMessage('Your bag is full.');
    this.ask({
      icon: 'item_gold',
      color: 0xe8b84a,
      title: 'Your bag is full',
      text: describeGear(g),
      options: [
        { label: `Sell it for ${sellPrice(g)} gold`, color: COLORS.button, onTap: () => this.answerKeep('sell') },
        { label: 'Leave it', color: COLORS.log, onTap: () => this.answerKeep('drop') },
      ],
    });
  }

  answerKeep(choice: 'sell' | 'drop'): void {
    this.closeAsk();
    this.send({ type: 'keep', player: this.game_.player, choice }, (events) => {
      this.hud?.setChips([]);
      const sold = events.find((e) => e.type === 'sold');
      const dropped = events.find((e) => e.type === 'dropped');
      this.finish(sold?.type === 'sold' ? `Sold ${sold.gear.name} for ${sold.price} gold.` : dropped?.type === 'dropped' ? `Left ${dropped.gear.name} behind.` : this.describe(events));
    });
  }

  /** Between the Arena's waves: take the pot, or go on for more and risk it. */
  private offerArena(): void {
    const offer = this.game_.me.offer;
    if (offer?.kind !== 'arena') return;
    const me = this.game_.me;
    const last = offer.wave >= offer.total;
    const pot = `In the pot: ${offer.gold} gold, ${offer.xp} xp${offer.gear ? ' and a fine piece' : ''}`;
    this.setMessage(last ? 'The Arena is yours.' : 'The crowd wants more.');
    this.ask({
      icon: 'mark_star',
      color: 0xe8b84a,
      title: last ? 'You beat them all!' : `Wave ${offer.wave} of ${offer.total} won`,
      text: last ? 'Nobody is left to fight. The crowd is on its feet.' : `You have ${me.hp} of ${stats(me).maxHp} HP. Fall or flee, and the pot is lost.`,
      pays: pot,
      options: [
        ...(last ? [] : [{ label: `Go on: wave ${offer.wave + 1}`, color: COLORS.button, onTap: () => this.answerArena('next') }]),
        { label: 'Take it and leave', color: last ? COLORS.button : COLORS.log, onTap: () => this.answerArena('take') },
      ],
    });
  }

  private answerArena(op: 'next' | 'take'): void {
    this.closeAsk();
    this.send({ type: 'arena', player: this.game_.player, op }, (events) => {
      if (this.game_.me.fight) {
        this.openFight();
        return;
      }
      const taken = events.find((e) => e.type === 'arenaTaken');
      this.refreshHud();
      this.reveal(prizesIn(events), 'From the Arena', () => {
        this.finish(taken?.type === 'arenaTaken' ? `You leave the Arena with ${taken.gold} gold and ${taken.xp} xp.` : this.describe(events));
        if (this.game_.me.offer) this.offerChoice();
      });
    });
  }

  /** Back to the hub: free, with a short wait (Robin, 2026-11-02). */
  goHome(): void {
    const me = this.game_.me;
    if (me.fight || me.offer) return;
    if (this.busy) {
      this.setMessage('Finish your walk first, then go home.');
      return;
    }
    const hub = hubOf(this.game_.state, me);
    if (!hub) {
      this.setMessage('Beat the first boss to open the way to Crownhaven.');
      return;
    }
    const left = (me.cooldowns.home ?? 0) - this.game_.now();
    if (hub === me.space) return;
    if (left > 0) {
      this.setMessage(`You can go home again in ${countdown(left)}.`);
      return;
    }
    this.send({ type: 'home', player: this.game_.player }, (events) => {
      if (!events.some((e) => e.type === 'wentHome')) {
        this.finish(this.describe(events));
        return;
      }
      this.clearChoices?.();
      this.placeToken();
      this.refreshCovers();
      this.minZoom = this.overviewZoom();
      this.follow(true);
      this.drawSpawns();
      this.refreshHud();
      sfx.play('ui/arrive-town');
      this.finish(`Home in ${this.game_.state.board.spaces[hub]?.name ?? 'the city'}. Rested.`);
    });
  }

  /** At a door: go through, or not. Inside, it is the way back to daylight. */
  private offerDoor(): void {
    const { board } = this.game_.state;
    const here = board.spaces[this.game_.me.space];
    const beyond = board.spaces[here?.door ?? ''];
    if (!here || !beyond) return;
    const inside = !!board.areas[here.area]?.dungeon;
    if (here.sealed && !sealsAllWon(board, this.game_.me)) {
      this.finish('A door with seven sockets. It wants every land’s Seal.');
      return;
    }
    const land = board.areas[beyond.area];
    this.setMessage(inside ? 'Daylight, up ahead.' : `${here.name}.`);
    this.ask({
      icon: 'mark_alert',
      color: inside ? 0xf4c14a : 0x6b5a78,
      title: here.name || 'A door',
      text: inside ? 'The way back out to the open air. You can come back whenever you like.' : 'A cold breath from the dark. Something waits at the far end.',
      ...(inside || !land ? {} : { pays: `Levels ${land.levels[0]} to ${land.levels[1]}` }),
      options: [
        { label: inside ? 'Go out' : 'Go in', color: COLORS.button, onTap: () => this.goThrough() },
        { label: 'Not yet', color: COLORS.log, onTap: () => { this.closeAsk(); this.finish(inside ? 'You stay in the dark a while.' : 'You leave it be, for now.'); } },
      ],
    });
  }

  private goThrough(): void {
    this.closeAsk();
    this.send({ type: 'door', player: this.game_.player }, (events) => {
      if (!events.some((e) => e.type === 'doored')) {
        this.finish(this.describe(events));
        return;
      }
      const { board } = this.game_.state;
      this.placeToken();
      this.refreshCovers();
      this.minZoom = this.overviewZoom();
      this.follow(true);
      this.drawSpawns();
      this.refreshHud();
      sfx.play('ui/arrive-town');
      this.finish(`You step through to ${board.areas[board.spaces[this.game_.me.space]!.area]?.name ?? 'the other side'}.`);
    });
  }

  /** At the Arena's gate: three ways in while it is open, each once a day; a word when it is closed. */
  private offerGate(): void {
    const me = this.game_.me;
    const now = this.game_.now();
    const { board } = this.game_.state;
    const area = board.spaces[me.space]!.area;
    if (!arenaOpen(me, now)) {
      this.finish(`The Arena is closed. It opens on ${nextDay('arena', now)}.`);
      return;
    }
    const modes = (Object.keys(ARENA.modes) as ArenaMode[]).filter((mode) => !arenaTried(me, mode, now));
    if (!modes.length) {
      this.finish('You have fought every way there is today. Come back next time it opens.');
      return;
    }
    this.setMessage('The Arena is open.');
    this.ask({
      icon: 'mark_star',
      color: 0xe8b84a,
      title: 'The Arena',
      text: `${ARENA.waves.length} fights in a row, HP and mana carried over, ${ARENA.flasks} flasks at most. After each win, take the pot or go on. Fall or flee, and it is lost. Each way once a day.`,
      pays: `Win ${ARENA.gearFrom} and a fine piece comes with the pot`,
      options: [
        ...modes.map((mode) => {
          const fee = arenaFee(board, area, mode);
          return { label: `${ARENA.modes[mode].name} · ${fee} g`, note: ARENA.modes[mode].words, color: mode === 'nightmare' ? 0xd9534f : mode === 'hard' ? 0xe8a23c : COLORS.button, onTap: () => this.enterArena(mode) };
        }),
        { label: 'Not today', color: COLORS.log, onTap: () => { this.closeAsk(); this.finish('You leave the crowd to it.'); } },
      ],
    });
  }

  private enterArena(mode: ArenaMode): void {
    this.closeAsk();
    this.send({ type: 'arena', player: this.game_.player, op: 'enter', mode }, (events) => {
      if (!this.game_.me.fight) {
        this.finish(this.describe(events));
        return;
      }
      this.openFight();
    });
  }

  /** The Arena's mark over its town while it is open, and the word when it opens or closes. */
  private drawArena(): void {
    const me = this.game_.me;
    const { board } = this.game_.state;
    const open = arenaOpen(me, this.game_.now());
    const spots = me.opened.map((area) => arenaSpot(board, area)).filter((id): id is string => !!id);
    if (spots.map((id) => loadArenaFor(this, id)).some(Boolean)) {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.arenaDrawnKey = '';
        this.drawArena();
      });
      this.load.start();
    }
    const key = `${open}|${spots.join()}`;
    if (key === this.arenaDrawnKey) return;
    this.arenaDrawnKey = key;
    for (const part of this.arenaParts) part.destroy();
    this.arenaParts = [];
    this.arenaBuildings = [];
    for (const id of spots) {
      const drawn = drawArenaBuilding(this, id, open);
      const space = board.spaces[id]!;
      // The top bar's slip (Mitch, AD's). These sizes are his 12 px sign in world pixels, so it reads the same at the follow zoom.
      const x = drawn?.x ?? space.x;
      const y = drawn ? drawn.top : space.y - 90;
      const slip = plate(this, 'board_slip', x, y, open ? 106 : 172, 32).setDepth(9);
      const ink = { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#3a2410', resolution: 2 };
      const word = this.add.text(x, y, open ? 'Arena' : 'Arena: ', ink).setOrigin(open ? 0.5 : 0, 0.5).setDepth(9.01);
      this.arenaParts.push(slip, word);
      if (!open) {
        const shut = this.add.text(0, y, 'closed', { ...ink, color: '#a23c2c' }).setOrigin(0, 0.5).setDepth(9.01);
        const left = x - (word.width + shut.width) / 2;
        word.setX(left);
        shut.setX(left + word.width);
        this.arenaParts.push(shut);
      }
      if (drawn) {
        this.arenaParts.push(...drawn.near, drawn.far);
        this.arenaBuildings.push(drawn);
      }
    }
    this.fitArena();
  }

  /** Zoomed right out, the far frame stands in for the big one, which would sparkle. */
  private fitArena(): void {
    const far = this.cameras.main.zoom / DPR < 0.3;
    if (far === this.arenaFar && this.arenaBuildings.every((b) => b.far.visible === far)) return;
    this.arenaFar = far;
    for (const b of this.arenaBuildings) {
      b.far.setVisible(far);
      for (const part of b.near) (part as Phaser.GameObjects.Image).setVisible(!far);
    }
  }

  private checkArena(): void {
    const me = this.game_.me;
    const open = arenaOpen(me, this.game_.now());
    if (open === this.arenaWasOpen || this.busy || this.choices_) return;
    const first = this.arenaWasOpen === null;
    this.arenaWasOpen = open;
    this.drawArena();
    if (first && !open) return;
    if (open) moments(this)?.find('mark_star', 'The Arena is open', 'Fights in a row, at the end of the road. Dare you?', 0xe8b84a);
    else this.setMessage('The Arena has closed for today.');
  }

  /** The gambler's question in the HUD's row. */
  private offerGamble(): void {
    const offer = this.game_.me.offer;
    if (!offer || offer.kind !== 'gamble') return;
    this.setMessage('A gambler stops you.');
    this.ask({
      icon: 'item_gold',
      color: 0xe8b84a,
      title: 'A gambler stops you',
      text: 'Double or nothing. Call the die.',
      pays: `Stake: ${offer.stake} gold`,
      options: [
        { label: 'High: 4 to 6', color: COLORS.button, onTap: () => this.answerGamble('high') },
        { label: 'Low: 1 to 3', color: COLORS.button, onTap: () => this.answerGamble('low') },
        { label: 'Walk on', color: COLORS.log, onTap: () => this.answerGamble('pass') },
      ],
    });
  }

  private onSpaceTap(id: string): void {
    const me = this.game_.me;
    if (!this.choices_) {
      const space = this.game_.state.board.spaces[id];
      if (!space) return;
      // Standing on a shop or a town with nothing pending: a tap on it goes back in. Any other spot tells about itself.
      const camped = this.game_.state.spawns[id]?.kind === 'merchant';
      if (!this.busy && id === me.space && (space.kind === 'shop' || space.kind === 'town' || camped)) {
        this.openShop(camped && space.kind !== 'town' && space.kind !== 'shop');
        return;
      }
      // Inside the walls: tap a spot and walk there, no die (Robin, 2026-11-02).
      if (!this.busy && !me.steps && id !== me.space && this.game_.state.board.areas[space.area]?.city) {
        const path = strollPath(this.game_.state, me.space, id);
        if (path) {
          this.setBusy(true);
          this.send({ type: 'stroll', player: this.game_.player, to: id }, (moved) => this.went(path, moved, true));
          return;
        }
      }
      if (!this.busy && id === me.space && space.kind === 'door') {
        this.offerDoor();
        return;
      }
      if (!this.busy && id === me.space && space.kind === 'arena') {
        this.offerGate();
        return;
      }
      // Your own spot, free: the hint, and the notes you could leave as chips.
      if (!this.busy && id === me.space) {
        this.flashHint(id);
        this.setMessage(`${hintFor(this.game_.state, id, this.game_.player, this.game_.now())} Leave a note here?`);
        this.hud?.setChips(TRACES.map((text) => ({ text, onTap: () => this.leaveNote(text) })));
        return;
      }
      this.flashHint(id);
      // A boss in open land: fight it now, from anywhere (Robin, 2026-11-02).
      if (space.kind === 'boss' && space.boss && bossKnown(me, space.id) && !this.game_.state.board.areas[space.area]?.dungeon && !this.busy && !me.steps && !me.fight && me.opened.includes(space.area)) {
        const away = (me.cooldowns[id] ?? 0) > this.game_.now();
        const foe = creature(space.boss, this.game_.state.board.bestiary);
        if (!away) {
          this.ask({
            icon: 'mark_alert',
            color: 0xd9534f,
            title: foe?.name ?? 'The boss',
            text: `Level ${foe?.level ?? '?'}. Go there and fight it now?`,
            options: [
              { label: 'Challenge', color: 0xd9534f, onTap: () => this.answerChallenge(id) },
              { label: 'Not yet', color: COLORS.log, onTap: () => this.finish('') },
            ],
          });
          return;
        }
      }
      const bossTip = space.kind === 'boss' ? tips.take('boss') : null;
      const here = Object.values(this.game_.state.characters).filter((c) => c.id !== me.id && c.space === id).map((c) => c.name);
      const who = here.length ? ` ${here.join(' and ')} ${here.length > 1 ? 'are' : 'is'} here.` : '';
      this.setMessage(`${hintFor(this.game_.state, id, this.game_.player, this.game_.now())}${who}${bossTip ? ` ${bossTip}` : ''}`);
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

  /** A word or two for what a spot holds: only what you need to choose. */
  private spotWord(space: Space): string {
    const { board, spawns } = this.game_.state;
    const me = this.game_.me;
    const spawn = spawns[space.id];
    const name = (id: string | null | undefined) => (id ? (creature(id, board.bestiary)?.name ?? id) : '');
    if (me.rumours?.some((r) => r.space === space.id)) return 'Rumour!';
    if (spawn?.kind === 'wanderer') return `Lv ${spawn.level ?? '?'} Dread ${name(spawn.enemy)}`;
    if (spawn?.kind === 'elite') return `Elite ${name(spawn.enemy)}`;
    if (spawn?.kind === 'miniboss' || spawn?.kind === 'worldboss') return name(spawn.enemy);
    if (spawn?.kind === 'merchant') return 'Merchant';
    if ((me.cooldowns[space.id] ?? 0) > this.game_.now()) return 'Empty';
    switch (space.kind) {
      case 'normal':
        if (inTownWalls(board, space)) return 'Street';
        return name(groundAt(board, space)?.mob) || 'Wilds';
      case 'door':
        return space.name || 'Door';
      case 'arena':
        return arenaOpen(me, this.game_.now()) ? 'The Arena: open!' : 'The Arena: closed';
      case 'town':
        return `${space.name || 'Town'}: ${townKind(space.id).name}`;
      case 'boss':
        return name(space.boss);
      case 'potion':
        return 'Potion roll';
      case 'gear':
        return 'Loot roll';
      case 'spell':
        return 'Shrine: mana';
      case 'church':
        return 'Church: heal';
      case 'board':
        return 'Quests';
      default:
        return SPACE_KIND_DATA[space.kind].label;
    }
  }

  private clearChoices(): void {
    for (const label of this.reachLabels) label.destroy();
    this.reachLabels = [];
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
    this.send({ type: 'move', player: this.game_.player, path }, (moved) => this.went(path, moved));
  }

  /** The move was taken: walk the token, then what the landing brought. */
  private went(path: string[], moved: GameEvent[], strolled = false): void {
    const landed = moved.find((e) => e.type === 'landed');
    if (!landed || landed.type !== 'landed') {
      this.finish(this.describe(moved));
      return;
    }
    const value = this.game_.state.die.last;
    const rolled = strolled ? '' : `Rolled ${value}. `;
    this.follow(false);
    // The rules may have stopped the walk at the quest board: walk what they walked.
    const walked = moved.find((e) => e.type === 'moved');
    this.walk(walked?.type === 'moved' ? walked.path : path, () => {
      const space = this.game_.state.board.spaces[landed.space]!;
      const kind = SPACE_KIND_DATA[space.kind].label.toLowerCase();
      const place = placeName(this.game_.state.board, space);
      const where = space.name ? `on ${space.name} (${kind})` : place ? `in ${place}` : space.kind === 'normal' ? 'on the road' : `on a ${kind}`;
      const notes = traceLine(this.game_.state, landed.space, this.game_.now());
      const story = `${this.describeLanding(moved)}${notes ? ` ${notes}` : ''}`.trim();
      this.log.note(`landed on ${space.id} (${space.kind}): ${story || 'nothing'}`);
      sfx.play(`ui/arrive-${{ board: 'board', gear: 'chest', town: 'town', shop: 'shop', potion: 'spring', spell: 'shrine', church: 'church', arena: 'town', door: 'town', chest: 'chest', boss: 'boss', normal: 'wild' }[space.kind] ?? 'wild'}`);
      for (const e of moved) {
        if (e.type === 'gold') sfx.play(e.delta >= 20 ? 'ui/gold-gain' : e.delta > 0 ? 'ui/gold-small' : 'ui/gold-lost');
        else if (e.type === 'rested') sfx.play('ui/spring-fill');
        else if (e.type === 'learned') sfx.play('ui/shrine-teach');
        else if (e.type === 'empty') sfx.play('ui/spot-empty');
      }
      const after = () => {
        const me = this.game_.me;
        if (me.fight) {
          this.openFight();
          return;
        }
        if (me.offer) {
          this.setMessage(`${rolled}Landed ${where}. ${story}`.trimEnd());
          this.offerChoice();
          return;
        }
        if (space.kind === 'door') {
          this.refreshHud();
          this.offerDoor();
          return;
        }
        if (space.kind === 'arena') {
          this.setMessage(`${rolled}Landed ${where}.`);
          this.refreshHud();
          this.offerGate();
          return;
        }
        if (space.kind === 'shop' || space.kind === 'town' || moved.some((e) => e.type === 'merchant')) {
          this.setMessage(`${rolled}Landed ${where}. ${story}`.trimEnd());
          this.refreshHud();
          this.openShop(moved.some((e) => e.type === 'merchant'));
          return;
        }
        this.finish(`${rolled}Landed ${where}. ${story}`.trimEnd());
      };
      this.drawRumours();
      this.drawSecrets();
      this.lastCull.count = -1;
      this.showMoments(moved);
      const chest = moved.some((e) => e.type === 'chest');
      if (!chest) this.showFinds(moved);
      this.reveal(prizesIn(moved), chest ? (space.kind === 'chest' ? 'A chest!' : 'A chest in the wilds!') : `Found ${space.name ? `at ${space.name}` : 'here'}`, after);
    });
  }

  private walk(path: string[], done: () => void): void {
    const spaces = this.game_.state.board.spaces;
    this.walking = true;
    this.setMessage('On the road…');
    this.hero?.play('move');
    let from = { x: this.token.x, y: this.token.y };
    this.tweens.chain({
      targets: this.token,
      tweens: path.map((id) => {
        const s = spaces[id]!;
        const to = { x: s.x, y: s.y - SPACE_RADIUS - 6 };
        const faceRight = to.x >= from.x;
        from = to;
        return {
          x: to.x,
          y: to.y,
          duration: STEP_MS,
          ease: 'Sine.easeInOut',
          onStart: () => {
            this.hero?.face(faceRight);
            sfx.play(stepSound(this.game_.state.board.areas[this.game_.state.board.spaces[this.game_.me.space]?.area ?? '']?.theme));
          },
        };
      }),
      onComplete: () => {
        this.walking = false;
        this.hero?.play('stand');
        done();
      },
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
    // Another question still owed (a second pick, an offer behind it) asks now; left alone, Roll would only be refused.
    const me = this.game_.me;
    if (!me.fight && me.offer) this.offerChoice();
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.hud?.setBusy(busy);
  }

  /** The HUD's lines: level, HP, mana, gold; the area and the spot. The fight, shop and bag scenes call it too. */
  refreshHud(): void {
    this.hero?.wear(this.game_.me);
    const me = this.game_.me;
    const s = stats(me);
    const space = this.game_.state.board.spaces[me.space];
    const area = space ? this.game_.state.board.areas[space.area] : undefined;
    const where = space ? space.name || placeName(this.game_.state.board, space) || (space.kind === 'normal' ? 'The road' : SPACE_KIND_DATA[space.kind].label) : me.space;
    const withOthers = Object.values(this.game_.state.characters).filter((c) => c.id !== me.id && c.space === me.space).map((c) => c.name);
    if (area) audio.music(`music/${area.theme === 'meadow' ? 'meadows' : area.theme}-board`);
    // A new area: what was only for the last one leaves memory (chapter 2, step 1). A fight loads its own.
    if (area && area.id !== this.artArea && !this.scene.isActive('fight')) {
      this.artArea = area.id;
      if (area.theme === 'forest' || area.theme === 'pirates' || area.theme === 'giants' || area.theme === 'crown') audio.ensure(this, `creatures-${area.theme}`);
      releaseCreatures(this.game, [...area.mobs, ...area.miniBosses, ...Object.values(this.game_.state.board.spaces).filter((s) => s.area === area.id && s.boss).map((s) => s.boss!)]);
      releaseBackdrops(this.game, area.theme);
    }
    const carried = [me.ailments?.poison ? 'poisoned' : '', me.ailments?.weak ? 'weakened' : '', me.elixirs?.vigor ? `vigor ${me.elixirs.vigor.fights}` : '', me.elixirs?.arcana ? `arcana ${me.elixirs.arcana.fights}` : ''].filter(Boolean).join(', ');
    this.hud?.setStats({ level: me.level, hp: me.hp, maxHp: s.maxHp, mana: me.mana, maxMana: s.maxMana, gold: me.gold }, `${carried || (area?.name ?? '')} · ${where}${withOthers.length ? ` · with ${withOthers.join(', ')}` : ''}`);
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
        case 'cured':
          parts.push(`Cured of ${e.ailments.join(' and ')}.`);
          break;
        case 'rumour':
          parts.push('You hear a rumour: see the ? on your map.');
          break;
        case 'rumourDone':
          parts.push('The rumour was true!');
          break;
        case 'secretFound':
          parts.push('You spot a hidden path.');
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
        case 'journal':
          parts.push(e.text);
          break;
        case 'skillPoints':
          parts.push(e.gained === 1 ? 'A skill point: Hero, then Skills.' : `${e.gained} skill points: Hero, then Skills.`);
          break;
        case 'questProgress':
          parts.push(`Quest: ${e.quest.done} of ${e.quest.count}.`);
          break;
        case 'personFound':
          parts.push(`You found ${e.person}!`);
          break;
        case 'questDone':
          parts.push(`Quest complete: ${e.quest.text}`);
          break;
        case 'bagFull':
          parts.push(e.sold !== null ? `No room in the bag: ${e.gear.name} sold for ${e.sold} gold.` : '');
          break;
        case 'locked':
          parts.push(`Locked. ${e.mini ? `The ${creature(e.mini, this.game_.state.board.bestiary)?.name ?? 'mini-boss'} prowling these wilds carries the key.` : ''}`.trim());
          break;
        case 'keyFound':
          parts.push(`It carried a key: the vault of ${this.game_.state.board.areas[e.area]?.name ?? e.area} opens to you.`);
          break;
        case 'themeEvent':
          parts.push(e.text);
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
