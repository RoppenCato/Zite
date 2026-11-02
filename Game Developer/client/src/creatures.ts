// The creatures on screen (chapter 1, step 4): the Art Director's atlases by enemy id, in the hero's form (`clips.ts`),
// and one small class that plays a figure's clips. A creature with no art yet is drawn as a circle by the fight scene.
// Files face left, toward the player; the enemy stands at the right, so it is not flipped.

import Phaser from 'phaser';
import banditData from '../../assets/bandit/bandit.json';
import banditJson from '../../assets/bandit/bandit.json?url';
import banditPng from '../../assets/bandit/bandit.png';
import beeData from '../../assets/bee/bee.json';
import beeJson from '../../assets/bee/bee.json?url';
import beePng from '../../assets/bee/bee.png';
import gooData from '../../assets/goo/goo.json';
import gooJson from '../../assets/goo/goo.json?url';
import gooPng from '../../assets/goo/goo.png';
import goo2Data from '../../assets/goo2/goo2.json';
import goo2Json from '../../assets/goo2/goo2.json?url';
import goo2Png from '../../assets/goo2/goo2.png';
import muncherData from '../../assets/muncher/muncher.json';
import muncherJson from '../../assets/muncher/muncher.json?url';
import muncherPng from '../../assets/muncher/muncher.png';
import slimeData from '../../assets/slime/slime.json';
import slimeJson from '../../assets/slime/slime.json?url';
import slimePng from '../../assets/slime/slime.png';
import sproutData from '../../assets/sprout/sprout.json';
import sproutJson from '../../assets/sprout/sprout.json?url';
import sproutPng from '../../assets/sprout/sprout.png';
import twiglingData from '../../assets/forest/twigling/twigling.json';
import twiglingJson from '../../assets/forest/twigling/twigling.json?url';
import twiglingPng from '../../assets/forest/twigling/twigling.png';
import mossGoblinData from '../../assets/forest/moss_goblin/moss_goblin.json';
import mossGoblinJson from '../../assets/forest/moss_goblin/moss_goblin.json?url';
import mossGoblinPng from '../../assets/forest/moss_goblin/moss_goblin.png';
import sporelingData from '../../assets/forest/sporeling/sporeling.json';
import sporelingJson from '../../assets/forest/sporeling/sporeling.json?url';
import sporelingPng from '../../assets/forest/sporeling/sporeling.png';
import nutkinData from '../../assets/forest/nutkin/nutkin.json';
import nutkinJson from '../../assets/forest/nutkin/nutkin.json?url';
import nutkinPng from '../../assets/forest/nutkin/nutkin.png';
import owlbearData from '../../assets/forest/owlbear/owlbear.json';
import owlbearJson from '../../assets/forest/owlbear/owlbear.json?url';
import owlbearPng from '../../assets/forest/owlbear/owlbear.png';
import grumblebarkData from '../../assets/forest/grumblebark/grumblebark.json';
import grumblebarkJson from '../../assets/forest/grumblebark/grumblebark.json?url';
import grumblebarkPng from '../../assets/forest/grumblebark/grumblebark.png';
import grumblebark2Data from '../../assets/forest/grumblebark2/grumblebark2.json';
import grumblebark2Json from '../../assets/forest/grumblebark2/grumblebark2.json?url';
import grumblebark2Png from '../../assets/forest/grumblebark2/grumblebark2.png';
import honeyBlobData from '../../assets/harvest/honey_blob/honey_blob.json';
import honeyBlobJson from '../../assets/harvest/honey_blob/honey_blob.json?url';
import honeyBlobPng from '../../assets/harvest/honey_blob/honey_blob.png';
import cornGoblinData from '../../assets/harvest/corn_goblin/corn_goblin.json';
import cornGoblinJson from '../../assets/harvest/corn_goblin/corn_goblin.json?url';
import cornGoblinPng from '../../assets/harvest/corn_goblin/corn_goblin.png';
import buzzbugData from '../../assets/harvest/buzzbug/buzzbug.json';
import buzzbugJson from '../../assets/harvest/buzzbug/buzzbug.json?url';
import buzzbugPng from '../../assets/harvest/buzzbug/buzzbug.png';
import appleMimicData from '../../assets/harvest/apple_mimic/apple_mimic.json';
import appleMimicJson from '../../assets/harvest/apple_mimic/apple_mimic.json?url';
import appleMimicPng from '../../assets/harvest/apple_mimic/apple_mimic.png';
import scarecrowData from '../../assets/harvest/scarecrow/scarecrow.json';
import scarecrowJson from '../../assets/harvest/scarecrow/scarecrow.json?url';
import scarecrowPng from '../../assets/harvest/scarecrow/scarecrow.png';
import queenBumbleData from '../../assets/harvest/queen_bumble/queen_bumble.json';
import queenBumbleJson from '../../assets/harvest/queen_bumble/queen_bumble.json?url';
import queenBumblePng from '../../assets/harvest/queen_bumble/queen_bumble.png';
import queenBumble2Data from '../../assets/harvest/queen_bumble2/queen_bumble2.json';
import queenBumble2Json from '../../assets/harvest/queen_bumble2/queen_bumble2.json?url';
import queenBumble2Png from '../../assets/harvest/queen_bumble2/queen_bumble2.png';
import { clipMs, ensureClips, msBefore, type ActionData } from './clips.ts';

export type FigureAction = 'stand' | 'move' | 'attack1' | 'hit1' | 'die1' | 'defend';

interface Atlas {
  key: string;
  png: string;
  json: string;
  actions: Record<string, ActionData>;
}

interface CreatureFiles extends Atlas {
  /** The files are 2x: 0.5 draws the creature at the Art Director's CSS size; the big ones are drawn at fewer pixels (0.8, 1). */
  scale: number;
  /** The frame of `attack1` on which the blow lands (1-based), from the NOTES. */
  blowFrame: number;
  /** A second atlas for the creature's second phase (King Goo under half HP): the clips it holds replace the first's. */
  phase2?: Atlas;
  /** True for a creature drawn in the air: its shadow is smaller. */
  hovers?: boolean;
}

const actionsOf = (data: unknown): Record<string, ActionData> => (data as { actions: Record<string, ActionData> }).actions;

/** By enemy id (`rules/data/enemies.json`). */
const CREATURES: Record<string, CreatureFiles> = {
  slime: { key: 'slime', png: slimePng, json: slimeJson, actions: actionsOf(slimeData), scale: 0.5, blowFrame: 7 },
  wolf: { key: 'sprout', png: sproutPng, json: sproutJson, actions: actionsOf(sproutData), scale: 0.5, blowFrame: 7 },
  bandit: { key: 'bandit', png: banditPng, json: banditJson, actions: actionsOf(banditData), scale: 0.5, blowFrame: 4 },
  wisp: { key: 'bee', png: beePng, json: beeJson, actions: actionsOf(beeData), scale: 0.5333, blowFrame: 7, hovers: true },
  'wolf-alpha': { key: 'muncher', png: muncherPng, json: muncherJson, actions: actionsOf(muncherData), scale: 0.7273, blowFrame: 5 },
  'thornwood-warden': {
    key: 'goo',
    png: gooPng,
    json: gooJson,
    actions: actionsOf(gooData),
    // A touch under the file's size, so there is room between him and the Knight (Robin, 2026-11-01: "you are almost hugging it").
    scale: 0.9,
    blowFrame: 5,
    phase2: { key: 'goo2', png: goo2Png, json: goo2Json, actions: actionsOf(goo2Data) },
  },
  // Wobblewood (Mitch, AD, 2026-11-01): the rules' ids are the first names.
  'spider': { key: 'twigling', png: twiglingPng, json: twiglingJson, actions: actionsOf(twiglingData), scale: 0.5, blowFrame: 7 },
  'treant': { key: 'moss_goblin', png: mossGoblinPng, json: mossGoblinJson, actions: actionsOf(mossGoblinData), scale: 0.5, blowFrame: 4 },
  'outlaw': { key: 'sporeling', png: sporelingPng, json: sporelingJson, actions: actionsOf(sporelingData), scale: 0.5, blowFrame: 7 },
  'wraith': { key: 'nutkin', png: nutkinPng, json: nutkinJson, actions: actionsOf(nutkinData), scale: 0.5, blowFrame: 7 },
  'spider-queen': { key: 'owlbear', png: owlbearPng, json: owlbearJson, actions: actionsOf(owlbearData), scale: 0.7273, blowFrame: 5 },
  'briar-king': {
    key: 'grumblebark',
    png: grumblebarkPng,
    json: grumblebarkJson,
    actions: actionsOf(grumblebarkData),
    // Under the file's 1.1429, as with King Goo, so his body stops short of the hero (Robin, 2026-11-01: "you are almost hugging it").
    scale: 0.92,
    blowFrame: 5,
    phase2: { key: 'grumblebark2', png: grumblebark2Png, json: grumblebark2Json, actions: actionsOf(grumblebark2Data) },
  },
  // Honeyhill Fields (Mitch, AD, 2026-11-02): the rules' ids are the first names.
  'ice-wolf': { key: 'honey_blob', png: honeyBlobPng, json: honeyBlobJson, actions: actionsOf(honeyBlobData), scale: 0.6154, blowFrame: 7 },
  'yeti': { key: 'corn_goblin', png: cornGoblinPng, json: cornGoblinJson, actions: actionsOf(cornGoblinData), scale: 0.5, blowFrame: 4 },
  'frost-wisp': { key: 'buzzbug', png: buzzbugPng, json: buzzbugJson, actions: actionsOf(buzzbugData), scale: 0.5, blowFrame: 7, hovers: true },
  'ice-golem': { key: 'apple_mimic', png: appleMimicPng, json: appleMimicJson, actions: actionsOf(appleMimicData), scale: 0.5, blowFrame: 7 },
  'yeti-elder': { key: 'scarecrow', png: scarecrowPng, json: scarecrowJson, actions: actionsOf(scarecrowData), scale: 0.7273, blowFrame: 4 },
  'frost-matriarch': {
    key: 'queen_bumble',
    png: queenBumblePng,
    json: queenBumbleJson,
    actions: actionsOf(queenBumbleData),
    // Under the file's 1.3333, so she stays clear of the title and the column's edge, and sharper on a phone (mine).
    scale: 1.05,
    blowFrame: 5,
    hovers: true,
    phase2: { key: 'queen_bumble2', png: queenBumble2Png, json: queenBumble2Json, actions: actionsOf(queenBumble2Data) },
  },
};

/** Queue one creature's atlas; the fight's preload calls it, so only what you meet costs memory (chapter 2, step 1). */
export function preloadCreature(scene: Phaser.Scene, enemyId: string): void {
  const c = CREATURES[enemyId];
  if (!c) return;
  if (!scene.textures.exists(c.key)) scene.load.atlas(c.key, c.png, c.json);
  if (c.phase2 && !scene.textures.exists(c.phase2.key)) scene.load.atlas(c.phase2.key, c.phase2.png, c.phase2.json);
}

/** Let go of every creature's atlas and clips but these: walking into another area frees the last one's. */
export function releaseCreatures(game: Phaser.Game, keep: readonly string[]): void {
  const kept = new Set(keep);
  for (const [id, c] of Object.entries(CREATURES)) {
    if (kept.has(id)) continue;
    for (const atlas of c.phase2 ? [c, c.phase2] : [c]) {
      if (!game.textures.exists(atlas.key)) continue;
      for (const action of Object.keys(atlas.actions)) game.anims.remove(`${atlas.key}/${action}`);
      game.textures.remove(atlas.key);
    }
  }
}

export function creatureReady(scene: Phaser.Scene, enemyId: string): boolean {
  const c = CREATURES[enemyId];
  return !!c && scene.textures.exists(c.key);
}

/** A figure that plays an atlas's clips. The sprite's x, y is where the feet stand. */
export class Figure {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;
  private readonly files: CreatureFiles;
  private fade: Phaser.Tweens.Tween | null = null;
  private phase = 1;
  private current: FigureAction = 'stand';

  constructor(scene: Phaser.Scene, enemyId: string, x: number, y: number) {
    this.scene = scene;
    this.files = CREATURES[enemyId]!;
    ensureClips(scene, this.files.key, this.files.actions);
    if (this.files.phase2) ensureClips(scene, this.files.phase2.key, this.files.phase2.actions);
    const first = this.files.actions.stand?.frames[0]?.name;
    this.sprite = scene.add.sprite(x, y, this.files.key, first).setScale(this.files.scale);
    this.sprite.play(`${this.files.key}/stand`);
  }

  /** Files face left; true turns the figure to face right. */
  face(right: boolean): void {
    this.sprite.setFlipX(right);
  }

  /** The atlas a clip comes from: the second phase's where it has the clip, else the first's. */
  private atlasFor(action: string): Atlas {
    const p2 = this.files.phase2;
    return this.phase === 2 && p2 && p2.actions[action] ? p2 : this.files;
  }

  /** The creature's second phase (a boss under half HP): its angrier clips, where it has them. */
  setPhase(phase: number): void {
    if (phase === this.phase) return;
    this.phase = phase;
    this.play(this.current);
  }

  /** How far into `attack1` the blow lands, in ms: the hit's flash waits for it. */
  blowMs(): number {
    const a = this.atlasFor('attack1').actions.attack1;
    return a ? msBefore(a, this.files.blowFrame) : 0;
  }

  /** The contact shadow under the figure: its width and where its centre sits against the feet (a big body set forward of its pivot). */
  shadow(): { width: number; dx: number } {
    const f = this.files.actions.stand?.frames[0];
    if (!f?.lt || !f.rb) return { width: 96, dx: 0 };
    const width = (f.rb.x - f.lt.x) * this.files.scale * (this.files.hovers ? 0.5 : 0.8);
    return { width, dx: ((f.rb.x + f.lt.x) / 2) * this.files.scale };
  }

  /** The height of the standing figure's top above its feet, in CSS px, for a bar or a marker over it. */
  headHeight(): number {
    const head = this.files.actions.stand?.frames[0]?.head;
    return head ? -head.y * this.files.scale : 60;
  }

  /** Play a clip; a one-shot clip goes back to `stand` when it ends unless `hold` is set. */
  play(action: FigureAction, hold = false): void {
    this.current = action;
    const atlas = this.atlasFor(action);
    const key = `${atlas.key}/${action}`;
    if (!this.scene.anims.exists(key)) return;
    this.fade?.stop();
    this.fade = null;
    this.sprite.setAlpha(1);
    this.sprite.off('animationcomplete');
    this.sprite.play(key, false);
    if (action === 'die1') {
      // The last frames fade (a0, a1 in the actions block): a tween over their time; the figure stays down.
      const a = this.files.actions.die1;
      const frames = a?.frames ?? [];
      const fading = frames.filter((f) => f.a1 !== undefined && f.a1 < (f.a0 ?? 255)).length || 2;
      const before = a ? clipMs(a) - frames.slice(-fading).reduce((n, f) => n + f.delay, 0) : 0;
      const last = frames.slice(-fading).reduce((n, f) => n + f.delay, 0);
      this.fade = this.scene.tweens.add({ targets: this.sprite, alpha: 0, delay: before, duration: Math.max(1, last) });
      return;
    }
    if (!hold && action !== 'stand' && action !== 'move') {
      this.sprite.once('animationcomplete', () => {
        if (this.sprite.active) this.play('stand');
      });
    }
  }
}
