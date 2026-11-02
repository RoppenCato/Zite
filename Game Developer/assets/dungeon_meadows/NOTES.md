# The Rootways: the Meadows dungeon

Mitch, AD, 2026-11-02, for Miles, GD. Robin: "You enter them and walk around and theres a boss at the end." Look, names and creatures are all mine; Robin has not judged them.

**The idea:** under the Meadows, a tangle of tunnels and root-filled caves. Lit by glowing mushrooms, with daylight behind you at the way out. At the far end sits Old Rootbeard, a huge old turnip and the great-grandfather of the Grumpy Sprouts.

**Pictures:** `whole.jpg` is the whole dungeon. `inside.jpg` and `inside2.jpg` are six places at phone size. `door_outside.jpg` is the door on the map. `creatures.jpg` is the two new creatures. `fight/matchups.jpg` and `fight/screen.jpg` are the fight. All are mock-ups from the delivered files. Not seen in the game or on a phone.

## 1. The door on the map

**The spot is `lookout` (1299,5749), my pick.** The road comes in from below, so there is room behind it, and a cave behind the bandits' camp suits it. Make `lookout` `kind: "door"` and rename it `The Rootways`.

- **Sprite:** `door_rootways` from `rootways_places`, origin at the gate, at **1299,5679**, scale 0.5, `standingDepth(5679)`.
- **Plate:** `spot_door`, on the spot, for both this door and the one inside.
- **Remove from the Meadows' placement:** the 12 `stake` pieces listed under `door.remove` in `rootways.json`. They stand behind the mound.

## 2. The inside

Your box suits it. **The bounds are x 4096 to 7168, y 8192 to 9216**, three chunks in row 8, with the spots inside your box.

- **Chunks:** `chunks.json`, `rootways_4_8.jpg`, `rootways_5_8.jpg`, `rootways_6_8.jpg`, 150 KB in all. They sit on the same grid squares as the Forest's sea chunks, `ground_4_8` to `ground_6_8`. Show only these while inside, and only the Forest's outside.
- **Camera (you need this):** clamp it to `bounds` while inside, and keep it above your chunk zoom, because the overview picture knows nothing of this place. A phone at zoom 0.8 sees 515 by 800 world px, so it fits. Anything past the bounds is `fill` `#1c1620`.
- **Roads:** stroke them as usual, with `roadColours` from `rootways.json`.
- **Placement:** `placement.json`, 22 sprites from `rootways_places`, drawn at 0.5, sorted by y.
- **Boss sprite:** `mob_rootbeard` carries `hub: "rw-throne"`. Hide it when he is beaten, if you like.
- **Plates:** the rest use `board_meadows/board_props`: `spot_wild`, `spot_spring`, `spot_chest`, `spot_gate`.

## 3. The layout

`rootways.json` holds `area` in the form of `world.json`, 7 hubs and 7 roads, 14 spots in all. No two spots are under 78 px apart, and all stand on the floor.

- **Area:** id `rootways`, name `The Rootways`, levels 3 to 5, tier 1, theme `dungeon` (mine; your kit has no such theme yet).
- **Hubs:**

| Hub | Kind | Name |
| --- | --- | --- |
| `rw-door` | `door` | The Way Out |
| `rw-fork` | `normal` | The Forking Burrow |
| `rw-pool` | `potion` | The Glowing Pool |
| `rw-low` | `normal` | The Sprout Burrow |
| `rw-stash` | `chest` | The Forgotten Stash |
| `rw-join` | `normal` | The Hollow Crossing |
| `rw-throne` | `boss`, `boss: "old-rootbeard"` | Old Rootbeard's Hollow |

- **Forks:** at `rw-fork`, up past the pool or down through the burrow. At `rw-low`, on to the crossing or aside to the chest. Both ways meet at `rw-join`, then one road to the boss.
- **Grounds:** `sprout-burrow` with `wolf` (Grumpy Sprout) and `glowing-pool` with `glowcap`. `places` is empty, so give a road spot its ground however suits you.
- **Spacing:** 200, not the regions' 138, to keep to your 14 spots.

## 4. The fight backdrop

`fight/`, in the regions' form. Keep `groundY` 490, `stripY` 640, `heroX` 66, `enemyX` 318.

`sky: { top: 0x1c1826, bottom: 0x3c3248 }`, `soil: 0x8a7058`, `feet: 46`.

| Strip | File | Design w by h | bottom | scroll | drift | tileScale |
| --- | --- | --- | --- | --- | --- | --- |
| far | `far.png` | 512 by 400 | 10 | 0.15 | 0 | 1 |
| motes | `motes.png` | 512 by 283 | -20 | 0.3 | 3 | 1 |
| mid | `mid.png` | 512 by 400 | 10 | 0.45 | 0 | default (0.5) |
| near | `near.png` | 512 by 410 | 10 | 0.8 | 0 | default (0.5) |
| ground | `ground.png` | 512 by 200 | 150 | 1 | 0 | default (0.5) |

Copy the five PNGs. The strips are 512 wide and composed for x 0 to 412. They take about 9 MB in memory, like the others.

## 5. The creatures

`creatures/`, one folder each. Files face left, pivot at the feet.

| Enemy id, new | Name | Folder | Scale | Blow frame | Height (CSS px) | Frames |
| --- | --- | --- | --- | --- | --- | --- |
| `glowcap` | Glowcap | `glowcap` | 0.5714 | 7 | 120 | 33 |
| `old-rootbeard` | Old Rootbeard | `old_rootbeard` | **1.2** | 5 | 300 | 20 |

- **The adds:** the Meadows' own Grumpy Sprout (`wolf`) and one new creature, the Glowcap. I added it because mushrooms light this place, so it should fight here too.
- **Old Rootbeard's scale:** the atlas's own number is 1.3333, which makes him 330 tall, and `fight/matchups.jpg` shows him at that size. There his right side passes the 412 column's edge, so use 1.2. I have not seen him at 1.2.
- **The clips:** Glowcap: stand 6, move 6, attack1 12, hit1 1, die1 8. Old Rootbeard: stand 3, move 3, attack1 8, hit1 1, die1 5. He raises the staff on frames 2 and 3 and slams it on 5, with stones flying.
- **Moves, if you want names:** Glowcap: Spore Puff (its cap lifts and a spore cloud comes out on the blow). Old Rootbeard: Staff Slam, and Root Snare, which is not drawn yet.
- **No second phase.** One atlas each. Say if he needs one, as Queen Bumble has.
- **Stats** are yours.

## 6. The way out

Baked into the ground at `rw-door`: a stone arch with steps going up and daylight, and a sunbeam on the floor. No piece to draw.

## Not tested

Not in the game or on a phone. The fight effects have not been checked over this backdrop. A tall tree or a tent could stand in front of the door from some camera positions: I looked only from the one in `door_outside.jpg`.

Tools: `tools/world/rootways_build.js`, `tools/world/rootways_art.js`, `tools/kit/rootways_battle.js`, `tools/monsters/rootways.js`.
