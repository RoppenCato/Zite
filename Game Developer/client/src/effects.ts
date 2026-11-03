// The fight's effects and the ability icons (chapter 2, step 6; Mitch, AD's `assets/effects/`, `assets/abilities/`, his NOTES in
// each): one atlas of inked clips drawn at 0.5, the large bubble at 1, the Archer's owl at 0.5. A clip is played once where
// a blow lands or held while a state lasts; "fewer effects" turns them all off, and the words and bars still say what happened.

import Phaser from 'phaser';
import abilitiesJson from '../../assets/abilities/abilities.json?url';
import abilitiesPng from '../../assets/abilities/abilities.png';
import sealsJson from '../../assets/seals/seals.json?url';
import sealsPng from '../../assets/seals/seals.png';
import talentsJson from '../../assets/talents/talents.json?url';
import talentsPng from '../../assets/talents/talents.png';
import talentsV2Json from '../../assets/weapons_v2/talents_v2.json?url';
import talentsV2Png from '../../assets/weapons_v2/talents_v2.png';
import bloodData from '../../assets/weapons_v2/fx_blood.json';
import bloodJson from '../../assets/weapons_v2/fx_blood.json?url';
import bloodPng from '../../assets/weapons_v2/fx_blood.png';
import bubbleData from '../../assets/effects/bubble/bubble.json';
import bubbleJson from '../../assets/effects/bubble/bubble.json?url';
import bubblePng from '../../assets/effects/bubble/bubble.png';
import effectsData from '../../assets/effects/effects.json';
import effectsJson from '../../assets/effects/effects.json?url';
import effectsPng from '../../assets/effects/effects.png';
import owlData from '../../assets/effects/owl/owl.json';
import owlJson from '../../assets/effects/owl/owl.json?url';
import owlPng from '../../assets/effects/owl/owl.png';
import rogueData from '../../assets/fx_rogue/fx_rogue.json';
import lightningData from '../../assets/trinkets/fx_lightning.json';
import lightningJson from '../../assets/trinkets/fx_lightning.json?url';
import lightningPng from '../../assets/trinkets/fx_lightning.png';
import rogueJson from '../../assets/fx_rogue/fx_rogue.json?url';
import roguePng from '../../assets/fx_rogue/fx_rogue.png';
import { ensureClips, msBefore, type ActionData } from './clips.ts';
import { settings } from './settings.ts';

const actionsOf = (data: unknown): Record<string, ActionData> => (data as { actions: Record<string, ActionData> }).actions;
const ATLASES = {
  effects: { png: effectsPng, json: effectsJson, actions: actionsOf(effectsData), scale: 0.5 },
  bubble: { png: bubblePng, json: bubbleJson, actions: actionsOf(bubbleData), scale: 1 },
  owl: { png: owlPng, json: owlJson, actions: actionsOf(owlData), scale: 0.5 },
  // The Rogue's slashes and the poisoned blade's drip (Mitch, AD, 2026-11-03).
  fx_rogue: { png: roguePng, json: rogueJson, actions: actionsOf(rogueData), scale: 0.5 },
  // Blood on a Ninja's blade (Mitch, AD, 2026-11-03).
  fx_blood: { png: bloodPng, json: bloodJson, actions: actionsOf(bloodData), scale: 0.5 },
  // A trinket's lightning and the storm blade's (Mitch, AD, 2026-11-03): the pivot is where it strikes, drawn additively.
  fx_lightning: { png: lightningPng, json: lightningJson, actions: actionsOf(lightningData), scale: 0.5 },
} as const;
type AtlasName = keyof typeof ATLASES;

const ICONS = 'abilities';
/** The talents to level 30 (Mitch, AD): 4 MB in memory, so held only while the skill board or a fight that carries one is up. */
const TALENT_ICONS = 'talents';
/** The new Rogue's ten talents (Mitch, AD, 2026-11-03). */
const TALENT_ICONS_V2 = 'talents_v2';

/** The ability icons, for the fight, the trainer and the guide; call from a scene's preload. */
export function preloadAbilityIcons(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ICONS)) scene.load.atlas(ICONS, abilitiesPng, abilitiesJson);
}

/** The Seals (Mitch, AD): `seal_<land>` and `seal_empty`. Small enough to keep, so the popup is always ready. */
export const SEALS = 'seals';
export function preloadSeals(scene: Phaser.Scene): void {
  if (!scene.textures.exists(SEALS)) scene.load.atlas(SEALS, sealsPng, sealsJson);
}

/** The talents' icons, for the skill board. */
export function preloadTalentIcons(scene: Phaser.Scene): void {
  if (!scene.textures.exists(TALENT_ICONS)) scene.load.atlas(TALENT_ICONS, talentsPng, talentsJson);
  if (!scene.textures.exists(TALENT_ICONS_V2)) scene.load.atlas(TALENT_ICONS_V2, talentsV2Png, talentsV2Json);
}

/** For a fight: only when something carried is drawn there. */
export function preloadCarriedIcons(scene: Phaser.Scene, carried: string[]): void {
  if (carried.some((id) => !scene.textures.exists(ICONS) || !scene.textures.get(ICONS).has(id))) preloadTalentIcons(scene);
}

/** Frees the talents' icons when this scene goes. */
export function freeTalentIconsAfter(scene: Phaser.Scene): void {
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    if (scene.textures.exists(TALENT_ICONS)) scene.textures.remove(TALENT_ICONS);
    if (scene.textures.exists(TALENT_ICONS_V2)) scene.textures.remove(TALENT_ICONS_V2);
  });
}

/** An ability's icon at this size, or null when it has none. Its frame is the rules' ability id. */
export function abilityIcon(scene: Phaser.Scene, ability: string, x: number, y: number, size = 28): Phaser.GameObjects.Image | null {
  const atlas = [ICONS, TALENT_ICONS, TALENT_ICONS_V2].find((key) => scene.textures.exists(key) && scene.textures.get(key).has(ability));
  if (!atlas) return null;
  const image = scene.add.image(x, y, atlas, ability);
  return image.setScale(size / image.width);
}

/** The clips for a fight; call from its preload. The owl is only for an Archer. */
export function preloadEffects(scene: Phaser.Scene, withOwl: boolean, withRogue = false, withLightning = false): void {
  for (const name of [...(['effects', 'bubble'] as const), ...(withOwl ? (['owl'] as const) : []), ...(withRogue ? (['fx_rogue', 'fx_blood'] as const) : []), ...(withLightning ? (['fx_lightning'] as const) : [])]) {
    if (!scene.textures.exists(name)) scene.load.atlas(name, ATLASES[name].png, ATLASES[name].json);
  }
}

const quiet = (): boolean => settings.get().fewerEffects;

function made(scene: Phaser.Scene, atlas: AtlasName): boolean {
  if (!scene.textures.exists(atlas)) return false;
  ensureClips(scene, atlas, ATLASES[atlas].actions);
  return true;
}

function sprite(scene: Phaser.Scene, atlas: AtlasName, clip: string, x: number, y: number): Phaser.GameObjects.Sprite | null {
  if (!made(scene, atlas) || !ATLASES[atlas].actions[clip]) return null;
  return scene.add.sprite(x, y, atlas, ATLASES[atlas].actions[clip]!.frames[0]!.name).setScale(ATLASES[atlas].scale).setDepth(50);
}

/** A clip played once where something happened, gone when it ends. */
export function playOnce(scene: Phaser.Scene, clip: string, x: number, y: number, atlas: AtlasName = 'effects'): Phaser.GameObjects.Sprite | null {
  if (quiet()) return null;
  const s = sprite(scene, atlas, clip, x, y);
  if (!s) return null;
  s.play(`${atlas}/${clip}`);
  s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
  return s;
}

/** A clip that moves from one place to another, then calls `then` where it lands. */
export function fly(scene: Phaser.Scene, clip: string, from: { x: number; y: number }, to: { x: number; y: number }, ms: number, then: () => void): void {
  const s = quiet() ? null : sprite(scene, 'effects', clip, from.x, from.y);
  if (!s) {
    then();
    return;
  }
  s.play(`effects/${clip}`);
  scene.tweens.add({
    targets: s,
    x: to.x,
    y: to.y,
    duration: ms,
    ease: 'Quad.easeIn',
    onComplete: () => {
      s.destroy();
      then();
    },
  });
}

/** Clips held while a state lasts, each under a name of the caller's. */
export class HeldEffects {
  private readonly held = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** The clip shows while `on`; `off` plays once where it stood when it ends. */
  set(clip: string, on: boolean, x: number, y: number, atlas: AtlasName = 'effects', off?: string, name = `${clip}@${x}`): void {
    const current = this.held.get(name);
    if (on && !current && !quiet()) {
      const s = sprite(this.scene, atlas, clip, x, y);
      if (!s) return;
      s.play(`${atlas}/${clip}`);
      this.held.set(name, s);
    } else if (!on && current) {
      this.held.delete(name);
      current.destroy();
      if (off) playOnce(this.scene, off, x, y, atlas);
    }
  }

  clear(): void {
    for (const s of this.held.values()) s.destroy();
    this.held.clear();
  }
}

/** The Archer's owl beside the hero while it fights with her. */
export class Owl {
  private readonly sprite: Phaser.GameObjects.Sprite | null;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = sprite(scene, 'owl', 'stand', x, y);
    this.sprite?.setFlipX(true).play('owl/stand');
  }

  /** How long until the blow lands: frame 4. */
  blowMs(): number {
    return msBefore(ATLASES.owl.actions.attack1!, 4);
  }

  /** It dives at the enemy and comes back. */
  strike(toX: number): void {
    const s = this.sprite;
    if (!s) return;
    s.play('owl/attack1');
    s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.play('owl/stand'));
    this.scene.tweens.add({ targets: s, x: toX, duration: this.blowMs(), ease: 'Quad.easeIn', yoyo: true, hold: 60 });
  }

  destroy(): void {
    this.sprite?.destroy();
  }
}
