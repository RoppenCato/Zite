# Chapter 1, Puddlewick: the plan of implementation

Miles, GD, 2026-11-01, on Robin's answers of that evening: the hero at 150 CSS px and the layout bends to him; **Alpha 1
offers the Knight alone**; the build order below; **built here**, in the local session, with the pane and Robin's phone.
Each step says what I build, what it needs from the Art Director (Mitch, AD) and the Sound Director (Nigel, SD), and when,
so the studios work in parallel and nothing waits that does not have to. Every step runs with placeholders until its
drop lands, and every step is checked in the pane at phone size and on Robin's phone before the next. The chapter's
"done when" is in `docs/chapters.md`.

## The order of what I need from the studios

Not the waves' order (`docs/art-demands.md`, `docs/sound-demands.md`), but the order the steps below consume them:

| | From Mitch, AD | From Nigel, SD |
| --- | --- | --- |
| First | **the chest and the loot reveal** pieces (the chest, the six glows, the opening clip, the card, the particle sheets): small, and they land in step 2 | **the UI sprite's first half**: the tap, the tap denied, the die's shake, tumble and landing, the steps, the chest's shimmer, bursts and ding, the level up (step 1, step 2, step 7) |
| Second | **the UI kit** (panels, cards, buttons with their pressed state, the die, bars, icons, the small marks, the press effects) and the **fonts** (step 6) | **the fight sprite** (step 4, step 7) |
| Third | **the meadows' fight backdrop** and **one monster, the Jelly Slime**, to prove the side view (step 4) | **the rest of the UI sprite** (arrivals, shop, bag, online, the character screen) |
| Fourth | **the meadows' board kit** with its props (step 5) | **Cloverfield Meadows' music**: the board theme first, then the fight and King Goo themes, the title, the beds |
| Fifth | **the Knight's parts**: the body and the Tin and Copper pieces for the eight slots, the four weapon types, as per-part atlases once the alignment test passes (step 9) | **the meadows' creature voices** (six creatures, three each) |
| Sixth | the other five meadows creatures and **King Goo** (step 4's tail) | |
| Last | the **wordmark, the app icon, the character-screen backdrop** (step 11) | |

A drop that comes early is wired the day it lands; a drop that comes late leaves its placeholder a little longer.

## The steps

1. **The press feel** (done 2026-11-01, `client/src/feel.ts`). Every button squashes on touch and pops on release, within a frame; a tick sound and, on Android, a
   short vibration (a setting, on by default); chips and cards sparkle when chosen; a bar ticks when its number moves;
   nothing waits on a load to react. One place in the code (`client/src/ui.ts`) serves every screen. *Needs*: nothing to
   start; the tap and tick sounds from Nigel, SD when they come. *Done*: every tap in the game answers at once in the pane
   and on the phone.
2. **The loot reveal.** A screen over the board for every chest, vault and boss drop: the chest glows in the rarity colour
   (the glow builds for most of a second), opens with a burst of particles in that colour, the piece slides out on a card
   with its name in its colour and its one-line power; a tap or two seconds closes it; several pieces queue. Placeholder
   chest and particles drawn by code until the art lands. *Needs*: the chest pieces from Mitch, AD; the shimmer, bursts
   and ding from Nigel, SD. *Done*: a chest opening makes Robin smile.
3. **The moments.** The level up (a burst and the new level, the ability pick after it), the boss down banner, the area
   opened swell, the die landing (a bounce and a glow on the settled face). *Needs*: the banners and the die from the UI
   kit; the level-up, boss-down and die-landing sounds. *Done*: the four dopamine moments read as moments.
4. **The fight, side on.** The fight screen rebuilt around the hero at 150 CSS px: a layered backdrop (the sky a code
   gradient, two or three strips, a ground band), the hero at the left with his feet on the ground, the enemy at the right
   at its size (a circle by role until its art), HP bars over each figure, the enemy's tell above it, the message as a strip
   that does not fight the figures, the move and guard rows as they are, the effects as code flashes until the effect
   sheet. The monster, when it comes, plays its five clips on the same events as the hero. *Needs*: the meadows' fight
   backdrop and the Jelly Slime first, the other creatures and King Goo after; the fight sprite from Nigel, SD. *Done*:
   a fight against the Jelly Slime with both figures animated on their backdrop, at 60 fps on the phone.
5. **The board from kits.** A board renderer that draws an area's ground as tiles with cliff faces at the steps, roads
   as kit pieces along the links, spot markers from the kit, props placed by hand on the hubs, everything standing upright
   and sorted by depth; the closed-area cover as a tile; the hero and the other players' marks as figures on top. A small
   data file per area says which tile and which props go where. Shapes stay wherever the kit has no piece yet. *Needs*:
   the meadows' board kit. *Done*: Cloverfield Meadows seen whole at the overview and walked at follow zoom with no shape
   left, at 60 fps with a few hundred spots culled.
6. **The UI from the kit.** Panels, cards, buttons, the die, bars, chips, icons and the small marks drawn from the UI
   atlas with nine-slices; the two fonts; the HUD, the character screen, the shop, the bag, the atlas and the settings
   restyled on it; the message line that clips three lines fixed on the way. *Needs*: the UI kit and the fonts. *Done*:
   every screen in the game is the kit, nothing is a flat rectangle, and Robin says it is pleasant to look at.
7. **The audio layer.** The sprites loaded with their scenes and played on the events; music per area streamed with a
   crossfade on an area change and on a fight's start and end; the beds under it; mute and two volumes in the settings;
   `?mute=1`; the audio unlocked on the first tap. *Needs*: the UI sprite, then the fight sprite, then the meadows' music
   and voices; ffmpeg on the PC (Robin's yes). *Done*: the game is heard on the phone with the volumes and the mute
   working, and silent in the pane with `?mute=1`.
8. **The Knight alone.** The character screen offers the Knight and says the three others come in chapter 2; the rules
   keep all four, so nothing else changes. *Needs*: nothing. *Done*: a new player can only be a Knight.
9. **The hero's parts, layered.** When Mitch, AD's alignment test passes: the client draws one atlas per part in the fixed
   order (cape, body, boots, hips, torso, gloves, head, helm, near arm, weapon, off-hand) with the same frame timing; each
   piece of gear carries its look in the data; the set-by-coat rule of the test goes. *Needs*: the Knight's per-part
   atlases for the Tin and Copper pieces and the four weapon types. *Done*: wear anything in the bag and see it on the
   board and in the fight.
10. **Balance with eight slots.** The bots (`tools/simulate.ts`) run again with the three new slots; the walls for levels 1
    to 6 and King Goo retuned so a Knight beats him by level 5 or 6 in the area's gear. *Needs*: nothing. *Done*: the
    numbers in `docs/state/rules.md` are current.
11. **Friends on the tunnel, the install page.** cloudflared in front of the server and the built client; the title screen
    says how to install on Android (add to home screen) and shows the world's address; the icon and wordmark from the kit.
    *Needs*: the icon, the wordmark, the backdrop. *Done*: a friend installs Zite from a link and plays with Robin.
12. **Alpha 1.** The "done when" of chapter 1 walked through on Robin's phone and a friend's; the frame log read; the
    docs in `docs/state/` current; main tagged `alpha-1`.

Steps 1 to 3 and 8 need no art to start and are first. Step 4 starts on placeholders as soon as 3 is done, step 5 after
4, step 6 when the UI kit lands (its code starts earlier on the placeholder atlas), step 7 when the first sprite lands,
step 9 when the parts land, 10 and 11 near the end, 12 last.

## What Robin does meanwhile

Plays the build on his phone after every step and says what felt wrong; answers Mitch, AD's and Nigel, SD's questions as
they come; says yes to ffmpeg; and when the chest opens for the first time, says whether it made him smile.
