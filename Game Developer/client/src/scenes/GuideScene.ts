// The guide (Robin, 2026-11-01: "its a bit hard to tell what skills etc do in combat. I think there needs to be some sort
// of guide in the menu on what things do and how battle works."). Opened from the World sheet and from the ? in a fight;
// it lies over everything and takes every touch until Close. The numbers are read from the rules' data, so a retune
// shows here by itself.

import Phaser from 'phaser';
import { ABILITIES, CLASS_DATA, ITEMS, PROGRESSION, SPACE_KIND_DATA, SPACE_KINDS } from '../../../rules/src/index.ts';
import type { GameHolder } from '../game-holder.ts';
import { sfx } from '../feel.ts';
import { INK, INK_DIM, kitReady, plate } from '../kit.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT } from '../layout.ts';
import { makeButton } from '../ui.ts';

export interface GuideSceneDeps {
  game: GameHolder;
}

interface Entry {
  title: string;
  text: string;
  /** Written dim: an ability not known yet. */
  dim?: boolean;
}
interface Page {
  name: string;
  entries: Entry[];
}

const CENTRE = DESIGN_WIDTH / 2;
const pct = (share: number): string => `${Math.round(share * 100)}%`;

export class GuideScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private page = 0;
  private start = 0;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private tabs: { label: Phaser.GameObjects.Text; index: number }[] = [];

  constructor(deps: GuideSceneDeps) {
    super('guide');
    this.game_ = deps.game;
  }

  /** `page` opens on a named page: the fight's ? opens on the fight. */
  init(data: { page?: number }): void {
    this.start = data?.page ?? 0;
  }

  create(): void {
    const top = HUD_HEIGHT + 4;
    const bottom = DESIGN_HEIGHT - 6;
    this.add.rectangle(CENTRE, (HUD_HEIGHT + DESIGN_HEIGHT) / 2, DESIGN_WIDTH, DESIGN_HEIGHT - HUD_HEIGHT, 0x0b0d14, 0.6).setInteractive();
    if (kitReady(this)) plate(this, 'panel_sheet', CENTRE, (top + bottom) / 2, DESIGN_WIDTH - 16, bottom - top);
    const ink = kitReady(this) ? INK : COLORS.text;
    this.add.text(26, top + 14, 'Guide', { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: ink });
    makeButton(this, 358, top + 30, 80, 44, 'Close', COLORS.log, '16px', () => this.close());

    const pages = this.pages();
    const w = (DESIGN_WIDTH - 44) / pages.length;
    this.tabs = [];
    pages.forEach((p, i) => {
      const { label } = makeButton(this, 22 + w * (i + 0.5), top + 82, w - 4, 44, p.name, COLORS.log, '13px', () => {
        this.page = i;
        this.showPage();
      });
      this.tabs.push({ label, index: i });
    });
    this.page = Math.min(this.start, pages.length - 1);
    this.showPage();
  }

  private close(): void {
    sfx.play('ui/sheet-close');
    this.scene.stop();
  }

  private showPage(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const ink = kitReady(this) ? INK : COLORS.text;
    const dim = kitReady(this) ? INK_DIM : COLORS.dim;
    for (const t of this.tabs) t.label.setColor(t.index === this.page ? '#ffe9a8' : '#f7efdc');
    let y = HUD_HEIGHT + 118;
    for (const e of this.pages()[this.page]!.entries) {
      const title = this.add.text(28, y, e.title, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: e.dim ? dim : ink });
      const text = this.add.text(28, y + 20, e.text, { fontFamily: FONT, fontSize: '14px', color: dim, wordWrap: { width: DESIGN_WIDTH - 56 }, lineSpacing: 1 });
      this.rows.push(title, text);
      y += 20 + text.height + 10;
    }
  }

  private pages(): Page[] {
    const me = this.game_.me;
    const cls = CLASS_DATA[me.classId];
    const g = PROGRESSION.guards;
    const meter = cls.meter;
    const mine = Object.entries(ABILITIES).filter(([, a]) => a.classId === me.classId);
    const known = mine.filter(([id]) => me.abilities[id]);
    const others = mine.filter(([id]) => !me.abilities[id]);
    const line = (id: string): Entry => {
      const a = ABILITIES[id]!;
      const rank = me.abilities[id];
      const cost = [a.mana ? `${a.mana} mana` : '', a.meter && meter ? `${a.meter} ${meter.name}` : '', a.oncePerFight ? 'once a fight' : ''].filter(Boolean).join(', ');
      return { title: `${a.name}${rank ? ` · rank ${rank}` : ''}`, text: `${a.text}${cost ? ` Costs ${cost}.` : ''}`, dim: !rank };
    };
    return [
      {
        name: 'Fights',
        entries: [
          { title: 'A round is two taps', text: 'First what you do, then how you take the blow that comes back. Then both happen.' },
          { title: 'The orange line', text: 'Over the enemy, it says what it does next. Pick your guard for that. When it winds up, the next blow lands hard: block it.' },
          { title: 'Attack', text: 'A plain hit. It costs nothing, and you get some mana back every round.' },
          { title: 'Charge', text: `Spend the round gathering power: your next hit lands ${PROGRESSION.charge} times as hard.` },
          { title: 'Abilities', text: 'Your special moves. They cost mana, and some cost your meter. The Abilities page says what each does.' },
          { title: 'Flee', text: `A ${pct(PROGRESSION.fleeChance)} chance to get away. If you fail, the enemy still gets its blow.` },
          { title: 'Falling', text: `You wake in the nearest town with full HP and mana, a ${pct(PROGRESSION.deathGoldLoss)} share of your gold gone, your gear kept.` },
        ],
      },
      {
        name: 'Guards',
        entries: [
          { title: 'Block', text: `Takes ${pct(g.block)} of the blow. The safe choice.` },
          { title: 'Dodge', text: `A ${pct(g.dodge)} chance that it misses altogether; if not, you take it all.` },
          { title: 'Brace', text: `Takes ${pct(g.brace)} of the blow and gives you ${g.braceMana} mana.` },
          { title: 'Counter', text: `Hit back for ${pct(g.counter)} of a plain hit, and take the blow in full.` },
          ...(meter ? [{ title: meter.name, text: `Your meter, the dots over your bars. ${meter.text}` }] : []),
        ],
      },
      { name: 'Abilities', entries: [...known.map(([id]) => line(id)), ...others.map(([id]) => line(id)), { title: 'Learning more', text: 'A trainer in a town teaches and raises them for gold. A shrine teaches for free, now and then. A level sometimes offers a pick of two.' }] },
      {
        name: 'Effects',
        entries: [
          { title: 'Poison', text: 'Stings at the end of each round. It stays after the fight and stings on each roll, until it wears off or a church cures it. It never kills on the road.' },
          { title: 'Weakened', text: 'Your hits land softer. What is left of it carries into your next fight, unless a church cures it.' },
          { title: 'Stunned', text: 'The enemy loses its turn. Mini-bosses and bosses shrug it off.' },
          { title: 'Hardened, fading', text: 'A hardened enemy takes less from your hits; a fading one makes your next hit miss.' },
          { title: 'Barrier', text: 'Takes the damage before your HP does.' },
          { title: ITEMS.potion!.name, text: `${ITEMS.potion!.text} You can also drink it from Hero.` },
          { title: ITEMS['mana-potion']!.name, text: `${ITEMS['mana-potion']!.text} You can also drink it from Hero.` },
        ],
      },
      {
        name: 'Map',
        entries: [
          ...SPACE_KINDS.filter((k) => k !== 'normal').map((k) => ({ title: SPACE_KIND_DATA[k].label, text: SPACE_KIND_DATA[k].hint })),
          { title: 'Wilds', text: SPACE_KIND_DATA.normal.hint },
          { title: 'Looking around', text: 'Drag the map with a finger, pinch to zoom, or tap twice to zoom all the way out and in. Tap any spot to hear about it. Map shows it all; Back returns to you.' },
        ],
      },
    ];
  }
}
