# Enchanted Kingdoms — World Content Bible

**Audience:** Miles, GD (Game Developer), with content and art coordination from Mitch, AD.  
**Status:** Creative proposal for review; **not approved canon or implemented game rules**.  
**Prepared:** 2026-11-01.  
**Purpose:** A reusable world-content catalogue for the procedurally generated board game. This document supplements the Game Developer's `CLAUDE.md` and the project brief; it does not override them.

## 1. Premise and tone

Enchanted Kingdoms is a cheerful fantasy world of rival kingdoms, mischievous creatures, magical treasures, and strange places. Early areas are colorful, friendly, and funny; the world grows mysterious and more dangerous as players travel farther, culminating in legendary beasts and the ruins of a shattered royal realm. Even the most dangerous areas retain whimsical visual character.

**Tone rules:** charming before grim; memorable silhouettes before elaborate lore; fantasy adventure with occasional absurdity; recognizable creatures, landmarks, and places on a small phone screen. Avoid copying characters, place names, art, or writing from Dokapon, AdventureQuest, or other games.

## 2. Fit with the existing game

From Miles, GD's current `CLAUDE.md`:

- The world is a **seeded, chunked graph of board spaces and connections**, not a fixed linear map or tile grid. Terrain and decorative detail are laid onto it.
- Regions carry a kind and difficulty influenced by distance from the start; static world content can be derived from the seed.
- The board uses a raised 2D camera; fights appear in a **separate side-view scene**.
- The client is **Phaser 4 / TypeScript / Vite, Android-first PWA**, with phone-size review (e.g., **412 × 915**) and a target of responsive 60 fps on a middling phone.
- Art is built as **region kits**: repeatable board ground, props, and layered battle backdrops, plus character/monster atlases with action and frame metadata. Exact file formats, sizes, budgets, and action sets come from `Game Developer/docs/state/art.md`, `Game Developer/docs/art-demands.md`, and the Art Director's `docs/direction.md`—**do not replace them with assumptions from this document**.
- **Miles, GD** owns mechanics, balancing, world generation, implementation and naming/lore integration. **Mitch, AD** creates and delivers the artwork from his studio `out/`; Mitch does not edit the game's folder.

**Guiding distinction:** The twelve *region archetypes* below are reusable content definitions, **not twelve guaranteed consecutive map chapters**. Specific instances of a region are generated and may have different towns, encounters, and landmarks. Progression tiers are suggested difficulty bands, not a mandated traversal order.

## 3. Kingdoms, region archetypes, and progression

Kingdoms are broad visual/cultural identities; regions are reusable biome/encounter kits. A region may fall under a kingdom, wilderness frontier, or ancient territory. Kingdom associations below are suggested, not required spatial boundaries.

| Kingdom / territory | Visual identity | Region archetypes | Role |
|---|---|---|---|
| **Verdant Kingdom** | Leaf green, sky blue, warm wood, cream, sunflower yellow | Cloverfield Meadows, Honeyhill Fields; Wobblewood Forest along its frontier | Cheerful homeland and farms |
| **Glimmerlake Marches** (proposed frontier) | Turquoise water, reeds, pale stone | Glimmerlake Shores | Waterway frontier, ruins |
| **Moonspire Kingdom** | Lavender, deep violet, midnight blue, cyan lights | Moonwhisper Woods; Starfall Dominion as a dangerous arcane offshoot | Arcane learning and unstable magic |
| **Stormward Highlands** (proposed frontier) | Slate, moss, storm blue, copper | Thunderstone Highlands | Mines, stone circles, storms |
| **Suncrest Kingdom** | Sandstone, gold, terracotta, turquoise | Sunfall Expanse | Ancient relics and buried cities |
| **Frostveil Kingdom** | Ice blue, white, pine green, steel | Frostveil Peaks | Frozen mountains and fortresses |
| **Thornhollow Wilds** | Deep moss, thorn purple, mushroom orange, ghost teal | Thornhollow Wilds | Cursed fae wilderness |
| **Embercrown Range** (proposed frontier) | Charcoal, molten orange, crimson, gold | Embercrown Mountains | Dragon territory |
| **The Shattered Crown** | Broken ivory, royal violet, pale gold, rift cyan | The Shattered Crown | Legendary ruined realm |

Some territory names above are bridging suggestions so all regions have an organizational home; they are **not** additional required kingdoms. The four foundational kingdom identities from the art direction are **Verdant, Moonspire, Suncrest, Frostveil**, alongside the **Thornhollow Wilds**.

### Suggested difficulty tiers

| Tier | Difficulty band (proposed) | Region archetypes |
|---|---|---|
| 1 — Happy Kingdoms | 1–3 | Cloverfield Meadows; Wobblewood Forest; Honeyhill Fields |
| 2 — Enchanted Frontiers | 4–6 | Glimmerlake Shores; Moonwhisper Woods; Thunderstone Highlands |
| 3 — Lost Realms | 7–9 | Sunfall Expanse; Frostveil Peaks; Thornhollow Wilds |
| 4 — Legendary Kingdoms | 10–12 | Starfall Dominion; Embercrown Mountains; The Shattered Crown |

**Important:** Numbers above are authoring labels for rough relative difficulty, not approved levels, enemy stats, encounter rates, or balancing equations. Miles must adapt them to the actual rules and feel-test them.

## 4. Complete region catalogue

Each entry includes a region's visual kit, five regular enemies, one signature boss, and one anchor point of interest. Lists are **creative starting pools**, not an instruction that all five monsters must be built immediately. Other repeatable POIs are suggested for variety.

### Tier 1 — The Happy Kingdoms

#### 01. Cloverfield Meadows
- **Kingdom / type:** Verdant Kingdom; starter meadow and hamlets.
- **Theme and mood:** Sunny grasslands, flower-covered hills, fenced farms, cheerful villages; safe-looking but adventurous.
- **Palette:** Clover green, butter yellow, clear blue, warm timber, cream.
- **Board kit:** Short green turf, dirt roads, forks, flower patches, small fences, stumps, rounded bushes, windmill and cottage props. Paths and spaces stay clear.
- **Side-view fight backdrop:** Soft distant hills and farmhouse silhouettes; clean grass fighting plane with no busy detail behind combatants.
- **Monsters:** **Jelly Slime** (jiggly beginner blob); **Grumpy Sprout** (uprooted angry seedling); **Bumbling Bee** (clumsy oversized bee); **Mushroom Muncher** (snacking mushroom critter); **Meadow Bandit** (small opportunistic masked thief).
- **Boss:** **King Goo** — enormous jelly slime wearing an absurdly tiny stolen crown.
- **Signature location:** **Puddlewick Village** — suggested starting settlement.
- **Other possible POIs:** Slime Cave; Old Mill; Forest Shrine; traveling merchant cart; abandoned orchard.
- **Design hook:** Establish the game's playful identity immediately, including a boss funny enough to be remembered.

#### 02. Wobblewood Forest
- **Kingdom / type:** Verdant frontier; whimsical woodland.
- **Theme and mood:** Leaning trees, huge mushrooms, shadowy paths, mischievous woodland life.
- **Palette:** Leaf green, bark brown, coral mushrooms, soft teal, golden flecks.
- **Board kit:** Tree variants with different lean, mushroom clusters, logs, tangled roots, clear winding paths.
- **Side-view fight backdrop:** Big trunks in the midground; layered leafy canopy kept pale behind the fighters.
- **Monsters:** **Twigling** (walking stick-creature); **Moss Goblin** (forest goblin in mossy gear); **Sporeling** (tiny puffball spore creature); **Nutkin Thief** (acorn-stealing critter); **Sleepy Owlbear Cub** (drowsy but dangerous young beast).
- **Boss:** **Grumblebark** — huge ancient tree awakened by noisy travelers.
- **Signature location:** **The Upside-Down Tree** — a strange hollow-tree dungeon.
- **Other possible POIs:** Fungal Ring; Hollow Log Shop; Mossy Shrine; secret root bridge.
- **Design hook:** Nature feels alive and slightly ridiculous rather than threatening.

#### 03. Honeyhill Fields
- **Kingdom / type:** Verdant Kingdom; harvest countryside.
- **Theme and mood:** Golden grain, orchards, windmills, beehives, magical honey.
- **Palette:** Honey gold, wheat yellow, apple red, leaf green, farmhouse brown.
- **Board kit:** Crop patches, wooden fences, orchards, hives, hay bales, windmills, footpaths.
- **Side-view fight backdrop:** Harvest rows and a distant windmill; low foreground grain only at edges.
- **Monsters:** **Honey Blob** (sticky amber slime); **Corn Goblin** (stalk-disguised nuisance); **Apple Mimic** (fruit that bites back); **Buzzbug** (frantic buzzing insect); **Scarecrow Scrapper** (animated farm scarecrow).
- **Boss:** **Queen Bumble** — gigantic magical queen bee defending a hive.
- **Signature location:** **Goldencomb Farm** — source of unusual enchanted honey.
- **Other possible POIs:** Orchard Maze; Empty Apiary; Windmill Cellar; Harvest Market.
- **Design hook:** A funny farming aesthetic that still supports recognizable hazards.

### Tier 2 — The Enchanted Frontiers

#### 04. Glimmerlake Shores
- **Kingdom / type:** Glimmerlake Marches; lakeside and marsh frontier.
- **Theme and mood:** Sparkling waters, soft reeds, glowing plants, half-sunken ruins.
- **Palette:** Bright turquoise, lake blue, reed green, pearl stone, light coral.
- **Board kit:** Shore tiles, docks, small bridges, reed tufts, water stones, partially submerged columns. Board routes remain explicit; water art must never imply a playable path where none exists.
- **Side-view fight backdrop:** Layered shoreline and distant ruins; subdued water highlights away from combat silhouettes.
- **Monsters:** **Bubble Imp** (bubble-blowing troublemaker); **Shellback** (armored shoreline beast); **River Sprite** (mischievous water spirit); **Marsh Goblin** (reed-cloaked goblin); **Crystal Crab** (gem-shelled crab).
- **Boss:** **Lord Ripplefin** — eccentric guardian of the lake.
- **Signature location:** **The Sunken Bell Tower** — partially submerged ruin.
- **Other possible POIs:** Pearl Ferry; Reed Shrine; Broken Pier; Crystal Grotto.
- **Design hook:** Bright aquatic adventure, not murky swampland.

#### 05. Moonwhisper Woods
- **Kingdom / type:** Moonspire Kingdom; enchanted nocturnal forest.
- **Theme and mood:** Violet groves, glowing flowers, fairy circles, witch cottages and dreamlike light.
- **Palette:** Lavender, midnight violet, cyan magic, blue-green moss, pale silver.
- **Board kit:** Curved purple-barked trees, illuminated flowers, rune stones, witchy fences, moonlit clearings.
- **Side-view fight backdrop:** Layered dark-violet trees with soft cyan accents; keep the center combat zone uncluttered.
- **Monsters:** **Moon Moth** (large luminous moth); **Lantern Wisp** (floating little light); **Dream Fox** (illusion-making fox); **Hexcap** (bewitched mushroom); **Spellbound Doll** (cursed wooden toy).
- **Boss:** **Lady Nightbloom** — witch who transforms trespassers into woodland creatures.
- **Signature location:** **The Witchlight Cottage**.
- **Other possible POIs:** Fairy Circle; Dream Pond; Moonstone Shrine; Lost Library Annex.
- **Design hook:** First region with a distinctly mysterious, rather than simply happy, mood.

#### 06. Thunderstone Highlands
- **Kingdom / type:** Stormward Highlands; rocky uplands and mines.
- **Theme and mood:** Stone bridges, windswept peaks, storm clouds, mining camps and ancient standing stones.
- **Palette:** Slate blue, gray stone, copper, moss green, electric yellow.
- **Board kit:** Chunky cliff edges, rock stacks, stone circles, bridge modules, mine entrances, storm markers.
- **Side-view fight backdrop:** Distant ridges and modest lightning shapes; no flashing clutter during combat.
- **Monsters:** **Pebble Golem** (small animated rock); **Storm Bat** (charged cave bat); **Rock Hopper** (spring-legged stone critter); **Spark Imp** (electrical nuisance); **Iron Goblin** (mining goblin in improvised metal armor).
- **Boss:** **Boulderbelly** — massive stone creature with a glowing thunder crystal in its chest.
- **Signature location:** **Cracklepeak Mine**.
- **Other possible POIs:** Standing-Stone Circle; Broken Skybridge; Prospector Camp; Echo Cave.
- **Design hook:** Introduces chunkier silhouettes and the feeling of larger physical threats.

### Tier 3 — The Lost Realms

#### 07. Sunfall Expanse
- **Kingdom / type:** Suncrest Kingdom; desert and relic lands.
- **Theme and mood:** Golden dunes, sandstone arches, oases, lost temples, buried treasures.
- **Palette:** Warm gold, sand, terracotta, turquoise, jewel red.
- **Board kit:** Dune edges, scattered stone, oasis pools, obelisks, pillars, excavation sites, carved gates.
- **Side-view fight backdrop:** Hazy dunes and monumental temple fragments; clear warm ground at fighter level.
- **Monsters:** **Sand Skitter** (quick little desert bug); **Scarab Guard** (armored beetle sentry); **Dust Wraith** (swirling sand phantom); **Relic Mimic** (false treasure); **Sunstone Sentinel** (animated temple statue).
- **Boss:** **Pharaoh Solmar** — forgotten ruler awakened beneath the sands.
- **Signature location:** **The Tomb of Seven Suns**.
- **Other possible POIs:** Mirrored Oasis; Buried Caravan; Sun Dial Shrine; Collapsed Temple.
- **Design hook:** Rich treasure fantasy and clear silhouettes against bright sand.

#### 08. Frostveil Peaks
- **Kingdom / type:** Frostveil Kingdom; high snowy peaks.
- **Theme and mood:** Snow-covered pines, icy lakes, crystalline caverns, abandoned mountain strongholds.
- **Palette:** Pale ice blue, snow white, pine green, slate, lilac glints.
- **Board kit:** Snow drifts, frozen paths, clustered pines, rock faces, icicles, ice bridges, fort ruins.
- **Side-view fight backdrop:** Pale distant mountains and castle silhouette; strong darker fighter outlines must remain visible on snow.
- **Monsters:** **Snow Puff** (ball-like snow creature); **Icefang Wolf** (frost-touched predator); **Frost Spirit** (floating icy elemental); **Crystal Yeti** (stocky sparkling beast); **Frozen Knight** (enchanted armor).
- **Boss:** **Glaciorn** — ancient ice dragon sleeping within a glacier.
- **Signature location:** **The Shattered Ice Palace**.
- **Other possible POIs:** Aurora Shrine; Warmfire Outpost; Crystal Cave; Avalanche Pass.
- **Design hook:** Grand scale without losing crisp readability against a light environment.

#### 09. Thornhollow Wilds
- **Kingdom / type:** Unclaimed fae wilderness; ancient corrupted forest.
- **Theme and mood:** Twisting thorns, giant flowers, magical rot, strange shrines, dangerous beauty.
- **Palette:** Deep moss, thorn purple, luminous teal, mushroom orange, dark bark.
- **Board kit:** Thorn barricades, tangled vines, warped trees, glowing mushrooms, roots and shrine pieces.
- **Side-view fight backdrop:** Dense forest around the edges with a deliberately quiet central combat band.
- **Monsters:** **Thornling** (prickly seed creature); **Briar Wolf** (vine-covered wolf); **Rotcap** (corrupted mushroom); **Shadow Wisp** (dark flickering light); **Cursed Stag** (otherworldly deer).
- **Boss:** **The Briar Queen** — forgotten forest spirit controlling twisted nature.
- **Signature location:** **Heartroot Sanctuary**.
- **Other possible POIs:** Hollow Fae Ring; Rotwood Camp; Weeping Grove; Thorn Gate.
- **Design hook:** Darker emotional tone while preserving vivid magical accents.

### Tier 4 — The Legendary Kingdoms

#### 10. Starfall Dominion
- **Kingdom / type:** Moonspire-linked arcane ruins; unstable star magic.
- **Theme and mood:** Floating ruins, crystal observatories, strange geometry and falling celestial fragments.
- **Palette:** Deep purple, midnight blue, star gold, electric cyan, silver.
- **Board kit:** Arcane tile edges, floating crystal props, broken platforms, runic stones, observatory fragments. Graph connections remain visually unmistakable even when terrain appears floating.
- **Side-view fight backdrop:** Distant magical towers and slow, baked celestial motifs; strong combat silhouette contrast.
- **Monsters:** **Astral Wisp** (starfire spirit); **Spell Eater** (creature that consumes magic); **Rune Knight** (enchanted guardian); **Voidling** (small rift creature); **Arcane Construct** (living magical device).
- **Boss:** **Archmage Veyra** — sorceress attempting to rewrite reality.
- **Signature location:** **The Observatory of Lost Stars**.
- **Other possible POIs:** Shardfall Crater; Broken Rune Gate; Star Library; Astral Bridge.
- **Design hook:** Mysterious magic and visual spectacle, rendered cheaply with reusable props and baked effects.

#### 11. Embercrown Mountains
- **Kingdom / type:** Embercrown Range; volcanic dragonlands.
- **Theme and mood:** Black rock, luminous lava, ash clouds, dragon nests, ancient forges.
- **Palette:** Charcoal, ember orange, molten gold, crimson, copper.
- **Board kit:** Lava seams, obsidian boulders, basalt bridges, forge ruins, smoke stacks, dragon-bone landmarks.
- **Side-view fight backdrop:** Layered dark volcanoes and bright lava outside the fighter silhouettes; avoid excessive live particle effects.
- **Monsters:** **Emberling** (tiny spark beast); **Ash Drake** (small draconic flyer); **Magma Golem** (lava-infused stone); **Flamefang** (fire-adapted predator); **Obsidian Guardian** (dark stone defender).
- **Boss:** **Ignarox, the Crownfire Dragon** — colossal draconic guardian of the volcanic heights.
- **Signature location:** **The Dragon King's Forge**.
- **Other possible POIs:** Ashen Nest; Molten Bridge; Ember Shrine; Blackglass Quarry.
- **Design hook:** Epic late-game stakes with unmistakable silhouettes and strong dark/light contrast.

#### 12. The Shattered Crown
- **Kingdom / type:** Legendary broken royal realm between worlds.
- **Theme and mood:** Fragmented castles, floating royal halls, broken mirrors, rift portals and suspended ruins.
- **Palette:** Royal violet, pale gold, ivory stone, cyan rift glow, charcoal shadow.
- **Board kit:** Cracked marble roads, fallen crowns, floating debris, ruined arches, portal frames, fragmented throne pieces. Board connectivity must never be ambiguous.
- **Side-view fight backdrop:** Vast ruined throne hall and layered rift sky; minimal moving effects directly behind characters.
- **Monsters:** **Crownless Knight** (fallen royal warrior); **Royal Phantom** (ghostly courtier); **Mirror Beast** (reflective shapeshifter); **Celestial Sentinel** (ancient guard); **Rift Dragon** (realm-torn dragon).
- **Boss:** **The Hollow King** — former ruler whose broken crown shattered the realm.
- **Signature location:** **The Throne Beyond Time**.
- **Other possible POIs:** Hall of Mirrors; Broken Coronation Gate; Royal Vault; Rift Crossing.
- **Design hook:** Potential overarching mystery and legendary endgame setting; this lore connection is proposed, not canon.

## 5. Reusable monster families

Use related silhouettes, palettes and animation structures where useful, but don't make every higher-tier monster a simple recolor. Elite variants need an extra meaningful shape or prop.

| Family | Core | Related region variants | Shared production opportunity |
|---|---|---|---|
| Slimes | Jelly Slime | Honey Blob; potential Frost / Ember / Void Slimes (future suggestions, not part of the fixed 60) | Blob silhouette, squash, hit animations |
| Goblins | Moss Goblin | Corn Goblin; Marsh Goblin; Iron Goblin | Shared humanoid rig with distinct hats, armor and tools |
| Spirits | Lantern Wisp | River Sprite; Frost Spirit; Shadow Wisp; Astral Wisp | Hover motion and simple effect language |
| Mimics | Apple Mimic | Relic Mimic; potential Chest / Royal Mimics | Surprise-open action and deceptive item design |
| Golems | Pebble Golem | Magma Golem; Sunstone Sentinel; Obsidian Guardian | Heavy recoil, modular stone construction |
| Wolves / beasts | Icefang Wolf | Briar Wolf; Flamefang; Meadow Wolf as future suggestion | Shared quadruped movement with meaningful silhouettes |
| Living objects | Spellbound Doll | Scarecrow Scrapper; Frozen Knight; Rune Knight | Similar enchanted-object narrative, not necessarily same skeleton |

**Catalogue count:** 12 regions × 5 regular monster names = **60 regional monster entries**; 12 named bosses. Some entries share family concepts. This is a creative catalogue, **not** an immediate request for 72 unique atlases.

## 6. Points of interest and world events

The board uses spaces and connections; locations should be recognizable as **node decorations and encounter definitions**, not freeform explorable maps unless Miles chooses to build that system.

**Suggested POI types:**

- **Town:** services, recovery, upgrades or other functions only if supported by actual rules.
- **Dungeon entrance:** a named encounter chain or special board event (mechanics TBD).
- **Shrine:** short magical encounter or choice (mechanics TBD).
- **Merchant / caravan:** shopping or special offer (mechanics TBD).
- **Lair / boss site:** distinctive landmark linked to a boss encounter (rules TBD).
- **Landmark:** visual narrative without requiring a new rules system.

**Optional flavor event ideas** (not approved systems): a slime steals a crown; orchard fruit turns into mimics; a bridge demands a ridiculous toll; a moonlit witch swaps a traveler's voice; storm crystals awaken stone guardians; a lake bell rings from underwater; a relic opens the wrong tomb; a frozen statue speaks; the fae rearrange signposts; a falling star awakens old machinery; a dragon nest is actually an abandoned forge; a royal mirror repeats a player's last boast.

Each region instance need not host its named signature location. Use regional weighted or conditional POI selections only after game design decides encounter logic.

## 7. Art handoff and phone-first rules

Mitch, AD should use each region entry as a **brief for a reusable art kit**, not a single painted map. The specifics follow his `CLAUDE.md` and `docs/direction.md`.

- **Board:** raised-camera 2D ground kit; repeated tiles/strips, clear space connections, isolated landmarks and props. Tile/repeat tests should include a 3×3 arrangement, with varied prop placements.
- **Fight:** separate side-view layered battle scene, not a crop of the board; foreground fighters saturated and edged, distant planes softer and less detailed.
- **Monsters/characters:** fixed designs with frame data; do not independently AI-redraw every animation frame. Agree one still at real phone size before animation. Reuse approved artwork/parts for pose consistency.
- **Phone review:** composite a fighter, one monster, board/ground and **actual game chrome** at about **412 × 915** before approving the visual language. Review real atlas playback at recorded frame delays; a still sprite sheet alone is insufficient.
- **Delivery:** art studio `out/<name>/` including artwork, origin/delay/hitbox/head or layer metadata, phone preview, moving animation preview where applicable, and `NOTES.md`. Miles integrates into the game's asset folder.
- **Performance:** target the existing atlas/file budgets in `docs/state/art.md`; clean alpha, hard readable edges, trimmed frames, palette optimization when appropriate; few atlases and baked effects. Do not invent a universal 400 KB limit; read the current per-asset budget.

### Visual distinctness targets

Each region should be identifiable from (a) its dominant terrain color, (b) one characteristic prop silhouette, and (c) a representative monster. At mobile scale, board nodes and path connections outrank decorative beauty.

## 8. Implementation data model — illustrative only

The schema below is a *possible content representation*, not a replacement for the existing game's data formats or seeded generation logic. Map to current modules rather than creating a competing system.

```ts
// Illustration — adapt field names and types to the existing code.
type RegionContent = {
  id: string;                 // stable identifier, e.g. "cloverfield_meadows"
  label: string;              // visible name
  territoryId: string;        // e.g. "verdant"
  tierHint: 1 | 2 | 3 | 4;    // content tagging, NOT automatic stats
  difficultyBandHint: [number, number];
  boardKitId: string;         // asset supplied by Mitch, AD
  fightBackdropId: string;   // side-view layer kit
  monsterIds: string[];      // content pool, not guaranteed spawns
  bossId: string;
  signaturePoiId: string;
  optionalPoiIds: string[];
};
```

Implementation principles:

1. **Stable IDs** are separate from display names; renames must not break saves.
2. Use existing seeded RNG and world-graph generation for selection; never use unseeded rendering logic to choose gameplay content.
3. Put only rule-relevant, changing state in server snapshots/deltas. Keep static region assets and definitions client-side where compatible with the current architecture.
4. Assign each generated region instance a stable instance identity; `cloverfield_meadows` is an *archetype*, not a unique map coordinate.
5. Avoid hard-coding all 12 regions as a scripted route. Allow biome and difficulty constraints to choose valid archetypes.
6. Track POI mechanics, combat stats, drops and boss spawning as **TBD** until Miles and Robin approve them.
7. Preserve multiplayer intent/state ownership. Content decisions must not bypass existing rules or server authority.

## 9. Build order — content slices, not all-at-once production

**Slice A: Prove the loop** — Cloverfield Meadows with Puddlewick Village, Jelly Slime, Grumpy Sprout, Meadow Bandit, King Goo, one boss landmark, one functional town node, one ground kit and one side-view fight backdrop. Use the game’s already-supported fight/actions and node mechanics; avoid inventing new gameplay systems merely to showcase art.

**Slice B: Test biome variation** — Wobblewood Forest with a distinct woodland board kit, one or two monsters and a recognizable landmark. Verify that generated region adjacency, map clarity and visual style hold on phone.

**Slice C: Test a second palette and combat backdrop** — Moonwhisper Woods or Glimmerlake Shores; add one magic-themed enemy, validate contrast, loading and atlas reuse.

**Slice D: Extend the catalogue** — Populate other tier-one and tier-two areas, then advanced and legendary territories as the actual game loop warrants.

**Gate before bulk work:** Robin approves a single phone-size hero + monster + board + chrome still. Mitch establishes approved master art and a repeatable animation pipeline. Only then commission numerous creature atlases.

## 10. Decisions to confirm with Robin

These are open creative or product questions, **not blockers to drafting**:

- Are the proposed names for all 12 regions, 12 bosses, and towns acceptable?
- Should the four named kingdoms (Verdant, Moonspire, Suncrest, Frostveil) be explicitly political factions, purely biome identities, or both?
- Should the Thornhollow Wilds be a fifth major territory?
- Is The Hollow King intended as an overarching villain, or merely one optional legendary boss?
- What is the approved player height, visual scale, and camera composition at phone size? Prior guidance notes that an old 100 CSS px proposal was not final and a 118 px example had appeal.
- Which exact game systems do towns, shrines, dungeons and bosses support in the first playable build?

When a decision is approved, update the project brief/appropriate game documentation using the project's owner-and-date convention, replacing proposals rather than treating this file as final canon.

## 11. Compact index

| # | Region | Tier | Named boss | Signature POI |
|---|---|---|---|---|
| 01 | Cloverfield Meadows | 1 | King Goo | Puddlewick Village |
| 02 | Wobblewood Forest | 1 | Grumblebark | The Upside-Down Tree |
| 03 | Honeyhill Fields | 1 | Queen Bumble | Goldencomb Farm |
| 04 | Glimmerlake Shores | 2 | Lord Ripplefin | The Sunken Bell Tower |
| 05 | Moonwhisper Woods | 2 | Lady Nightbloom | The Witchlight Cottage |
| 06 | Thunderstone Highlands | 2 | Boulderbelly | Cracklepeak Mine |
| 07 | Sunfall Expanse | 3 | Pharaoh Solmar | The Tomb of Seven Suns |
| 08 | Frostveil Peaks | 3 | Glaciorn | The Shattered Ice Palace |
| 09 | Thornhollow Wilds | 3 | The Briar Queen | Heartroot Sanctuary |
| 10 | Starfall Dominion | 4 | Archmage Veyra | The Observatory of Lost Stars |
| 11 | Embercrown Mountains | 4 | Ignarox, the Crownfire Dragon | The Dragon King's Forge |
| 12 | The Shattered Crown | 4 | The Hollow King | The Throne Beyond Time |
