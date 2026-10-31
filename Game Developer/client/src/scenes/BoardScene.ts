// The board at phone size: spaces and connections as shapes, the character as a token, a Roll button.
// After a roll, every space the roll can end on lights up and the player taps one. No art yet: shapes and labels
// (the Art Director's sprites come later). Everything here is drawing and input; what happens is decided by the
// rules through LocalGame.

import Phaser from 'phaser';
import { CLASS_DATA, reachable, SPACE_KIND_DATA, type GameEvent, type Space, type SpaceKind } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';

export interface BoardSceneDeps {
  game: LocalGame;
  log: GameLog;
}

const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';
const SPACE_RADIUS = 26;
const TAP_RADIUS = 38; // thumbs are wide: the tap area is bigger than the circle
const RING_RADIUS = 34;
const TOKEN_RADIUS = 15;
const STEP_MS = 260;
const LIT = 0xfff27a;

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

export class BoardScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private readonly rings = new Map<string, Phaser.GameObjects.Arc>();
  private token!: Phaser.GameObjects.Container;
  private hudStats!: Phaser.GameObjects.Text;
  private dieText!: Phaser.GameObjects.Text;
  private dieBox!: Phaser.GameObjects.Container;
  private message!: Phaser.GameObjects.Text;
  private rollButton!: Phaser.GameObjects.Container;
  /** Where the pending roll can end, by landing space, while the player is choosing; null otherwise. */
  private choices: Map<string, string[]> | null = null;
  private busy = false;

  constructor(deps: BoardSceneDeps) {
    super('board');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    const { board } = this.game_.state;
    this.drawLinks(board.spaces);
    for (const space of Object.values(board.spaces)) this.drawSpace(space);
    this.drawHud();
    this.drawToken();
    this.drawControls();
    this.refreshHud();
    this.log.note('board scene ready');

    const me = this.game_.me;
    if (me.steps > 0) {
      // The page was closed mid-choice: the roll is still owed, so offer the same choice again.
      this.dieText.setText(String(this.game_.state.die.last ?? me.steps));
      this.setBusy(true);
      this.offerChoices();
    } else {
      this.setMessage(`Tap Roll to move ${me.name}.`);
    }
  }

  override update(_time: number, delta: number): void {
    this.log.frame(delta);
  }

  // ---- drawing -------------------------------------------------------------------------------------------------

  private drawLinks(spaces: Record<string, Space>): void {
    const g = this.add.graphics();
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
    circle.on('pointerdown', () => this.onSpaceTap(space.id));

    const label = SPACE_KIND_DATA[space.kind].label;
    this.add
      .text(space.x, space.y, label.charAt(0), { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#101318' })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(space.x, space.y + SPACE_RADIUS + 4, space.name, {
        fontFamily: FONT,
        fontSize: '12px',
        color: COLORS.text,
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(6);
  }

  private drawToken(): void {
    const me = this.game_.me;
    const space = this.game_.state.board.spaces[me.space]!;
    const body = this.add.circle(0, 0, TOKEN_RADIUS, CLASS_COLORS[me.classId] ?? 0xffffff, 1);
    body.setStrokeStyle(3, 0x101318, 1);
    const letter = this.add
      .text(0, 0, CLASS_DATA[me.classId].name.charAt(0), { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#101318' })
      .setOrigin(0.5);
    this.token = this.add.container(space.x, space.y - SPACE_RADIUS - 6, [body, letter]).setDepth(10);
  }

  private drawHud(): void {
    this.add.rectangle(DESIGN_WIDTH / 2, 45, DESIGN_WIDTH, 90, COLORS.panel, 1);
    const me = this.game_.me;
    this.add.text(16, 20, `${me.name} the ${CLASS_DATA[me.classId].name}`, {
      fontFamily: FONT,
      fontSize: '19px',
      fontStyle: 'bold',
      color: COLORS.text,
    });
    this.hudStats = this.add.text(16, 50, '', { fontFamily: FONT, fontSize: '15px', color: COLORS.dim });

    const box = this.add.graphics();
    box.fillStyle(0xe8e4d8, 1);
    box.fillRoundedRect(-28, -28, 56, 56, 10);
    this.dieText = this.add
      .text(0, 0, '–', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#101318' })
      .setOrigin(0.5);
    this.dieBox = this.add.container(DESIGN_WIDTH - 48, 45, [box, this.dieText]);
  }

  private drawControls(): void {
    this.message = this.add
      .text(DESIGN_WIDTH / 2, 795, '', {
        fontFamily: FONT,
        fontSize: '16px',
        color: COLORS.text,
        align: 'center',
        wordWrap: { width: DESIGN_WIDTH - 40 },
      })
      .setOrigin(0.5, 0);

    this.rollButton = this.makeButton(DESIGN_WIDTH / 2 - 30, 862, 220, 66, 'Roll', COLORS.button, '26px', () => this.onRoll());
    this.makeButton(DESIGN_WIDTH - 56, 862, 80, 50, 'Log', COLORS.log, '17px', () => this.onDownloadLog());

    this.add
      .text(12, DESIGN_HEIGHT - 8, `skeleton 0.1.0 · seed ${this.game_.state.seed.slice(0, 8)}`, {
        fontFamily: FONT,
        fontSize: '11px',
        color: COLORS.dim,
      })
      .setOrigin(0, 1)
      .setAlpha(0.7);
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    fontSize: string,
    onTap: () => void,
  ): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    const text = this.add
      .text(0, 0, label, { fontFamily: FONT, fontSize, fontStyle: 'bold', color: color === COLORS.button ? COLORS.buttonText : COLORS.text })
      .setOrigin(0.5);
    const button = this.add.container(x, y, [g, text]).setSize(w, h);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.tweens.add({ targets: button, scaleX: 0.95, scaleY: 0.95, duration: 70, yoyo: true });
      onTap();
    });
    return button;
  }

  // ---- play ----------------------------------------------------------------------------------------------------

  private onRoll(): void {
    if (this.busy) {
      if (this.choices) this.setMessage('Tap a lit space first.');
      return;
    }
    this.setBusy(true);

    const rolled = this.game_.act({ type: 'roll', player: this.game_.player });
    const roll = rolled.find((e) => e.type === 'rolled');
    if (!roll || roll.type !== 'rolled') {
      this.finish(this.describe(rolled));
      return;
    }
    this.dieText.setText(String(roll.value));
    this.tweens.add({ targets: this.dieBox, scaleX: 1.25, scaleY: 1.25, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    this.log.note(`rolled ${roll.value}`);
    this.offerChoices();
  }

  /** Light up every space the owed roll can end on. One place to go: walk at once. More: wait for a tap. */
  private offerChoices(): void {
    const me = this.game_.me;
    const value = this.game_.state.die.last ?? me.steps;
    const options = reachable(this.game_.state.board, me.space, me.steps);
    if (options.length === 0) {
      this.finish(`No way to walk ${me.steps} from here.`);
      return;
    }
    if (options.length === 1) {
      this.setMessage(`Rolled ${value}.`);
      this.go(options[0]!.path);
      return;
    }
    this.choices = new Map(options.map((o) => [o.space, o.path]));
    const rings: Phaser.GameObjects.Arc[] = [];
    for (const o of options) {
      const ring = this.rings.get(o.space);
      if (ring) rings.push(ring.setVisible(true).setAlpha(1));
    }
    this.tweens.add({ targets: rings, alpha: 0.25, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.setMessage(`Rolled ${value}. Tap a lit space to walk there.`);
  }

  private onSpaceTap(id: string): void {
    if (!this.choices) return;
    const path = this.choices.get(id);
    if (!path) {
      this.setMessage(`Not ${this.game_.me.steps} steps away. Tap a lit space.`);
      return;
    }
    this.clearChoices();
    this.log.note(`chose ${id}`);
    this.go(path);
  }

  private clearChoices(): void {
    if (!this.choices) return;
    for (const id of this.choices.keys()) {
      const ring = this.rings.get(id);
      if (ring) {
        this.tweens.killTweensOf(ring);
        ring.setVisible(false).setAlpha(1);
      }
    }
    this.choices = null;
  }

  /** Send the move and walk the token along it. */
  private go(path: string[]): void {
    const moved = this.game_.act({ type: 'move', player: this.game_.player, path });
    const landed = moved.find((e) => e.type === 'landed');
    if (!landed || landed.type !== 'landed') {
      this.finish(this.describe(moved));
      return;
    }
    const value = this.game_.state.die.last;
    this.walk(path, () => {
      const space = this.game_.state.board.spaces[landed.space]!;
      this.finish(`Rolled ${value}. Landed on ${space.name} (${SPACE_KIND_DATA[space.kind].label.toLowerCase()}).`);
      this.log.note(`landed on ${space.id} ${space.name} (${space.kind})`);
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

  private finish(message: string): void {
    this.setMessage(message);
    this.refreshHud();
    this.setBusy(false);
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.rollButton.setAlpha(busy ? 0.5 : 1);
  }

  private onDownloadLog(): void {
    this.log.note('log downloaded');
    try {
      this.log.download();
    } catch (e) {
      this.log.error(`download failed: ${String(e)}`);
      this.setMessage('Could not download the log.');
    }
  }

  private refreshHud(): void {
    const me = this.game_.me;
    this.hudStats.setText(`HP ${me.hp}/${me.maxHp}   Gold ${me.gold}   Space ${this.game_.state.board.spaces[me.space]?.name ?? me.space}`);
  }

  private setMessage(text: string): void {
    this.message.setText(text);
  }

  private describe(events: GameEvent[]): string {
    const rejected = events.find((e) => e.type === 'rejected');
    if (rejected && rejected.type === 'rejected') return `Not allowed: ${rejected.reason}.`;
    return events.map((e) => e.type).join(', ') || 'Nothing happened.';
  }
}
