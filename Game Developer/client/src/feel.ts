// The feel of a press (Robin, 2026-11-01: the UI snappy and responsive, small effects when pressing buttons). One place
// for every screen: a thing squashes when the finger lands and pops when it lifts, the phone buzzes a little if it can,
// a chosen card or spot sparkles, a number that moved ticks, and a sound plays once the audio layer exists. Every
// effect respects the "fewer effects" setting; the buzz has a setting of its own.

import Phaser from 'phaser';
import { audio } from './audio.ts';
import { settings } from './settings.ts';

type Pressable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;

/** The sound hook: a name from the Sound Director's sprites (`audio.ts`); a name with no sound yet is silent. */
export const sfx = {
  play: (name: string): void => audio.play(name),
};

export const feel = {
  /** Squash a thing the moment the finger lands on it. */
  press(scene: Phaser.Scene, target: Pressable): void {
    const ms = settings.ms(60);
    scene.tweens.killTweensOf(target);
    if (!ms) return;
    scene.tweens.add({ targets: target, scaleX: 0.94, scaleY: 0.94, duration: ms, ease: 'Quad.easeOut' });
  },

  /** Pop it back when the finger lifts or leaves. */
  release(scene: Phaser.Scene, target: Pressable): void {
    const ms = settings.ms(90);
    scene.tweens.killTweensOf(target);
    if (!ms) {
      target.setScale(1);
      return;
    }
    scene.tweens.add({ targets: target, scaleX: 1.05, scaleY: 1.05, duration: ms, ease: 'Quad.easeOut', yoyo: true, onComplete: () => target.setScale(1) });
  },

  /** A short buzz on phones that have it (Android), if the setting allows; a no-op elsewhere. */
  buzz(ms = 10): void {
    if (!settings.get().vibration) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      // A browser without it, or one that refuses outside a gesture: nothing.
    }
  },

  /** A burst of small dots from a point in a colour: a chosen card or chip, a lit spot tapped. */
  sparkle(scene: Phaser.Scene, x: number, y: number, color = 0xfff27a, depth = 50, count = 7): void {
    if (settings.get().fewerEffects) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 22 + Math.random() * 14;
      const dot = scene.add.circle(x, y, 2.5 + Math.random() * 2, color, 1).setDepth(depth);
      scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.4,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  },

  /** A number that changed: its text pulses once. */
  tick(scene: Phaser.Scene, text: Phaser.GameObjects.Text): void {
    const ms = settings.ms(110);
    if (!ms) return;
    scene.tweens.killTweensOf(text);
    text.setScale(1);
    scene.tweens.add({ targets: text, scaleX: 1.18, scaleY: 1.18, duration: ms, yoyo: true, ease: 'Quad.easeOut', onComplete: () => text.setScale(1) });
  },
};
