# Enchanted Kingdoms — art direction proposal

**For:** Mitch, AD — Zite Art Director  
**Status:** Creative direction proposed from Robin's conversation, 2026-11-01. The **Enchanted Kingdoms theme**, **simple graphics**, and **a mix of bright/playful and magical/adventurous** are Robin's expressed preferences. The measurements, palettes, styles and names below are **proposals (mine)** until Robin approves them in actual phone-size art.  
**Role:** This is a visual-design brief to read **alongside**, not instead of, `CLAUDE.md`, `MITCH.md`, `docs/direction.md`, the root game brief, and the game's `docs/art-demands.md` and `docs/state/art.md`.

## 1. What we are making

A friendly, colorful fantasy board-world game with humor, rivalry, class progression, gear, treasures and memorable monsters. Early places should make a player smile. Deeper regions can feel strange, mysterious and epic, but still belong to the same cheerful world. **Cute first; adventure grows with distance and progression.** Avoid a Viking identity (Robin is making a separate Viking game) and avoid an anonymous realistic-medieval look.

**Style sentence:** *Clean, hand-crafted 2D storybook fantasy: compact chibi heroes, strong silhouettes, restrained flat shading, bright foregrounds, gentle layered distance, and surprising magical details.* This is a visual target, not a demand to draw every asset by hand.

The test is not “does this look beautiful enlarged?” It is “does the player instantly understand it on a phone, while the board, HUD and fight are visible?”

## 2. The game's real presentation — design for it

Read the current project documentation before deciding sizes or packing formats. The following is established by the uploaded studio briefs:

- **Board exploration:** a generated graph of spaces and connections, **viewed from a raised camera in 2D** (a 2.5D presentation, not a true 3D world). Its visual world comes from **reusable area kits**: ground tiles/strips, small place props and layered scenery, never one large scene painting.
- **Combat:** a **separate side-view fight screen**, with named character and monster actions exported as sprite frames and data. A beautiful board concept does not automatically make usable side-view battle art.
- **Platform:** Phaser 4 / TypeScript / WebGL in a mobile-first PWA. Android first. A regular test viewport is **412 × 915 CSS pixels**, with the game's actual HUD/chrome present. The user plays on a phone, not on an enlarged editor canvas.
- **Performance:** aim for 60 fps on a middling phone. Use economical atlases, trimmed frames, pre-baked effects, and repeatable modular kits. No per-frame blur/filter, unnecessary large textures or atlas growth just to add tiny detail.
- **Deliverable contracts:** use the exact current definitions in `docs/direction.md` and the Game Developer's `docs/state/art.md`. Sprite frames need their required origin, delay, hit box and head metadata; scene layers need repeat/scroll/drift/opacity/front metadata where specified. Do **not** invent a competing atlas schema or hard-code a size budget from this proposal.

**Design each asset twice:** its readability on the board and its readability in combat/UI, when applicable. The board's raised angle and the fight's side view require different compositions, even if they share palette, shapes and motifs.

## 3. Six non-negotiable visual principles

1. **Shape before detail.** A tiny silhouette must communicate class, monster type, direction of facing and action. Distinct headgear, weapon shape and stance beat tiny embroidery.
2. **Simple but not primitive.** Deliberate, varied contours and a small amount of carefully placed shading. Avoid both generic flat geometric dolls and fussy hand-painted detail.
3. **Warm and playful foreground, wonder in the distance.** Characters, enemies, traversable ground and important props have clear edges and higher contrast. Distant planes are quieter, softer and less saturated.
4. **One coherent world.** Shared outline, anatomy, material rules and lighting across every kingdom. Regional variation comes from palette, architecture, foliage and motifs—not a new art style per biome.
5. **Action reads at a glance.** Windups change silhouette, attacks follow a clear arc, hits register strongly. Use pose, not color-only flashes, to signal gameplay.
6. **Modular by construction.** Board areas are built from tiles, strips, clusters and props. Characters and equipment are derived from approved masters, not separately hallucinated anew in every frame.

## 4. Character art standard — proposed, to approve from a still

**Target:** compact chibi, approximately **2.25–2.5 heads tall**. This is a range for concept exploration, **not** a locked production measurement. The previous project used an approximately 100 CSS-pixel player suggestion; Robin liked a 118 CSS-pixel example. **Player on-screen height remains open**. Resolve it by comparing two real phone-size mocks; then record the exact choice in `docs/direction.md`.

- One consistent construction for heads, shoulders, torso, hands, boots and eye placement. No head or sword changing shape between poses.
- Heads broad and expressive, torsos compact and naturally flat-fronted, shoulders and arms connected and understandable, short but functional legs. Avoid breast-like rounded chest shading, missing or extra arms, detached wrists and awkward sword grips.
- Faces: simple eyes, brows and a small mouth. Heroes default to **curious, brave, mischievous or quietly confident**, not sad or anxious. Hit/death expressions can be dramatic.
- Outlines: a consistent dark colored line (prefer deep warm brown/navy over universal pure black), tested at *actual displayed size*. Use clean pixels/alpha, not softness caused by removing a green background.
- Rendering: base color + **one deliberate shadow value** per material; optional very small highlight on metal, glass, eyes or magic. No airbrushed gradients or realistic texture on ordinary sprites.
- Costume: one major garment silhouette, one class-defining shape, one focal accessory, a recognizable weapon. Avoid stacks of tiny belts, badges and buckles.
- Design for the game's actual viewing angles. Use side-view combat masters and separate board-facing assets when needed. Do not pretend one generated pose works for all views.

**Class silhouettes to explore:** Warrior (stout blade/shield shape), Mage (tall hat/robe/staff), Rogue (scarf/hood and slim blade), Cleric (tabard and rounded sacred motif), Archer (bow/quiver). These are **suggestions**, not a confirmed starting class list; check the game brief and art demands first. Each class can share body proportions without sharing the same silhouette.

**Equipment progression:** common = bold basic shape; rare = one distinctive secondary shape/color; epic = thematic ornament and clear accent; legendary = signature silhouette and restrained magic effect. Higher rarity is not simply more tiny lines or a bigger glow.

## 5. Palette rules

**Proposed global swatches** (starting points, not final brand colors):

| Function | Hex | Use |
|---|---|---|
| Ink | `#333044` | outlines and darkest details |
| Cream | `#FFF1CF` | light stone, parchment, highlights |
| Grass | `#6DC76F` | friendly starting ground |
| Sky | `#8DD8EC` | clear-day sky and atmospheric color |
| Royal blue | `#457FCE` | hero clothing, interface accents |
| Warm gold | `#F5C15C` | rewards, bells, warmth |
| Coral | `#ED7969` | warm accents and friendly danger |
| Magic violet | `#9673D5` | mystery and arcana |

Do not apply all colors to every asset. A small character typically needs **2–3 dominant hues**, neutrals, skin/hair, and one restrained accent. Maintain sufficient light/dark contrast so color is *supporting information*, not the only way to identify an item, kingdom or class. Limit each material's shade steps. Palette PNG compression is a delivery optimization only after clean outlines and alpha are verified.

### Region identities (working concepts, not approved lore names)

| Region | Mood | Main colors and motifs | Early visual examples |
|---|---|---|---|
| **Verdant** | first adventure, safe and playful | leaf green, sunny yellow, cream; rounded leaves and banners | village, slimes, sprout monsters |
| **Moonspire** | whimsical arcane mystery | violet, midnight blue, cyan; stars, crescent windows, runes | wizard towers, candle spirits, living books |
| **Suncrest** | bright treasure and ancient magic | sandstone, gold, turquoise, coral; sun discs and arches | relic halls, scarabs, living statues |
| **Frostveil** | crisp, heroic mountain adventure | ice blue, white, pine green; chunky pines and faceted ice | snow villages, frost wolves, ice spirits |
| **Thornhollow** | enchanting, slightly eerie forest | moss, teal glow, berry purple; thorns and mushrooms | mushroom folk, bramble beasts, fae |

All five must share the **same outline logic, scale of detail, architecture exaggeration and light direction**. Names are art placeholders for discussion, not claims about canonical world lore; Miles, GD owns implemented names and lore unless Robin decides otherwise.

## 6. Board-world art: kit, not illustration

The board's **spaces, links and playable choices remain obvious**. The area kit decorates and clarifies the generated graph; it must not hide edges, path crossings, markers, players, enemy locations or interactive spaces.

- Ground: a few legible tile/strip families per area; restrained mottling, no dense noise; transitions designed to connect in arbitrary generated layouts.
- Places: small, iconic structures with unmistakable silhouettes (inn, town, shrine, cave, tower, ruin). Fewer large shape cues are better than many tiny windows.
- Props: reusable trees, bushes, rocks, flowers, mushrooms, signposts, lanterns and ruins. Create variants of scale, lean and clustering; avoid visible machine-stamped repetition. Test repeating kits **3 × 3**.
- Depth: foreground/near-ground crisp and saturated; distant backdrops layered, lighter, softer, with their strongest detail away from the combat character band. Define front/behind behavior explicitly.
- Camera: preview the actual raised-camera board view. Do not use a straight-on village illustration as proof a ground kit works.
- Space for UI: backgrounds must keep player/monster silhouettes, dice, space markers and HUD readable without requiring full-screen blur or dark overlays.

## 7. Side-view fights

Fights are **separate compositions**, not crops of the board:

- Keep the fighter ground line visually clear. Avoid scenic detail directly behind heads, swords, projectiles, health displays or the action's primary silhouette.
- Use simple layered fight backdrops that evoke the current region: e.g., Verdant = broad meadow shapes and distant rounded castle; Moonspire = low-contrast towers and soft violet sky.
- Character and enemy outlines should contrast against every intended battle backdrop, including dark/magical areas.
- Attack tells: anticipation → clear contact pose → recovery. The sword stays attached to the same hand, follows the wrist, and retains the same blade/guard silhouette across frames.
- Hits should visibly deform/recoil. For a monster, `hit1` should be especially readable, as the existing AD brief specifies.
- Death frames must remain aligned to the agreed anchor; fallen poses may occupy a wider cell but must not drift accidentally.

## 8. Monsters: cute first, threatening through shape

For every monster, identify **one silhouette hook** and **one behavior hook** before drawing it. Examples: a slime with a tilted crown-like splash; a mushroom whose cap hides its eyes; a goblin with an enormous backpack; a candle spirit that leans like a flame. These are prompts to explore, not a final roster.

**Common:** mostly round, one main color family, minimal facial marks.  
**Field enemies:** one pointed/angled cue, one tool or body feature.  
**Elite:** stronger silhouette and region motif, restrained armor/markings.  
**Boss:** distinctive large-scale silhouette, 2–3 major motifs, readable telegraphs. “More epic” should mean larger and clearer shapes, not extra tiny details.

Check each monster against the player **at the real size used in a fight**. A monster approximately 100 CSS pixels high is an important example from the studio brief, not a universal locked scale for every encounter.

## 9. Interface and items

The HUD is part of the composition, not a decoration added after approval. Prefer tidy, rounded storybook framing, simple solid fills, readable contrast and sparse gold/magic accents. Avoid ornate borders on every box. Keep interactive states distinguishable without color alone.

Icon rules: one main object, centered silhouette, minimal background noise, recognizable at the smallest actual UI size. Board markers and actionable spaces must outrank scenery in the visual hierarchy. Test icons, small text and status marks on **the device screenshot with the real chrome**, never just on a standalone icon sheet. Coordinate UI changes with Miles, GD; Art Director delivers the art and recommendations, not code changes.

## 10. AI art and animation production rules

**AI is a concept assistant, not the authority on frame continuity.** Previous fully generated sprite sheets changed hair, face, body and sword between frames, drifted at death, and carried soft keyed edges. Repeating this method at scale will repeat the problems.

1. **Explore with 2–3 deliberately different single-image concepts**, including simple alternatives. Judge their shape, mood, line weight, palette, practical production cost and performance at phone size.
2. **Finish one proof still**: hero standing on the first area's real ground, one monster next to the hero, actual game chrome and the intended on-screen scale. Get Robin's verdict before a full character set or animation.
3. **Lock a master design** and proportion sheet (face, hair, clothing, weapon length, outlines, light direction, palette). Reference it, not a vague text instruction like “same character.”
4. **Build movement from approved, reusable assets**, ideally cutting the final painted master into body/weapon parts and animating with pivots/pose data, where it looks convincing. Correct difficult poses manually. This paper-doll approach was identified in `CLAUDE.md` as an *untried* option: test it on a few frames before committing, do not promise it works.
5. **Never generate every finished animation frame independently** and assume it can be cleaned by anchoring. Never use keyed green transparency if clean RGBA source is available.
6. **Match existing export contracts** with `pack.js`, `shrink.py` and current studio tools where appropriate; validate alpha edges, frame trim, origins, hit boxes, animation delays, head anchors, sword consistency and actual compressed atlas size.
7. **Animate one action first**, played at its exact delay with the game's real ground position. Fix any jump, disconnected grip, scale shift or flicker before doing the rest.
8. **Reject beautiful but inconsistent art.** A coherent modest sprite at game size is more valuable than a gorgeous off-model sprite that flickers.

## 11. Proposed initial production sequence

Do not start with a complete world or class roster.

**Stage A — Find the look.** Produce 2–3 genuinely different style stills for Enchanted Kingdoms. Each must use the raised-camera board context, not a generic full-bleed splash. Compare realistic workload, mobile legibility and personality. Ask Robin to choose and comment. Do not treat this document's proposed hex colors or height ratios as confirmed decisions.

**Stage B — One final still.** Produce exactly one polished **hero + monster + first-zone ground + real HUD** proof at **412 × 915**; also show the fight view using the same two characters and appropriate side-view backdrop if necessary to check compatibility. Confirm displayed player height and monster scale with Robin. Update `docs/direction.md` with the approved look, date and Robin's own words.

**Stage C — Minimal playable art kit.** Use `docs/art-demands.md` for exact priority/order. In general: base hero, one enemy, a small ground/prop kit, a single side-view backdrop, basic essential icons and the required actions. Integrate, play, inspect, improve; only then expand classes, areas and monsters.

**Stage D — Scale by systems.** Create consistent construction sheets, palettes, region motifs and reusable prop/equipment families; add content only after the pipeline is proven with final in-game rendering.

## 12. How Mitch, AD should judge and deliver

Keep the existing **copy → work → judge → deliver** workflow in `CLAUDE.md`:

- Read the game's current briefs and budgets first, and copy source assets into `work/<name>/before/`; never edit the Game Developer's folder.
- Review at **412 × 915 CSS pixels or the actual phone**, with **the game's chrome**. Also inspect individual sprites at 1× display size, not only enlarged. For motion, use real playback timings and an artifact preview that works on Robin's phone; a GIF alone can show as a still.
- For generated area kits, inspect a 3 × 3 repeat. For battle art, judge combat poses against their *actual* background. For every sprite delivery, check the existing metadata contract, transparency, anchors and atlas file-size budget.
- Deliver to `out/<name>/` with asset files, required data, `NOTES.md` containing clear drop-in instructions, before/after comparison and a viewable phone-size picture or moving preview. Message Miles, GD. Update `docs/inventory.md` and `docs/log.md`.
- If an asset does not fit, explain why using **one concrete on-screen comparison**, not a long speculative critique. Show Robin the alternatives and let Robin decide. Mark his approvals `(Robin, YYYY-MM-DD)` and mark unapproved studio judgments **mine**.

## 13. Acceptance gate: ask these questions before calling art finished

- At real phone size, can I identify **hero, class, monster, facing and action** instantly?
- Does the composition leave room for **spaces, route connections, dice, status, HUD and readable choices**?
- Does the artwork work in its **actual camera view**: raised board or side fight?
- Are the art's **shape language, line weight, flat shading and palette** consistent with approved masters?
- Is the expression intentional, the anatomy plausible in this stylized style, and the weapon truly attached to the hand?
- Does animation play without **flicker, unintended movement, shape drift or edge halos**?
- Does the area kit tile/repeat without obvious pattern stamping or path obstruction?
- Does the result meet the **current** art contract, atlas limits and phone performance budget from Miles, GD?
- Can Robin see and judge it **on his phone** without opening production files?

**If not, do not multiply that problem across a full set. Fix the one proof first.**

## 14. Reusable short brief for AI concept requests

> Enchanted Kingdoms, a mobile-first fantasy board-world RPG: warm playful charm mixed with growing magical adventure. Draw **one cohesive simple 2D storybook-cartoon asset** with clean dark colored outlines, strong readable silhouette, flat bright colors, one shadow step per material, minimal tiny details and compact chibi proportions for characters. Keep the foreground crisp and the distance soft. Match the approved master sheet's exact shape language, palette and light direction. Compose for the specified **raised-camera board** or **side-view combat** context; never mix them accidentally. The result must read at its actual display size on a 412 × 915 phone screen with the HUD present. No realism, painterly textures, overly complex gear, detached anatomy, soft keying halos or independently redesigned animation frames.

**This document guides exploration; final approved visual decisions belong in `docs/direction.md`.** Where there is conflict, follow Robin's dated game brief and the Art Director's existing technical contracts, then ask Robin to resolve creative choices with visible examples.
