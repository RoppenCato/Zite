# Zite – Project Brief

*Working title: Zite (Robin, 2026-10-31). Concept captured 2026-10-31.*

## Pitch
A co-op MMO-lite set in a classic fantasy world laid out as one giant board, the way Dokapon Kingdom's is: **one big connected map with many paths, where the die gives you the choice of where to go** (Robin, 2026-10-31). Players drop in whenever they want, roll a die, move, and resolve the spot they land on (a fight, a shop, a chest, a boss…). The community fights the world together, not each other. The signature feature: **players who meet in real life can link up** and fight together live.

## Pillars
1. **Board-game exploration** – random dice movement across a huge shared world.
2. **Co-op, not PvP** – the world is the enemy. An MMO-lite: go around, kill mobs, get better, kill bosses, get further (Robin, 2026-10-31).
3. **Check in whenever** – no timers, no energy, no punishment for being away.
4. **Proximity play** – meeting IRL unlocks joint battles and combos.
5. **Phone + browser** – one codebase, 2D, a MapleStory-like look. Fast and snappy above all: simple graphics so nothing ever lags (Robin, 2026-10-31).
6. **A forever game** – the world is big and generated, never finished (Robin, 2026-10-31).

## Core loop
- Open the app → roll the die → move → resolve the space → repeat or close.
- **Unlimited rolls.** No timed or rationed dice. The limitation is that the number is random – you can't choose it.
- Movement is **always independent**; players never move as a group.
- Progress goes to the character (level, gear, abilities) and to the areas opened by beating their bosses.

### Spots (Robin, 2026-10-31)
- **Normal spots** are most of the map: you fight level-fitting mobs of that area. **Mobs live in their own parts of the map**, so you always know what you are going after. A normal spot also has a chance of something else: a chest to open, a wandering merchant, a mini-boss, a gambling event.
- **Special spots**: a treasure chest, a potion spot, a spells spot.
- **Towns** (rest, errands) and **shops**, which sell the basic weapons and armour of their area's tier.
- **Boss spots** at the passage into the next area (see Progression gating).
- **Random mini-bosses and other events spawn on random normal spots from time to time.**
- **Touching a spot gives hints** on what you could meet (level range, loot), but not everything: plenty of surprise.

### Dice cards
Items that manipulate the roll, found or bought: *Reroll*, *+1 / −1*, *Exactly N*, etc. They add a tactical layer on top of the randomness.

### Progression gating
Since dice are unlimited, pacing comes from the world (Robin, 2026-10-31):
- **Areas are ordered by tier** outward from the start; the danger grows with the tier.
- **Bosses are the gates to new areas.** A boss stands on the spot that leads into the next area and **is seen on the board**. Nothing gates it but your power: too low a level and too poor gear, and the fight is simply too hard. **Land exactly on the boss** to fight it; once it is dead, that part of the map opens.
- **Bosses can be killed again**: a boss is back **5 minutes** after it died. **Bosses drop the good things** (uniques, nothing under epic), not better loot for killing the same boss again.
- **No town liberation** (Dokapon's): the world is beaten through its mobs and bosses.

### Death
Sent back to the nearest town, a fifth of the gold lost, gear kept (Robin, 2026-10-31).

## The world
- A big, beautiful world map: the thing the player looks at most.
- **No islands, no water. One big map like Breath of the Wild's**: different areas with different themes (meadow, forest, ice, fire, water, …), **ordered by tier** outward from the start (Robin, 2026-10-31).
- **One connected board with many paths**, forks every few spots, so the die gives a choice of where to go (Robin, 2026-10-31). Spaces and connections, never a grid.
- Generated, and big enough never to run out. Each area of the map has its own look and its own fight background (Robin, 2026-10-31).

## The look
- **The theme is Enchanted Kingdoms** (Robin, 2026-11-01): a cheerful fantasy world of rival kingdoms, mischievous creatures, magical treasures and strange places, charming before grim, growing mysterious and more dangerous the farther you travel. **The world itself is called Zite**, as the game is. The content is the Game Developer's `docs/world-content.md` (twelve region archetypes with their creatures, bosses and places; Robin, 2026-11-01: the names as written, one archetype per tier in the catalogue's order, Cloverfield Meadows first).
- **A new look and theme** (Robin, 2026-11-01): the art direction of 2026-10-31 (the MapleStory-referenced painted look) is scrapped with everything drawn under it; the art starts again from the Art Director's `CLAUDE.md` and `docs/direction.md`. The shell stays: the board from a raised camera, side-view fights, areas as kits of data, the Game Developer's budgets and atlas form.
- **Mitch, AD is the Art Director; no reference pictures carry over** (Robin, 2026-11-01): Perry, AD handed over to Mitch, AD; the MapleStory reference library is not used, not even for structure, and the three example pictures given on 2026-11-01 are not used either. The look comes from Robin, asked with pictures. Sound has not been worked on yet.
- **The board is seen from a raised camera, in 2D** (Robin, 2026-10-31, after showing a Dokapon Kingdom board): a tilted ground with cliff faces where the land steps up; roads, rivers and the spaces flat on it; everything standing on it upright, sorted by depth. **Fights are their own screen**, 2D, outside the map: an instanced scene of where you are, in the area's look (Robin, 2026-10-31).

## Combat
- Turn-based RPG combat, not Dokapon's rock-paper-scissors (Robin, 2026-10-31): a round is **attacking normally, using an item, casting a spell or ability, or charging**, and **a defensive choice before the enemy attacks** (different kinds); stats such as attack, defense and health decide the outcome.
- **Anyone can charge** for a bigger attack next turn. **Mana for everyone** is the resource for abilities (Robin, 2026-10-31).
- **Classes have basic abilities that fit their style**, different enough that the play differs; **more skills and higher ranks are bought, found or earned** as you go. The abilities should be fun and make the classes feel different and exciting, not only bigger numbers (Robin, 2026-10-31).
- Must be playable with one thumb on a phone: the play is making choices (buttons, or gestures).

### Classes – everyone is DPS, different playstyles
| Class | Style |
|---|---|
| Warrior | Steady, high base damage, tough |
| Rogue | Low base damage, chains crits |
| Mage | Charges for a turn, then a huge hit |
| Ranger | Strikes first, multiple small hits |

**You choose your class when you create your character. Each class has its own skills and spells, and the classes must feel different to play** (Robin, 2026-10-31); the first kits are built (the Game Developer's, 2026-10-31) and whether they feel right is open question 4. **Cross-class combos** (only in group battles) reward playing with people of other classes, e.g. Mage charges + Warrior holds the line = guaranteed big hit.

## Gear and loot (Robin, 2026-10-31)
- **Gear is randomized and tiered** like WoW's or Diablo's: common, uncommon, rare, epic, legendary. **Every piece has a rank by level** (copper sword, iron sword, …), and you can find **a named version** ("Stormborn", an iron sword with a special effect) that feels special.
- **Equipment slots: weapon, armour, helm, boots, trinket.**
- **A simple inventory**: keep the weapons and armour you found and switch to whatever you want; a bag for potions and the like.
- **Make the loot interesting**: unique weapons and trinkets whose effects change how you play, each in its own way. Bosses drop them.

## Co-op layer
- **World bosses:** shared HP with a time window (e.g. 48 h). (Town liberation is out: Robin, 2026-10-31.)
- **Gathering points:** bosses can be joined by anyone standing on or next to the space – or by anyone IRL-linked to a player who is there.
- **Traces:** players can leave items or warnings on spaces for others.
- **Guilds:** shared home town that members upgrade together (idea, not decided).

## Proximity (IRL linking)
- **GPS = discovery.** While the app is open, the server checks player distance (e.g. < 100 m) and suggests "X is nearby – link up?". Exact positions are never shown to other players, only "nearby". Opt-in.
- **QR = confirmation.** One player shows a QR with a one-off token (expires ~60 s); the other scans it. The server sees both used the same token → linked. Prevents screenshot cheating and GPS spoofing; also works with location off.
- **Link lifetime:** while both apps are open and GPS says still close, or a fixed time (e.g. 30 min) after the scan.
- **What a link gives:**
  - Join each other's battles/bosses from anywhere on the board
  - Live joint battles with cross-class combo attacks
  - Possible extras: "camp" bonus aura, IRL-only trading and friendly duels (ideas, not decided)

## Real-world flavor (light, optional)
- Real weather and time of day affect monsters on the board (e.g. rain → water monsters, night → undead).
- Later idea: real places (OpenStreetMap) as shrines giving dice cards when visited.

## Tech direction
- **PWA** (Phaser or plain canvas) – runs in browser, installable on phones. Optionally wrap with **Capacitor** later for app stores / native features.
- **HTTPS is required** for GPS and camera (QR scanning) in browsers.
- **Server required** for the shared world (positions, inventories, boss HP). Mostly asynchronous; only proximity battles need real-time.
- Hosting path:
  1. Develop locally
  2. Test with friends via home PC + **Cloudflare Tunnel** (free HTTPS, no port forwarding, works behind CGNAT; PC must stay on)
  3. Later, if it grows or the PC should no longer stay on: a cheap VPS (e.g. Hetzner ~€4–5/mo) or Cloudflare Durable Objects; **Supabase** for DB + auth if wanted (its realtime is not a game server: see the Game Developer's `docs/coop-research.md`)
- **The server runs on Robin's PC, which stays on, with the option of moving it later** (Robin, 2026-10-31).
- **Android first, iOS later** (Robin, 2026-10-31: "if it's easier we can do Android only to start"; it is: Chrome has the install prompt, native QR scanning, push and no storage eviction). The browser version works everywhere meanwhile.

## Suggested MVP order
Playable alone first, with co-op designed in from the start; if building co-op straight away turns out easier, do that (Robin, 2026-10-31).

1. Single-player board + movement + battle in the browser
2. Persistence + accounts (server)
3. Shared world: world boss, traces, who is here
4. Proximity linking (GPS + QR) and live joint battles
5. Real-world flavor (weather/time)

## Open questions
1. **Boss battles when not physically together:** live (everyone online at once) or async (turns within a time window)? A world boss with shared HP and a window exists since 2026-11-01; whether that is the form is open.
2. **Long-term goal:** max level, a story to finish, or seasons where the world resets?
3. **Board size/sharding:** one global board, or regional shards so it doesn't feel empty?
4. **The class kits:** the first moves and abilities per class are built (the Game Developer's, 2026-10-31); do they feel different enough, and right?
5. **Does an area open for everyone once anyone beats its boss, or for each player on their own?** (Today: each player's own.)

Decided on 2026-10-31 and moved up: the loot (Gear and loot), the working title (Zite), the form of the fight (Combat).
