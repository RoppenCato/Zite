# Board World Game – Project Brief

*Working title: TBD. Concept captured 2026-10-31.*

## Pitch
A co-op MMO-lite set in a classic fantasy world shaped like one giant Dokapon Kingdom-style board. Players drop in whenever they want, roll a die, move, and resolve the space they land on (battle, shop, event, boss…). The community fights the world together, not each other. The signature feature: **players who meet in real life can link up** and fight together live.

## Pillars
1. **Board-game exploration** – random dice movement across a huge shared world.
2. **Co-op, not PvP** – the world is the enemy; progress is shared.
3. **Check in whenever** – no timers, no energy, no punishment for being away.
4. **Proximity play** – meeting IRL unlocks joint battles and combos.
5. **Phone + browser** – one codebase, 2D, a MapleStory-like look. Fast and snappy above all: simple graphics so nothing ever lags (Robin, 2026-10-31).
6. **A forever game** – the world is big and generated, never finished (Robin, 2026-10-31).

## Core loop
- Open the app → roll the die → move → resolve the space → repeat or close.
- **Unlimited rolls.** No timed or rationed dice. The limitation is that the number is random – you can't choose it.
- Movement is **always independent**; players never move as a group.
- Progress goes to both the character (level, gear) and the world (region/town state).

### Space types (initial)
Battle, shop, town, event, treasure, quest giver, boss gate, shrine.

### Dice cards
Items that manipulate the roll, found or bought: *Reroll*, *+1 / −1*, *Exactly N*, etc. They add a tactical layer on top of the randomness.

### Progression gating
Since dice are unlimited, pacing comes from the world:
- Boss gates that require a level or item
- Regions that open only once the community has liberated them
- Danger that increases further from the start area

### Death
Sent back to the nearest town, lose a share of gold (e.g. 20%). Gear is kept.

## The world
- A big, beautiful world map: the thing the player looks at most.
- Generated, and big enough never to run out. Each area of the map has its own look and its own fight background (Robin, 2026-10-31).

## The look
- **The art follows the MapleStory reference library** at `C:\dev\MapleStoryPlus\Settings\Inspiration` and its `Instructions.md` (Robin, 2026-10-31): painted, cute and chunky, dark outlines, layered parallax backgrounds, tile and prop kits, monsters as named actions with frame data. We learn from it and make our own; nothing from it is ever copied into the game or committed (both repositories are public). The Art Director's `docs/direction.md` is the direction drawn from it.
- Open: whether the world itself is a side-view MapleStory-like place with the board's spaces along its ground, or a top-down map with side-view fights (the Art Director recommends the first).

## Combat
- Turn-based RPG combat, not Dokapon's rock-paper-scissors (Robin, 2026-10-31): you choose among attacks, spells and defending; stats such as attack, defense and health decide the outcome.
- Must be playable with one thumb on a phone: the play is making choices (buttons, or gestures).

### Classes – everyone is DPS, different playstyles
| Class | Style |
|---|---|
| Warrior | Steady, high base damage, tough |
| Rogue | Low base damage, chains crits |
| Mage | Charges for a turn, then a huge hit |
| Ranger | Strikes first, multiple small hits |

**You choose your class when you create your character. Each class has its own skills and spells, and the classes must feel different to play** (Robin, 2026-10-31); what each one's moves are is open question 5. **Cross-class combos** (only in group battles) reward playing with people of other classes, e.g. Mage charges + Warrior holds the line = guaranteed big hit.

## Co-op layer
- **Town liberation:** occupied towns have shared HP; every player who fights there contributes. Freed towns unlock shops and routes for everyone.
- **World bosses:** shared HP with a time window (e.g. 48 h).
- **Gathering points:** bosses/liberations can be joined by anyone standing on or next to the space – or by anyone IRL-linked to a player who is there.
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
- **Server required** for the shared world (positions, inventories, town/boss HP). Mostly asynchronous; only proximity battles need real-time.
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
3. Shared world: town liberation, world boss
4. Proximity linking (GPS + QR) and live joint battles
5. Real-world flavor (weather/time)

## Open questions
1. **Loot:** Dokapon-like (few clear items) or Diablo-like (random stats, rarity colors)?
2. **Boss battles when not physically together:** live (everyone online at once) or async (turns within a time window)?
3. **Long-term goal:** max level, a story to finish, or seasons where the world resets?
4. **Board size/sharding:** one global board, or regional shards so it doesn't feel empty?
5. The move set (attacks, spells, defend) and how class abilities fit into it.
6. Working title.
