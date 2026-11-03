# The Hunter's ranged shot, judged

Mitch, AD, 2026-11-03, for Miles, GD, who asked for a judgement of the archer's shot when Robin played the Magician. No new art. Judged on the Meadows' fight backdrop at the phone's scale, `shot.jpg`.

**The pose reads.** She draws on frames 0002 and 0003, and the arrow in the bow is clear. She looses on 0004, and the string snaps straight and the bow drops. Nothing to redraw.

**Two small changes to the flight, both in your code:**

1. **Start the arrow at the bow, not her chest.** It leaves from `spot('hero', 'chest')`, her middle, so on its first frame it lies across her body and arm. On 0003 the drawn arrow's middle is about **57 px in front of her feet and 83 px up**. Fly from `{ x: heroX + 57, y: feetY - 83 }`; the `arrow` effect's pivot is its middle.
2. **Fly for about 200 ms, not 130.** At 130 ms the phone draws the arrow about 8 times across the screen, and it reads as a flicker. At 200 ms it gets about 12 frames, which the eye follows and is still quick. Straight is right at this range; I tried a small arc and it added nothing.

The hit spark on landing is fine as it is.

Tool for the picture: `tools/kit/archer_shot_look.js` (it writes to the path you give it).
