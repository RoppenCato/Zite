# The Knight: body, the Tin set and the Copper set

Mitch, AD, 2026-11-01. Copy the whole folder. Files at 2x, facing left, the pivot at the feet in every frame, 150 CSS px tall.
Frame names are `<piece>/<clip>/<nnnn>`; every piece has the same 26 frames, and `clips.json` holds their delays, loops and
fades once. Each slot is one texture, so more pieces add frames, not atlases. Frames with identical pixels share one rectangle in the
atlas, each keeping its own pivot, so read the rectangle and the pivot per frame name.

## The draw order, for one hero

`tin_cape`, `body`, boots (`boots_base` or `tin_boots`), `tin_coat`, `far_front`, `tin_gloves_far`, `tin_charm`, `head`, `hair`
(or `tin_hat`), `arm`, `tin_coat_near`, `tin_sword`, `hand` (or `tin_gloves_near`), `tin_shield`. Leave out any slot not worn.

## What each slot replaces

- **Hat:** replaces `hair`. It covers the hair entirely, so draw one or the other.
- **Gloves:** `tin_gloves_near` replaces `hand`; `tin_gloves_far` goes over the far hand, which is drawn with the body or with `far_front`.
- **Boots:** replace `boots_base`. There is always one or the other.
- **Coat:** two pieces, always together: `tin_coat` on the torso, `tin_coat_near` on the near shoulder after the arm.
- **Far arm:** `far_front` is a nearly empty frame when the arm is behind the coat. Draw it always.

## Icons

`icons.png`: `tin_sword`, `tin_shield`, `tin_hat`, `tin_coat`, `tin_gloves`, `tin_boots`, `tin_cape`, `tin_charm`, 40 square with the
subject inside the middle 32 px, to sit in a `frame_<rarity>` from the UI kit. Rarity is the frame, not the icon.

## How the rank shows

Tin is the plainest rank: dull grey, no crest, a small round shield, a wool cape. Copper is warm, and its shapes differ too: a comb on the
hat, a raised collar and studs down the coat, a second plate on the shoulder, cuffs on the boots and gloves, a wider sword with a fuller
and a broader guard, cross straps on the shield, a banded cape hem, a set stone on the charm. Every `tin_` piece has a `copper_` twin in the
same texture; `copper_` icons are in `icons.png`.

## Not tested

Not yet seen in the game. Only sword poses exist, so a shield is carried through the sword clips. With no sword worn, the near hand
still closes as a fist in the sword's poses.

## The atlases

| File | Size | On disk | Decoded |
| --- | --- | --- | --- |
| `body.png` | 1024 by 2048 | 135 KB | 8 MB |
| `boots.png` | 512 by 1024 | 40 KB | 2 MB |
| `capes.png` | 1024 by 2048 | 66 KB | 8 MB |
| `coats.png` | 1024 by 1024 | 70 KB | 4 MB |
| `gloves.png` | 512 by 512 | 23 KB | 1 MB |
| `charms.png` | 256 by 512 | 10 KB | 1 MB |
| `hats.png` | 1024 by 1024 | 49 KB | 4 MB |
| `swords.png` | 1024 by 1024 | 57 KB | 4 MB |
| `shields.png` | 512 by 1024 | 45 KB | 2 MB |
| `icons.png` | 256 by 512 | 10 KB | 1 MB |
