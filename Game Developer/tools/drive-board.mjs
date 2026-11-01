// Drives the built game headless at phone size (412 by 915, touch) and checks it end to end: the character screen,
// the camera over the world (follow, overview of what is open, framing a roll, drag, pinch, wheel, hub names by zoom),
// a hint on a tapped spot, the closed areas and the bosses on the board, a reload mid-choice, an old save, landings,
// the world growing past Queen Bumble's Hive,
// a fight (two taps a round, a reload mid-fight, Continue), the shop and the bag, a dice card, a potion in a fight,
// and a reset. Screenshots land in tools/out/shots/.
//
//   npm run build && npm run preview &      (or npm run dev, then pass http://localhost:5173/)
//   node tools/drive-board.mjs [url]
//
// Needs Chromium through Playwright: the cloud sessions have it installed globally; locally `npm i -D playwright` and
// `npx playwright install chromium` once. Exits 1 when a check fails. It clears the page's save first and plants saves
// of its own: run it against a pane, never against Robin's phone.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const OUT = fileURLToPath(new URL('./out/shots/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const PAGE = process.argv[2] ?? 'http://localhost:4173/';
const HUD_H = 100; // layout.ts HUD_HEIGHT
const BAND_H = 640; // layout.ts VIEW_HEIGHT
const STATE_VERSION = 10; // rules/src/types.ts
const B = { map: [60, 836], world: [158, 836], bag: [256, 836], log: [354, 836], roll: [206, 884] }; // HudScene BUTTONS
const F = { a: [110, 800], b: [302, 800], c: [110, 842], d: [302, 842], e: [110, 884], f: [302, 884], cont: [206, 842] }; // FightScene FIGHT_BUTTONS
const SHOP = { row: (i) => 222 + i * 40, buyX: 356, leave: [206, 706], tabSell: [272, 178] }; // ShopScene SHOP_LAYOUT: five slots, then potion, mana potion, reroll, +1, -1, exact
const BAG = { close: [364, 126], wearX: 364, carriedY: 456 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };

const browser = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id ?? 0 })) });
const tapAt = async (x, y) => { await touch('touchStart', [{ x, y }]); await sleep(40); await touch('touchEnd', []); await sleep(60); };
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const ev = (fn, arg) => page.evaluate(fn, arg);
const scene = (key) => `boardWorld.phaser.scene.getScene('${key}')`;
const cam = () => ev(() => {
  const s = boardWorld.phaser.scene.getScene('board');
  const c = s.cameras.main;
  const hud = boardWorld.phaser.scene.getScene('hud');
  return { zoom: +c.zoom.toFixed(3), scrollX: Math.round(c.scrollX), scrollY: Math.round(c.scrollY), wv: { x: Math.round(c.worldView.x), y: Math.round(c.worldView.y), w: Math.round(c.worldView.width), h: Math.round(c.worldView.height) }, following: s.following, choices: s.choices ? [...s.choices.keys()] : null, token: { x: Math.round(s.token.x), y: Math.round(s.token.y) }, me: boardWorld.game.me.space, steps: boardWorld.game.me.steps, mapLabel: hud.mapLabel.text, message: hud.message.text, renderer: boardWorld.phaser.renderer.type, board: { w: boardWorld.game.state.board.width, h: boardWorld.game.state.board.height } };
});
const worldToScreen = async (wx, wy) => { const c = await cam(); return { x: (wx - c.wv.x) * c.zoom, y: HUD_H + (wy - c.wv.y) * c.zoom }; };
const settle = async () => { let last = ''; for (let i = 0; i < 40; i++) { await sleep(150); const now = JSON.stringify(await cam()); if (now === last) return; last = now; } };
const clampedCentre = (c, target) => { const dw = 412 / c.zoom, dh = BAND_H / c.zoom; return { x: dw >= c.board.w ? c.board.w / 2 : Math.min(Math.max(target.x, dw / 2), c.board.w - dw / 2), y: dh >= c.board.h ? c.board.h / 2 : Math.min(Math.max(target.y, dh / 2), c.board.h - dh / 2) }; };
const centredOn = (c, target, tol = 3) => { const e = clampedCentre(c, target); return Math.abs(c.wv.x + c.wv.w / 2 - e.x) < tol && Math.abs(c.wv.y + c.wv.h / 2 - e.y) < tol; };
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const ready = async () => { await page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.getScene('hud')?.message?.text, null, { timeout: 15000 }); await sleep(600); };
const inFight = () => ev(() => !!boardWorld.game.me.fight);
const fightBusy = () => page.waitForFunction(() => !boardWorld.phaser.scene.getScene('fight').busy, null, { timeout: 15000 });
/** One round: Attack, then Block. */
const attackRound = async () => { await tapAt(...F.a); await sleep(150); await tapAt(...F.a); await sleep(100); await fightBusy(); await sleep(100); };
/** Attack until a fight that opened is over, then Continue; nothing when there is none. Returns the rounds it took. */
const finishFight = async () => {
  let rounds = 0;
  if (!(await inFight())) return 0;
  await page.waitForFunction(() => boardWorld.phaser.scene.isActive('fight') && !boardWorld.phaser.scene.getScene('fight').busy, null, { timeout: 15000 });
  await sleep(300);
  while (rounds < 25 && (await inFight())) { await attackRound(); rounds++; }
  await tapAt(...F.cont);
  await sleep(400);
  return rounds;
};
/** Whatever a landing opened or asked, close it so the board is free again. */
const clearTheWay = async () => {
  await finishFight();
  if (await ev(() => boardWorld.phaser.scene.isActive('shop'))) { await tapAt(...SHOP.leave); await sleep(300); }
  if (await ev(() => !!boardWorld.game.me.offer)) { await ev(() => boardWorld.phaser.scene.getScene('board').answerGamble('pass')); await sleep(200); }
};
/** Of the lit choices, the first whose kind is in `prefer`, else the first; null when there is no choice. */
const pickChoice = async (prefer) => {
  const c = await cam();
  if (!c.choices) return null;
  const kinds = await ev((ids) => ids.map((id) => boardWorld.game.state.board.spaces[id].kind), c.choices);
  const i = kinds.findIndex((k) => prefer.includes(k));
  return c.choices[i < 0 ? 0 : i];
};
const frameChoice = async (id) => { await ev((id) => { const s = boardWorld.phaser.scene.getScene('board'); s.frame([s.token, boardWorld.game.state.board.spaces[id]]); }, id); await settle(); };
const tapSpace = async (id, spaces) => { const p = await worldToScreen(spaces[id].x, spaces[id].y); await tapAt(p.x, p.y); };

await page.goto(PAGE);
await ev(() => localStorage.clear());
await page.reload();
// No save: the character screen. Type a name, pick the Wizard, Begin.
await page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.isActive('create'), null, { timeout: 15000 });
await sleep(400);
const createShown = await ev(() => ({ create: boardWorld.phaser.scene.isActive('create'), game: boardWorld.game, input: document.querySelector('#game input')?.value }));
check('no save: the character screen comes first, the name field filled with the default', createShown.create && createShown.game === null && createShown.input === 'Robin', JSON.stringify(createShown));
await shot('0-character-screen');
await page.fill('#game input', 'Driver');
await tapAt(206, 536); // the third card: Wizard
await tapAt(206, 812); // Begin
await ready();
const created = await ev(() => ({ create: boardWorld.phaser.scene.isActive('create'), name: boardWorld.game?.me.name, classId: boardWorld.game?.me.classId, space: boardWorld.game?.me.space, header: boardWorld.phaser.scene.getScene('hud').name.text, opened: boardWorld.game?.me.opened }));
check('Begin makes the character and starts the board: Driver the Wizard on Puddlewick Village, the meadows open', !created.create && created.name === 'Driver' && created.classId === 'mage' && created.space === 'ashford' && created.header === 'Driver the Mage' && JSON.stringify(created.opened) === '["meadows"]', JSON.stringify(created));
await page.reload();
await ready();
const kept = await ev(() => ({ create: boardWorld.phaser.scene.isActive('create'), name: boardWorld.game?.me.name }));
check('a reload with a save skips the character screen', !kept.create && kept.name === 'Driver', JSON.stringify(kept));

let c = await cam();
console.log('start', JSON.stringify(c));
check('follow zoom 0.8 at start, following', c.zoom === 0.8 && c.following === true && c.mapLabel === 'Map', JSON.stringify(c));
check('token centred in the band (as far as the bounds allow)', centredOn(c, c.token), `view centre ${c.wv.x + c.wv.w / 2},${c.wv.y + c.wv.h / 2} token ${c.token.x},${c.token.y}`);
await shot('1-start-follow');

// The world: three areas, two covered, three bosses on the board with their labels.
const world = await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); return { covers: [...s.covers.entries()].map(([a, r]) => [a, r.visible]), bosses: [...s.bossLabels.entries()].map(([id, t]) => [id, t.text]), spawns: s.spawnMarks.size }; });
check('closed areas are covered, the open one is not; the three bosses stand on the board with their levels', JSON.stringify(world.covers) === '[["meadows",false],["thornwood",true],["frostpeak",true]]' && world.bosses.length === 3 && world.bosses.every(([, t]) => /level \d+/.test(t)), JSON.stringify(world));

// Overview and back: the overview frames what is open.
await settle();
await ev(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(400);
await settle();
c = await cam();
const meadows = await ev(() => boardWorld.game.state.board.areas.meadows.bounds);
const fits = c.wv.x <= meadows.x + 2 && c.wv.x + c.wv.w >= meadows.x + meadows.width - 2 && c.wv.y <= meadows.y + 2 && c.wv.y + c.wv.h >= meadows.y + meadows.height - 2;
check('overview: the open area fits the band, label Back', fits && c.zoom < 0.8 && c.mapLabel === 'Back', JSON.stringify({ zoom: c.zoom, wv: c.wv, meadows }));
await shot('2-overview');
await ev(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(400);
await settle();
c = await cam();
check('back: follow zoom and following', c.zoom === 0.8 && c.following === true && c.mapLabel === 'Map', JSON.stringify(c));

// A hint: tap a spot that is not lit.
const spaces = await ev(() => Object.fromEntries(Object.values(boardWorld.game.state.board.spaces).map((s) => [s.id, { x: s.x, y: s.y, kind: s.kind }])));
await settle();
await tapSpace('ashford-millford-1', spaces);
await sleep(300);
c = await cam();
check('tapping a spot tells about it: the area, the levels, what roams there', /Cloverfield Meadows, levels 1 to 4/.test(c.message) && /roam here/.test(c.message), c.message);

// Roll: from Puddlewick Village every roll has three ways to go, so the choices are framed.
await ev(() => boardWorld.phaser.scene.getScene('board').roll());
await settle();
c = await cam();
check('roll frames the choices: following stopped, zoom under follow zoom', c.choices && c.choices.length >= 2 && c.following === false && c.zoom <= 0.8, JSON.stringify(c));
const allIn = c.choices.every((id) => spaces[id].x >= c.wv.x && spaces[id].x <= c.wv.x + c.wv.w && spaces[id].y >= c.wv.y && spaces[id].y <= c.wv.y + c.wv.h) && c.token.x >= c.wv.x && c.token.x <= c.wv.x + c.wv.w && c.token.y >= c.wv.y && c.token.y <= c.wv.y + c.wv.h;
check('token and every lit space inside the view', allIn, c.choices.map((id) => `${id}@${spaces[id].x},${spaces[id].y}`).join(' '));
await shot('3-roll-framed');

// Drag: the camera moves by the finger's travel over the zoom, and a drag that ends on a space is no tap.
const before = await cam();
await touch('touchStart', [{ x: 200, y: 400 }]);
for (let i = 1; i <= 8; i++) { await touch('touchMove', [{ x: 200 + i * 10, y: 400 + i * 15 }]); await sleep(20); }
await touch('touchEnd', []);
await sleep(200);
c = await cam();
const dxWorld = (c.scrollX - before.scrollX) * before.zoom;
const dyWorld = (c.scrollY - before.scrollY) * before.zoom;
check('drag pans: following stopped, scroll moved against the finger (unless a bound stops it)', c.following === false && dxWorld < -60 && dxWorld > -82 && (dyWorld < -100 || dyWorld < 0) && c.choices && c.choices.length >= 2, `scroll moved ${dxWorld.toFixed(0)},${dyWorld.toFixed(0)} design px (finger +80,+120; the first 8 px arm the drag)`);
await shot('4-after-drag');
let target = c.choices[0];
let pos = await worldToScreen(spaces[target].x, spaces[target].y);
await touch('touchStart', [{ x: pos.x - 60, y: pos.y - 60 }]);
for (let i = 1; i <= 6; i++) { await touch('touchMove', [{ x: pos.x - 60 + i * 10, y: pos.y - 60 + i * 10 }]); await sleep(20); }
await touch('touchEnd', []);
await sleep(200);
c = await cam();
check('a drag ending on a lit space is not a tap', c.choices && c.choices.length >= 2 && c.steps > 0, JSON.stringify({ choices: c.choices, steps: c.steps }));

// Tap a lit space: the move is sent, the camera returns to the follow zoom and follows the walk.
target = (await pickChoice(['chest', 'potion', 'spell', 'town', 'shop'])) ?? c.choices[1];
await frameChoice(target);
c = await cam();
pos = await worldToScreen(spaces[target].x, spaces[target].y);
console.log('tapping', target, 'at', pos, 'view', c.wv);
await tapAt(pos.x, pos.y);
await sleep(150);
c = await cam();
check('tap sends the move at once and follows again', c.me === target && c.steps === 0 && c.following === true && c.choices === null, JSON.stringify({ me: c.me, following: c.following }));
await sleep(2200);
await settle();
const fought = await finishFight();
await clearTheWay();
await settle();
c = await cam();
check('after the walk: follow zoom, token centred, something in the message', c.zoom === 0.8 && centredOn(c, c.token, 4) && c.message.length > 0, JSON.stringify({ fought, ...c }));
await shot('5-after-walk');

// Pinch and wheel.
await touch('touchStart', [{ x: 180, y: 420, id: 0 }, { x: 230, y: 480, id: 1 }]);
await sleep(30);
for (let i = 1; i <= 8; i++) { await touch('touchMove', [{ x: 180 - i * 12, y: 420 - i * 12, id: 0 }, { x: 230 + i * 12, y: 480 + i * 12, id: 1 }]); await sleep(20); }
await touch('touchEnd', []);
await sleep(150);
c = await cam();
check('pinch out zooms in (clamped at 1.4)', c.zoom > 0.8 && c.zoom <= 1.4, `zoom ${c.zoom}`);
await touch('touchStart', [{ x: 100, y: 300, id: 0 }, { x: 300, y: 600, id: 1 }]);
await sleep(30);
for (let i = 1; i <= 8; i++) { await touch('touchMove', [{ x: 100 + i * 20, y: 300 + i * 30, id: 0 }, { x: 300 - i * 20, y: 600 - i * 30, id: 1 }]); await sleep(20); }
await touch('touchEnd', []);
await sleep(150);
const pinchedOut = await cam();
check('pinch in zooms out', pinchedOut.zoom < c.zoom, `zoom ${c.zoom} -> ${pinchedOut.zoom}`);
await page.mouse.move(206, 450);
await page.mouse.wheel(0, 100);
await sleep(100);
c = await cam();
check('wheel down zooms out by a tenth', Math.abs(c.zoom - pinchedOut.zoom / 1.1) < 0.01, `zoom ${pinchedOut.zoom} -> ${c.zoom}`);
await page.mouse.wheel(0, -100);
await sleep(100);
const namesAt = async (z) => { await ev((z) => boardWorld.phaser.scene.getScene('board').cameras.main.setZoom(z), z); await sleep(80); return ev(() => boardWorld.phaser.scene.getScene('board').names.map((n) => n.visible)); };
const shown = await namesAt(0.5);
const hidden = await namesAt(0.4);
check('hub names shown at 0.5 where the camera sees them, hidden at 0.4', shown.some(Boolean) && !shown.every(Boolean) && hidden.every((v) => !v) && shown.length > 20, `${shown.filter(Boolean).length} of ${shown.length} names shown at 0.5`);
await ev(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(500);
await ev(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(600);

// Reload mid-choice: the choice is lit again.
await ev(() => boardWorld.phaser.scene.getScene('board').roll());
await settle();
c = await cam();
for (let i = 0; i < 5 && !c.choices; i++) {
  await sleep(2500);
  await settle();
  await clearTheWay();
  await ev(() => boardWorld.phaser.scene.getScene('board').roll());
  await settle();
  c = await cam();
}
const litBefore = c.choices;
await page.reload();
await ready();
c = await cam();
const ringsLit = await ev(() => [...boardWorld.phaser.scene.getScene('board').rings.values()].filter((r) => r.visible).length);
check('reload mid-choice relights the same choice and frames it', litBefore && c.choices && c.choices.join() === litBefore.join() && ringsLit === c.choices.length && c.following === false && c.steps > 0, JSON.stringify({ litBefore, after: c.choices, ringsLit }));
await shot('7-reload-mid-choice');

// A version-1 save (the ring) opens on the world, the character on Puddlewick Village, rested.
await ev(() => {
  const v1 = { version: 1, seed: 'old-seed', board: { start: 's0', spaces: {} }, characters: { local: { id: 'local', name: 'Robin', classId: 'warrior', hp: 77, maxHp: 120, attack: 12, defense: 8, gold: 95, space: 's7', steps: 3 } }, die: { sides: 6, last: 3 } };
  localStorage.setItem('boardworld.save', JSON.stringify({ version: 1, state: v1, rng: 123456 }));
});
await page.reload();
await ready();
const migrated = await ev(() => ({ version: boardWorld.game.state.version, space: boardWorld.game.me.space, hp: boardWorld.game.me.hp, gold: boardWorld.game.me.gold, steps: boardWorld.game.me.steps, seed: boardWorld.game.state.seed, stats: boardWorld.phaser.scene.getScene('hud').stats.text }));
check('a version-1 save opens at the current version on the world with its gold kept, rested', migrated.version === STATE_VERSION && migrated.space === 'ashford' && migrated.hp === 120 && migrated.gold === 95 && migrated.steps === 0 && migrated.seed === 'old-seed' && /^Lv 1 /.test(migrated.stats), JSON.stringify(migrated));

// A fight: walk into the wilds until one opens (most landings there are one); two taps a round.
for (let i = 0; i < 12 && !(await inFight()); i++) {
  await clearTheWay();
  await ev(() => boardWorld.phaser.scene.getScene('board').roll());
  await settle();
  const pick = await pickChoice(['normal']);
  if (pick) { await frameChoice(pick); await tapSpace(pick, spaces); }
  await sleep(7 * 260 + 600);
  await settle();
  if (!(await inFight())) await clearTheWay();
}
await sleep(500);
const fightOn = await ev(() => ({ active: boardWorld.phaser.scene.isActive('fight'), enemy: boardWorld.game.me.fight?.enemy.name, rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha, message: boardWorld.phaser.scene.getScene('hud').message.text, buttons: boardWorld.phaser.scene.getScene('fight').buttons.map((b) => b.list[1].text) }));
check('a wild spot opens the fight screen with the moves, and dims Roll', fightOn.active && !!fightOn.enemy && fightOn.rollAlpha < 1 && /blocks the way/.test(fightOn.message) && fightOn.buttons[0] === 'Attack' && fightOn.buttons.includes('Flee'), JSON.stringify(fightOn));
const told = await ev(() => { const f = boardWorld.phaser.scene.getScene('fight'); return { enemy: f.enemyStatus.text, hero: f.heroStatus.text, next: boardWorld.game.me.fight?.enemy.next?.name }; });
check('the fight screen tells the enemy\'s next move and shows the class meter', new RegExp(`^next: ${told.next}`).test(told.enemy) && /^Valor [●○]{5}/.test(told.hero), JSON.stringify(told));
await shot('9-fight-open');
await tapAt(...F.a); // Attack: now the guards
await sleep(200);
const guards = await ev(() => boardWorld.phaser.scene.getScene('fight').buttons.map((b) => b.list[1].text));
check('after the move the guards are offered', guards[0].startsWith('Block') && guards.some((g) => g.startsWith('Dodge')) && guards.some((g) => g.startsWith('Counter')), JSON.stringify(guards));
await tapAt(...F.f); // Back
await sleep(150);
await page.reload();
await ready();
await sleep(400);
const reopened = await ev(() => ({ active: boardWorld.phaser.scene.isActive('fight'), enemy: boardWorld.game.me.fight?.enemy.name }));
check('a reload mid-fight reopens the fight against the same enemy', reopened.active && reopened.enemy === fightOn.enemy, JSON.stringify(reopened));
const beforeFight = await ev(() => ({ gold: boardWorld.game.me.gold, xp: boardWorld.game.me.xp, hp: boardWorld.game.me.hp, space: boardWorld.game.me.space }));
let roundsPlayed = 0;
await fightBusy();
while (roundsPlayed < 25 && (await inFight())) { await attackRound(); roundsPlayed++; }
const afterFight = await ev(() => ({ fight: boardWorld.game.me.fight, gold: boardWorld.game.me.gold, xp: boardWorld.game.me.xp, hp: boardWorld.game.me.hp, space: boardWorld.game.me.space, outcome: boardWorld.phaser.scene.getScene('fight').outcome?.type, continueVisible: boardWorld.phaser.scene.getScene('fight').continueButton.visible, fightMessage: boardWorld.phaser.scene.getScene('fight').message.text }));
const consistent = afterFight.outcome === 'won' ? afterFight.gold > beforeFight.gold && afterFight.xp > beforeFight.xp : afterFight.outcome === 'died' ? afterFight.gold <= beforeFight.gold : false;
check('Attack and Block round after round until the fight ends; Continue shows; gold and xp follow the outcome', afterFight.fight === null && consistent && afterFight.continueVisible, JSON.stringify({ roundsPlayed, before: beforeFight, after: afterFight }));
await shot('10-fight-over');
await tapAt(...F.cont);
await sleep(400);
const back = await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const sp = boardWorld.game.state.board.spaces[boardWorld.game.me.space]; return { active: boardWorld.phaser.scene.isActive('fight'), stats: boardWorld.phaser.scene.getScene('hud').stats.text, message: boardWorld.phaser.scene.getScene('hud').message.text, rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha, tokenOnMe: Math.abs(s.token.x - sp.x) < 1 && Math.abs(s.token.y - (sp.y - 32)) < 1 }; });
check('Continue closes the fight: Roll is back, the HUD shows the level, the token stands where the character is', !back.active && /^Lv \d+ /.test(back.stats) && back.rollAlpha === 1 && /(Beat the|wake in)/.test(back.message) && back.tokenOnMe, JSON.stringify(back));
await shot('11-after-fight');

// The shop: a save standing on Merchant Cart with gold; tap the shop you stand on, buy a potion, a +1 and a sword, leave.
/** Plant a save: the current state with the character patched (and the state itself, for spawns and the die). */
const stockSave = (patch, statePatch = {}, freshBoard = false) => ev(({ patch, statePatch, freshBoard }) => {
  const state = structuredClone(boardWorld.game.state);
  if (freshBoard) {
    // The hand-laid world again, without the areas grown earlier in this run.
    state.board = boardWorld.rules.makeBoard();
    state.spawns = {};
  }
  Object.assign(state.characters.local, patch);
  Object.assign(state, statePatch);
  localStorage.setItem('boardworld.save', JSON.stringify({ version: 1, state, rng: 424242 }));
  // The page ticks the world once a minute and saves after it; the planted state must be what it saves.
  boardWorld.game.state = state;
}, { patch, statePatch, freshBoard });
/** A fight against `enemy` as the rules would start it, with the enemy patched. */
const plantedFight = (enemy, space, enemyPatch = {}) => ev(({ enemy, space, enemyPatch }) => boardWorld.rules.freshFight({ ...boardWorld.rules.makeEnemy(enemy, boardWorld.game.state.board.bestiary), ...enemyPatch }, space, false), { enemy, space, enemyPatch });
const NO_GEAR = { weapon: null, shield: null, helm: null, armour: null, gloves: null, boots: null, cape: null, trinket: null };
const STRONG = { level: 10, hp: 400, maxHp: 400, mana: 60, maxMana: 60, attack: 60, defense: 30, fight: null, offer: null, steps: 0, items: {}, equipment: NO_GEAR };
await stockSave({ space: 'tinker', steps: 0, gold: 150, items: {}, fight: null, offer: null, hp: 60, bag: [] });
await page.reload();
await ready();
await settle();
await tapSpace('tinker', spaces);
await sleep(400);
const shopOpen = await ev(() => ({ active: boardWorld.phaser.scene.isActive('shop'), rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha }));
check('tapping the shop you stand on opens it and dims Roll', shopOpen.active && shopOpen.rollAlpha < 1, JSON.stringify(shopOpen));
await shot('12-shop');
await tapAt(SHOP.buyX, SHOP.row(5)); // the potion
await tapAt(SHOP.buyX, SHOP.row(8)); // +1
await tapAt(SHOP.buyX, SHOP.row(0)); // the copper sword
const bought = await ev(() => ({ gold: boardWorld.game.me.gold, items: boardWorld.game.me.items, bag: boardWorld.game.me.bag.map((g) => g.name), message: boardWorld.phaser.scene.getScene('shop').message.text, stats: boardWorld.phaser.scene.getScene('hud').stats.text }));
check('Buy takes the gold and fills the bag; the HUD follows', bought.gold === 150 - 25 - 12 - 30 && bought.items.potion === 1 && bought.items['plus-one'] === 1 && bought.bag[0] === 'Tin Sword' && /Gold 83/.test(bought.stats) && /Bought Tin Sword for 30 gold/.test(bought.message), JSON.stringify(bought));
await tapAt(...SHOP.tabSell);
await sleep(150);
const sellTab = await ev(() => boardWorld.phaser.scene.getScene('shop').rows.filter((r) => r.text).map((r) => r.text));
check('the Sell side lists the sword at half its price', sellTab.some((t) => t === 'Tin Sword') && sellTab.some((t) => t === '15 g'), JSON.stringify(sellTab));
await tapAt(...SHOP.leave);
await sleep(400);
const left = await ev(() => ({ active: boardWorld.phaser.scene.isActive('shop'), rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha, message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('Leave closes the shop and gives Roll back', !left.active && left.rollAlpha === 1 && /Left Merchant Cart/.test(left.message), JSON.stringify(left));

// The bag: wear the sword.
await tapAt(...B.bag);
await sleep(400);
const bagOpen = await ev(() => ({ active: boardWorld.phaser.scene.isActive('bag'), numbers: boardWorld.phaser.scene.getScene('bag').numbers.text, attack: boardWorld.game.me.attack }));
check('Bag opens with the numbers', bagOpen.active && bagOpen.numbers.startsWith(`Attack ${bagOpen.attack} `), JSON.stringify(bagOpen));
await shot('13-bag');
await tapAt(BAG.wearX, BAG.carriedY);
await sleep(200);
const worn = await ev(() => ({ weapon: boardWorld.game.me.equipment.weapon?.name, bag: boardWorld.game.me.bag.length, numbers: boardWorld.phaser.scene.getScene('bag').numbers.text }));
check('Wear puts the sword on and the attack rises by its four', worn.weapon === 'Tin Sword' && worn.bag === 0 && worn.numbers.startsWith(`Attack ${bagOpen.attack + 4} `), JSON.stringify(worn));
await tapAt(...BAG.close);
await sleep(300);
check('Close gives the board back', !(await ev(() => boardWorld.phaser.scene.isActive('bag'))));

// A dice card: with one in the bag the choice waits even with one way to go, and the +1 chip shows.
await ev(() => boardWorld.phaser.scene.getScene('board').roll());
await settle();
const chips = await ev(() => { const row = boardWorld.phaser.scene.getScene('hud').chipRow; const b = row.list[0]; return { n: row.list.length, label: b?.list[1]?.text, x: row.x + (b?.x ?? 0), y: row.y, steps: boardWorld.game.me.steps, choices: !!boardWorld.phaser.scene.getScene('board').choices }; });
check('a pending roll offers the +1 chip and waits for a tap', chips.n === 1 && chips.label === '+1' && chips.choices && chips.steps > 0, JSON.stringify(chips));
await shot('14-dice-card');
await tapAt(chips.x, chips.y);
await sleep(300);
await settle();
const plusOne = await ev(() => ({ steps: boardWorld.game.me.steps, items: boardWorld.game.me.items, chips: boardWorld.phaser.scene.getScene('hud').chipRow.list.length, die: boardWorld.phaser.scene.getScene('hud').dieText.text, choices: boardWorld.phaser.scene.getScene('board').choices ? [...boardWorld.phaser.scene.getScene('board').choices.keys()].length : 0, message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('the +1 chip adds a step, spends the card, relights the choices and shows the new number', plusOne.steps === chips.steps + 1 && plusOne.items['plus-one'] === undefined && plusOne.chips === 0 && plusOne.die === String(plusOne.steps) && plusOne.choices > 0 && /\+1: now \d+ steps?\./.test(plusOne.message), JSON.stringify(plusOne));

// A potion in a fight: a save in a fight with one in the bag.
await stockSave({ space: 'ashford-millford-1', steps: 0, hp: 30, items: { potion: 1, 'mana-potion': 1 }, offer: null, fight: { enemy: { id: 'slime', name: 'Jelly Slime', level: 1, role: 'mob', hp: 30, maxHp: 30, attack: 6, defense: 2, xp: 6, gold: 8, moves: [{ name: 'Splat', power: 1, weight: 1 }], charged: null, stunned: 0, weakened: null, poison: null }, round: 1, charged: false, attackUp: null, barrier: 0, evade: 0, space: 'ashford-millford-1', spawn: false } });
await page.reload();
await ready();
await sleep(400);
const potionShown = await ev(() => ({ active: boardWorld.phaser.scene.isActive('fight'), buttons: boardWorld.phaser.scene.getScene('fight').buttons.map((b) => b.list[1].text) }));
check('a fight with a potion in the bag offers Honey Tonic among the moves, and a mana potion the Moon Dew', potionShown.active && potionShown.buttons[3] === 'Honey Tonic' && potionShown.buttons[5] === 'Moon Dew', JSON.stringify(potionShown));
await tapAt(...F.d); // Honey Tonic
await sleep(150);
await tapAt(...F.a); // Block
await sleep(100);
await fightBusy();
await sleep(100);
const drank = await ev(() => ({ hp: boardWorld.game.me.hp, potion: boardWorld.game.me.items.potion, round: boardWorld.game.me.fight?.round, potionAlpha: boardWorld.phaser.scene.getScene('fight').buttons.find((b) => b.list[1].text === 'Honey Tonic')?.alpha, message: boardWorld.phaser.scene.getScene('fight').message.text }));
check('Honey Tonic heals, is spent and dims in the row, and the enemy still struck', drank.hp > 30 && drank.potion === undefined && drank.round === 2 && drank.potionAlpha < 1, JSON.stringify(drank));
await shot('15-fight-potion');
await finishFight();

// The fight's other buttons: an ability from the menu, Charge then a Counter, Flee.
// A wolf: no weakening, so the charged blow below is judged on its own.
await stockSave({ ...STRONG, space: 'ashford-millford-3', abilities: { 'heavy-blow': 1, 'shield-bash': 1 }, fight: await plantedFight('wolf', 'ashford-millford-3', { hp: 900, maxHp: 900 }) });
await page.reload();
await ready();
await sleep(400);
await tapAt(...F.b); // Abilities
await sleep(200);
const menu = await ev(() => boardWorld.phaser.scene.getScene('fight').buttons.map((b) => b.list[1].text));
check('Abilities opens the menu with the kit and the mana costs', menu[0]?.startsWith('Mighty Swing') && /4 MP/.test(menu[0]) && menu[1]?.startsWith('Shield Bonk') && menu.at(-1) === 'Back', JSON.stringify(menu));
await tapAt(...F.a); // Mighty Swing
await sleep(150);
await tapAt(...F.b); // Dodge
await sleep(100);
await fightBusy();
await sleep(100);
const cast = await ev(() => ({ mana: boardWorld.game.me.mana, round: boardWorld.game.me.fight?.round, log: boardWorld.log.text().split('\n').filter((l) => /fight ability/.test(l)).at(-1) }));
check('Mighty Swing with a Dodge: the mana is spent and the round played', cast.mana === 58 && cast.round === 2 && /heavy-blow\/dodge/.test(cast.log ?? ''), JSON.stringify(cast));
await tapAt(...F.c); // Charge
await sleep(150);
await tapAt(...F.c); // Brace
await sleep(100);
await fightBusy();
await sleep(100);
const charged = await ev(() => ({ charged: boardWorld.game.me.fight?.charged, status: boardWorld.phaser.scene.getScene('fight').heroStatus.text, chargeLabel: boardWorld.phaser.scene.getScene('fight').buttons[2].list[1].text, mana: boardWorld.game.me.mana }));
check('Charge with a Brace: the charge is held and shown, the button reads Charged, brace gave mana back', charged.charged === true && /charged/.test(charged.status) && charged.chargeLabel === 'Charged' && charged.mana === 60, JSON.stringify(charged));
await tapAt(...F.a); // Attack
await sleep(150);
await tapAt(...F.d); // Counter
await sleep(100);
await fightBusy();
await sleep(100);
const struck = await ev(() => ({ charged: boardWorld.game.me.fight?.charged, log: boardWorld.log.text().split('\n').filter((l) => /fight attack\/counter/.test(l)).at(-1) }));
check('the charged Attack with a Counter lands twice as hard and spends the charge', struck.charged === false && /player (\d+)/.test(struck.log ?? '') && Number(/player (\d+)/.exec(struck.log)[1]) >= 90, JSON.stringify(struck));
await shot('18-fight-abilities');
await tapAt(...F.e); // Flee
await sleep(150);
await tapAt(...F.a); // Block
await sleep(100);
await fightBusy();
await sleep(100);
const fled = await ev(() => ({ fight: !!boardWorld.game.me.fight, outcome: boardWorld.phaser.scene.getScene('fight').outcome?.type, message: boardWorld.phaser.scene.getScene('fight').message.text }));
check('Flee with a Block either gets away or costs the blow', (fled.fight === false && fled.outcome === 'fled') || (fled.fight === true && /No escape|hits you|misses/.test(fled.message)), JSON.stringify(fled));
if (!fled.fight) { await tapAt(...F.cont); await sleep(300); } else await finishFight();

// Fairy Pick: the chip becomes the numbers.
await stockSave({ ...STRONG, space: 'ashford', steps: 3, items: { exact: 1 } }, { die: { sides: 6, last: 3 } });
await page.reload();
await ready();
await settle();
const exactChip = await ev(() => boardWorld.phaser.scene.getScene('hud').chipRow.list.map((b) => b.list[1].text));
check('a pending roll with Fairy Pick in the bag offers its chip', JSON.stringify(exactChip) === '["Fairy Pick"]', JSON.stringify(exactChip));
let chipPos = await ev(() => { const row = boardWorld.phaser.scene.getScene('hud').chipRow; return { x: row.x + row.list[0].x, y: row.y }; });
await tapAt(chipPos.x, chipPos.y);
await sleep(200);
const numbers = await ev(() => boardWorld.phaser.scene.getScene('hud').chipRow.list.map((b) => b.list[1].text));
check('tapping it turns the row into the numbers one to six and a way back', JSON.stringify(numbers) === '["1","2","3","4","5","6","×"]', JSON.stringify(numbers));
chipPos = await ev(() => { const row = boardWorld.phaser.scene.getScene('hud').chipRow; return { x: row.x + row.list[4].x, y: row.y }; });
await tapAt(chipPos.x, chipPos.y); // 5
await sleep(300);
await settle();
const exact = await ev(() => ({ steps: boardWorld.game.me.steps, die: boardWorld.phaser.scene.getScene('hud').dieText.text, items: boardWorld.game.me.items, message: boardWorld.phaser.scene.getScene('hud').message.text, choices: boardWorld.phaser.scene.getScene('board').choices?.size }));
check('the 5 makes it a walk of five, spends the card and relights the choices', exact.steps === 5 && exact.die === '5' && exact.items.exact === undefined && /Fairy Pick: now 5 steps/.test(exact.message) && exact.choices > 0, JSON.stringify(exact));
await shot('19-exactly-n');

// The gambler: the question in the chips, answered Low.
await stockSave({ ...STRONG, space: 'ashford-millford-2', gold: 100, offer: { kind: 'gamble', stake: 10 } });
await page.reload();
await ready();
const asked = await ev(() => ({ chips: boardWorld.phaser.scene.getScene('hud').chipRow.list.map((b) => b.list[1].text), message: boardWorld.phaser.scene.getScene('hud').message.text, rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha }));
check('a page opened mid-question asks it again in the chips, Roll dimmed', JSON.stringify(asked.chips) === '["High","Low","Walk on"]' && /double or nothing on 10 gold/.test(asked.message) && asked.rollAlpha < 1, JSON.stringify(asked));
chipPos = await ev(() => { const row = boardWorld.phaser.scene.getScene('hud').chipRow; return { x: row.x + row.list[1].x, y: row.y }; });
await tapAt(chipPos.x, chipPos.y); // Low
await sleep(300);
const answered = await ev(() => ({ offer: boardWorld.game.me.offer, gold: boardWorld.game.me.gold, message: boardWorld.phaser.scene.getScene('hud').message.text, chips: boardWorld.phaser.scene.getScene('hud').chipRow.list.length, rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha }));
check('Low answers it: the die shows, ten gold won or lost, Roll back', answered.offer === null && (answered.gold === 90 || answered.gold === 110) && /The die shows \d: you (win|lose) 10 gold/.test(answered.message) && answered.chips === 0 && answered.rollAlpha === 1, JSON.stringify(answered));

// A level's pick: one ability in two, in the chips; the one tapped is learned.
await stockSave({ ...STRONG, space: 'ashford', gold: 100, offer: null, picks: [['war-cry', 'execute']] });
await page.reload();
await ready();
const pickAsked = await ev(() => ({ chips: boardWorld.phaser.scene.getScene('hud').chipRow.list.map((b) => b.list[1].text), message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('a page opened on a level\'s pick asks it in the chips', JSON.stringify(pickAsked.chips) === '["Battle Hymn","Finishing Flourish"]' && /pick one/.test(pickAsked.message) && /Finishing Flourish/.test(pickAsked.message), JSON.stringify(pickAsked));
chipPos = await ev(() => { const row = boardWorld.phaser.scene.getScene('hud').chipRow; return { x: row.x + row.list[1].x, y: row.y }; });
await tapAt(chipPos.x, chipPos.y); // Finishing Flourish
await sleep(300);
const pickedUp = await ev(() => ({ picks: boardWorld.game.me.picks.length, abilities: boardWorld.game.me.abilities, message: boardWorld.phaser.scene.getScene('hud').message.text, chips: boardWorld.phaser.scene.getScene('hud').chipRow.list.length }));
check('tapping Finishing Flourish learns it, clears the question and says what it does', pickedUp.picks === 0 && pickedUp.abilities.execute === 1 && /^Learned Finishing Flourish\. Spend 3 Valor/.test(pickedUp.message) && pickedUp.chips === 0, JSON.stringify(pickedUp));

// The trainer: in Ashford's shop under Train, Battle Hymn learned for the tier's price.
await stockSave({ ...STRONG, space: 'ashford', gold: 500, abilities: { 'heavy-blow': 1, 'shield-bash': 1 }, quests: [], picks: [], cooldowns: { 'quest:ashford': Date.now() + 600000 } });
await page.reload();
await ready();
await settle();
await tapSpace('ashford', spaces);
await sleep(400);
await tapAt(316, 178); // Train
await sleep(150);
const trainTab = await ev(() => boardWorld.phaser.scene.getScene('shop').children.list.filter((o) => o.text && /^(Mighty Swing|Shield Bonk|Battle Hymn|Finishing Flourish|Second Wind|Castle Stance)/.test(o.text)).map((o) => o.text));
check('a town\'s shop has a Train tab listing the class\'s six abilities', trainTab.length === 6 && trainTab[2] === 'Battle Hymn', JSON.stringify(trainTab));
await tapAt(SHOP.buyX, SHOP.row(2)); // Learn Battle Hymn
const trained = await ev(() => ({ gold: boardWorld.game.me.gold, rank: boardWorld.game.me.abilities['war-cry'], message: boardWorld.phaser.scene.getScene('shop').message.text }));
check('Learn teaches Battle Hymn for 60 gold in a tier-1 town', trained.rank === 1 && trained.gold === 440 && /Learned Battle Hymn for 60 gold/.test(trained.message), JSON.stringify(trained));
await tapAt(...SHOP.leave);
await sleep(300);

// An errand: walking into Puddlewick Village with none from there asks one in the chips; Take it carries it.
await stockSave({ ...STRONG, space: 'ashford-millford-1', steps: 1, quests: [], picks: [], cooldowns: {} }, { die: { sides: 6, last: 1 } });
await page.reload();
await ready();
await settle();
await frameChoice('ashford');
await tapSpace('ashford', spaces);
await sleep(1200);
await settle();
const errand = await ev(() => ({ offer: boardWorld.game.me.offer?.kind, chips: boardWorld.phaser.scene.getScene('hud').chipRow.list.map((b) => b.list[1].text), message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('landing in a town asks an errand in the chips', errand.offer === 'quest' && JSON.stringify(errand.chips) === '["Take it","Not now"]' && /An errand from Puddlewick Village/.test(errand.message), JSON.stringify(errand));
chipPos = await ev(() => { const row = boardWorld.phaser.scene.getScene('hud').chipRow; return { x: row.x + row.list[0].x, y: row.y }; });
await tapAt(chipPos.x, chipPos.y); // Take it
await sleep(300);
const took = await ev(() => ({ quests: boardWorld.game.me.quests.length, offer: boardWorld.game.me.offer, message: boardWorld.phaser.scene.getScene('hud').message.text, hint: boardWorld.rules.hintFor(boardWorld.game.state, 'ashford', 'local', Date.now()) }));
check('Take it carries the errand and the town\'s hint says how it stands', took.quests === 1 && took.offer === null && /^Errand taken:/.test(took.message) && /Your errand:/.test(took.hint), JSON.stringify(took));

// A full bag: the piece that found no room waits in the chips; Sell takes its half.
const twelve = await ev(() => Array.from({ length: 12 }, (_, i) => boardWorld.rules.plainGear(`h${i}`, 'hat', 1)));
const extra = await ev(() => boardWorld.rules.plainGear('x1', 'weapon', 2));
await stockSave({ ...STRONG, space: 'ashford', gold: 100, bag: twelve, offer: { kind: 'loot', gear: extra } });
await page.reload();
await ready();
const fullBag = await ev(() => ({ chips: boardWorld.phaser.scene.getScene('hud').chipRow.list.map((b) => b.list[1].text), message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('a piece with no room in the bag is asked about in the chips', JSON.stringify(fullBag.chips) === '["Sell for 45","Leave it"]' && /Your bag is full/.test(fullBag.message), JSON.stringify(fullBag));
chipPos = await ev(() => { const row = boardWorld.phaser.scene.getScene('hud').chipRow; return { x: row.x + row.list[0].x, y: row.y }; });
await tapAt(chipPos.x, chipPos.y); // Sell
await sleep(300);
const soldExtra = await ev(() => ({ gold: boardWorld.game.me.gold, offer: boardWorld.game.me.offer, bag: boardWorld.game.me.bag.length, message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('Sell takes half its worth and frees the board', soldExtra.gold === 145 && soldExtra.offer === null && soldExtra.bag === 12 && /Sold Copper Sword for 45 gold/.test(soldExtra.message), JSON.stringify(soldExtra));

// A wandering merchant camped on the next spot: the walk opens his shop.
await stockSave({ ...STRONG, space: 'ashford', steps: 1, gold: 100 }, { die: { sides: 6, last: 1 }, spawns: { 'ashford-millford-1': { kind: 'merchant', enemy: null, until: Date.now() + 600000 } } });
await page.reload();
await ready();
await settle();
const badge = await ev(() => boardWorld.phaser.scene.getScene('board').spawnMarks.has('ashford-millford-1'));
await frameChoice('ashford-millford-1');
await tapSpace('ashford-millford-1', spaces);
await sleep(1200);
await settle();
const merchant = await ev(() => ({ shop: boardWorld.phaser.scene.isActive('shop'), title: boardWorld.phaser.scene.getScene('shop').children.list.find((o) => o.text && /Merchant/.test(o.text))?.text }));
check('a merchant camped shows a badge, and landing there opens his shop', badge && merchant.shop && merchant.title === 'Wandering Merchant', JSON.stringify({ badge, ...merchant }));
await tapAt(SHOP.buyX, SHOP.row(5)); // a potion from the merchant
const fromMerchant = await ev(() => ({ gold: boardWorld.game.me.gold, potion: boardWorld.game.me.items.potion }));
check('the merchant sells like a shop', fromMerchant.gold === 75 && fromMerchant.potion === 1, JSON.stringify(fromMerchant));
await tapAt(...SHOP.leave);
await sleep(300);

// Sell: press it.
const sword = await ev(() => boardWorld.rules.plainGear('g9', 'weapon', 1));
await stockSave({ ...STRONG, space: 'tinker', gold: 10, bag: [sword] });
await page.reload();
await ready();
await settle();
await tapSpace('tinker', spaces);
await sleep(400);
await tapAt(...SHOP.tabSell);
await sleep(150);
await tapAt(SHOP.buyX, SHOP.row(0)); // Sell the sword
const sold = await ev(() => ({ gold: boardWorld.game.me.gold, bag: boardWorld.game.me.bag.length, message: boardWorld.phaser.scene.getScene('shop').message.text }));
check('Sell takes the piece and pays half', sold.gold === 25 && sold.bag === 0 && /Sold Tin Sword for 15 gold/.test(sold.message), JSON.stringify(sold));
await tapAt(...SHOP.leave);
await sleep(300);

// The bag: Take off and Drop.
const helm = await ev(() => boardWorld.rules.plainGear('g8', 'hat', 1));
await stockSave({ ...STRONG, space: 'ashford', equipment: { ...NO_GEAR, weapon: sword }, bag: [helm] });
await page.reload();
await ready();
await tapAt(...B.bag);
await sleep(400);
await tapAt(364, 212); // Take off the weapon
await sleep(200);
const tookOff = await ev(() => ({ weapon: boardWorld.game.me.equipment.weapon, bag: boardWorld.game.me.bag.map((g) => g.name), message: boardWorld.phaser.scene.getScene('bag').message.text }));
check('Take off puts the weapon back in the bag', tookOff.weapon === null && tookOff.bag.length === 2 && /Took off Tin Sword/.test(tookOff.message), JSON.stringify(tookOff));
await tapAt(288, 456); // Drop the first carried piece
await sleep(200);
const dropped = await ev(() => ({ bag: boardWorld.game.me.bag.map((g) => g.name), message: boardWorld.phaser.scene.getScene('bag').message.text }));
check('Drop throws it away', dropped.bag.length === 1 && /Dropped/.test(dropped.message), JSON.stringify(dropped));
await tapAt(...BAG.close);
await sleep(300);

// A shrine, a level, a death, through the screen.
await stockSave({ ...STRONG, space: 'moon-gate-1', steps: 1, abilities: { 'heavy-blow': 1, 'shield-bash': 1 }, cooldowns: {} }, { die: { sides: 6, last: 1 } });
await page.reload();
await ready();
await settle();
await frameChoice('moon');
await tapSpace('moon', spaces);
await sleep(1000);
await settle();
const learned = await ev(() => ({ abilities: boardWorld.game.me.abilities, message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('landing on the Forest Shrine teaches the third ability', learned.abilities['war-cry'] === 1 && /Learned Battle Hymn, rank 1/.test(learned.message), JSON.stringify(learned));
await stockSave({ ...STRONG, space: 'ashford-millford-1', xp: 29, level: 1, fight: await plantedFight('slime', 'ashford-millford-1', { hp: 1 }) });
await page.reload();
await ready();
await sleep(400);
await attackRound();
const levelled = await ev(() => ({ level: boardWorld.game.me.level, summary: boardWorld.phaser.scene.getScene('fight').outcome?.summary, cont: boardWorld.phaser.scene.getScene('fight').continueButton.visible }));
check('a win that crosses a level says so and offers Continue', levelled.level === 2 && /Level 2!/.test(levelled.summary ?? '') && levelled.cont, JSON.stringify(levelled));
await tapAt(...F.cont);
await sleep(300);
const hudLevel = await ev(() => boardWorld.phaser.scene.getScene('hud').stats.text);
check('the HUD shows the new level', /^Lv 2 /.test(hudLevel), hudLevel);
await stockSave({ ...STRONG, space: 'ashford-millford-3', hp: 1, gold: 100, fight: await plantedFight('bandit', 'ashford-millford-3') });
await page.reload();
await ready();
await sleep(400);
await attackRound();
const dead = await ev(() => ({ outcome: boardWorld.phaser.scene.getScene('fight').outcome?.type, message: boardWorld.phaser.scene.getScene('fight').message.text, space: boardWorld.game.me.space, gold: boardWorld.game.me.gold, hp: boardWorld.game.me.hp }));
check('beaten: the fight screen says where you wake and what it cost', dead.outcome === 'died' && /wake in Puddlewick Village, 20 gold lighter/.test(dead.message) && dead.space === 'ashford' && dead.gold === 80 && dead.hp === 400, JSON.stringify(dead));
await tapAt(...F.cont);
await sleep(500);
const woke = await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const sp = boardWorld.game.state.board.spaces.ashford; return { tokenOnTown: Math.abs(s.token.x - sp.x) < 1, message: boardWorld.phaser.scene.getScene('hud').message.text, following: s.following }; });
check('Continue puts the token in Puddlewick Village and the camera on it', woke.tokenOnTown && /wake in Puddlewick Village/.test(woke.message) && woke.following, JSON.stringify(woke));

// Hints on a boss and on a covered spot.
await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); s.frame([boardWorld.game.state.board.spaces.gate, boardWorld.game.state.board.spaces.edge]); });
await settle();
await tapSpace('gate', spaces);
await sleep(300);
const bossHint = await ev(() => boardWorld.phaser.scene.getScene('hud').message.text);
check('tapping the King Goo's Gate names King Goo, its level and what it opens', /King Goo, level 6, at King Goo's Gate/.test(bossHint) && /open Wobblewood Forest/.test(bossHint), bossHint);
await tapSpace('edge', spaces);
await sleep(300);
const coveredHint = await ev(() => boardWorld.phaser.scene.getScene('hud').message.text);
check('tapping a spot under a cover says the area is closed and which boss opens it', /Wobblewood Forest \(tier 2, levels 4 to 8\): closed/.test(coveredHint) && /Beat King Goo at King Goo's Gate/.test(coveredHint), coveredHint);

// A level-one Knight cannot beat King Goo: the wall.
await stockSave({ level: 1, hp: 120, maxHp: 120, mana: 20, maxMana: 20, attack: 12, defense: 8, space: 'moon-gate-3', steps: 1, fight: null, offer: null, items: {}, equipment: NO_GEAR, cooldowns: {}, bossKills: {}, opened: ['meadows'] }, { die: { sides: 6, last: 1 } });
await page.reload();
await ready();
await settle();
await frameChoice('gate');
await tapSpace('gate', spaces);
await sleep(1200);
await settle();
const wallRounds = await finishFight();
const wall = await ev(() => ({ space: boardWorld.game.me.space, kills: boardWorld.game.me.bossKills.gate, opened: boardWorld.game.me.opened, message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('a level-one Knight with no gear is beaten by King Goo and wakes in Old Mill', wall.kills === undefined && wall.space === 'millford' && !wall.opened.includes('thornwood') && /wake in Old Mill/.test(wall.message), JSON.stringify({ wallRounds, ...wall }));

// A spawned mini-boss: land on it, beat it, it leaves the board.
await stockSave({ ...STRONG, space: 'ashford', steps: 1 }, { die: { sides: 6, last: 1 }, spawns: { 'ashford-millford-1': { kind: 'miniboss', enemy: 'wolf-alpha', until: Date.now() + 600000 } } });
await page.reload();
await ready();
await settle();
await frameChoice('ashford-millford-1');
await tapSpace('ashford-millford-1', spaces);
await sleep(1200);
await settle();
const miniFight = await ev(() => ({ enemy: boardWorld.game.me.fight?.enemy.name, spawn: boardWorld.game.me.fight?.spawn }));
check('landing where a mini-boss prowls fights it', miniFight.enemy === 'Mushroom Muncher' && miniFight.spawn === true, JSON.stringify(miniFight));
await finishFight();
const miniGone = await ev(() => ({ spawns: Object.keys(boardWorld.game.state.spawns), badges: [...boardWorld.phaser.scene.getScene('board').spawnMarks.keys()] }));
check('beaten, it leaves the board and its badge goes (the world may have spawned elsewhere meanwhile)', !miniGone.spawns.includes('ashford-millford-1') && !miniGone.badges.includes('ashford-millford-1') && miniGone.badges.length === miniGone.spawns.length, JSON.stringify(miniGone));

// The boss on the board: a save next to the King Goo's Gate, strong enough; land exactly on it; beat it; Wobblewood Forest opens.
await stockSave({ space: 'moon-gate-3', steps: 1, hp: 400, maxHp: 400, mana: 60, maxMana: 60, attack: 60, defense: 30, level: 10, fight: null, offer: null, opened: ['meadows'], cooldowns: {} });
await ev(() => { const s = JSON.parse(localStorage.getItem('boardworld.save')); s.state.die.last = 1; localStorage.setItem('boardworld.save', JSON.stringify(s)); });
await page.reload();
await ready();
await settle();
c = await cam();
check('a roll of one next to the King Goo's Gate lights the gate and one other way, not the road beyond', c.choices && c.choices.includes('gate') && !c.choices.includes('gate-edge-1'), JSON.stringify(c.choices));
await frameChoice('gate');
await tapSpace('gate', spaces);
await sleep(1200);
await settle();
const bossFight = await ev(() => ({ active: boardWorld.phaser.scene.isActive('fight'), enemy: boardWorld.game.me.fight?.enemy.name, role: boardWorld.game.me.fight?.enemy.role }));
check('landing exactly on the gate starts the boss fight', bossFight.active && bossFight.enemy === 'King Goo' && bossFight.role === 'boss', JSON.stringify(bossFight));
await shot('16-boss-fight');
const bossRounds = await finishFight();
const opened = await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); return { opened: boardWorld.game.me.opened, kills: boardWorld.game.me.bossKills, coverThornwood: s.covers.get('thornwood').visible, label: s.bossLabels.get('gate').text, message: boardWorld.phaser.scene.getScene('hud').message.text, loot: boardWorld.game.me.bag.at(-1) }; });
check('King Goo drops the good stuff: a unique, or nothing under epic', !!opened.loot && ['unique', 'epic', 'legendary'].includes(opened.loot.rarity) && (opened.loot.rarity !== 'unique' || typeof opened.loot.unique === 'string'), JSON.stringify(opened.loot));
check('King Goo falls: Wobblewood Forest opens, its cover lifts, the gate counts down to the boss\'s return', opened.opened.includes('thornwood') && opened.kills.gate === 1 && opened.coverThornwood === false && /back in \d+:\d\d/.test(opened.label) && /Wobblewood Forest is open/.test(opened.message), JSON.stringify({ bossRounds, ...opened }));
await shot('17-area-opened');

// The Grumblebark's Glade opens Honeyhill Fields; then a look at the two further areas.
await stockSave({ ...STRONG, attack: 90, defense: 40, hp: 600, maxHp: 600, space: 'thicket-briar-3', steps: 1, opened: ['meadows', 'thornwood'], cooldowns: {}, bossKills: {} }, { die: { sides: 6, last: 1 } });
await page.reload();
await ready();
await settle();
await frameChoice('briar');
await tapSpace('briar', spaces);
await sleep(1200);
await settle();
const briarFight = await ev(() => boardWorld.game.me.fight?.enemy.name);
check('landing exactly on the Grumblebark's Glade starts the Grumblebark', briarFight === 'Grumblebark', String(briarFight));
await finishFight();
const frost = await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); return { opened: boardWorld.game.me.opened, cover: s.covers.get('frostpeak').visible, message: boardWorld.phaser.scene.getScene('hud').message.text }; });
check('the Grumblebark falls and Honeyhill Fields opens', frost.opened.includes('frostpeak') && frost.cover === false && /Honeyhill Fields is open/.test(frost.message), JSON.stringify(frost));
await ev(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(400);
await settle();
await shot('20-overview-all-open');
const frameArea = async (id) => { await ev((id) => { const b = boardWorld.game.state.board.areas[id].bounds; boardWorld.phaser.scene.getScene('board').frame([{ x: b.x, y: b.y }, { x: b.x + b.width, y: b.y + b.height }]); }, id); await settle(); };
await frameArea('thornwood');
await shot('21-thornwood');
await frameArea('frostpeak');
await shot('22-frostpeak');

// Queen Bumble's Hive: the Queen Bumble falls and the world grows. The first grown area is laid from the seed and opened, drawn
// on the spot with its ground, roads, spots and boss, and the map is wider for it; the hint at its gate names the next.
await stockSave({ ...STRONG, attack: 120, defense: 60, hp: 900, maxHp: 900, space: 'summit', opened: ['meadows', 'thornwood', 'frostpeak'], cooldowns: {}, bossKills: {}, fight: await plantedFight('frost-matriarch', 'summit', { hp: 1 }) });
await page.reload();
await ready();
await settle();
const atSummit = await ev(() => ({ width: boardWorld.game.state.board.width, areas: Object.keys(boardWorld.game.state.board.areas).length, enemy: boardWorld.game.me.fight?.enemy.name }));
await finishFight();
const grown = await ev(() => {
  const s = boardWorld.phaser.scene.getScene('board');
  const b = boardWorld.game.state.board;
  const area = b.areas['gen-1'];
  const own = Object.values(b.spaces).filter((x) => x.area === 'gen-1');
  const gate = own.find((x) => x.kind === 'boss');
  return { opened: boardWorld.game.me.opened, area: area && { name: area.name, tier: area.tier, theme: area.theme }, width: b.width, camWidth: s.cameras.main.getBounds().width, cover: s.covers.get('gen-1')?.visible, drawn: own.filter((x) => s.circles.has(x.id)).length, spaces: own.length, message: boardWorld.phaser.scene.getScene('hud').message.text, gate: gate && { id: gate.id, boss: gate.boss, bossName: b.bestiary[gate.boss]?.name, label: s.bossLabels.get(gate.id)?.text } };
});
check('the Queen Bumble falls: the first grown area is laid and opened, drawn spot for spot with its boss, the map wider', atSummit.enemy === 'Queen Bumble' && grown.opened.includes('gen-1') && grown.area?.tier === 4 && grown.width > atSummit.width && grown.camWidth === grown.width && grown.cover === false && grown.spaces >= 40 && grown.drawn === grown.spaces && new RegExp(`${grown.area?.name} is open`).test(grown.message) && /level \d+/.test(grown.gate?.label ?? ''), JSON.stringify({ atSummit, ...grown }));
await frameArea('gen-1');
await shot('23-grown-area');
const grownSpaces = await ev(() => Object.fromEntries(Object.values(boardWorld.game.state.board.spaces).map((s) => [s.id, { x: s.x, y: s.y, kind: s.kind }])));
await tapSpace(grown.gate.id, grownSpaces);
await sleep(300);
c = await cam();
check("the grown gate's hint names its boss and the area beyond by name and tier, before it is laid", new RegExp(`^${grown.gate.bossName}, level \\d+`).test(c.message) && /Land exactly here/.test(c.message) && /Beat it to open .+ \(tier 5\)\./.test(c.message), c.message);

// Its boss in turn, from the board's own bestiary, lays the second; a reload keeps the first drawn.
await stockSave({ ...STRONG, attack: 160, defense: 80, hp: 1200, maxHp: 1200, space: grown.gate.id, cooldowns: {}, bossKills: {}, fight: await plantedFight(grown.gate.boss, grown.gate.id, { hp: 1 }) });
await page.reload();
await ready();
await settle();
const redrawn = await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const b = boardWorld.game.state.board; return { gen1Drawn: Object.values(b.spaces).filter((x) => x.area === 'gen-1').every((x) => s.circles.has(x.id)), enemy: boardWorld.game.me.fight?.enemy.name, width: b.width }; });
await finishFight();
const second = await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const b = boardWorld.game.state.board; const area = b.areas['gen-2']; const own = Object.values(b.spaces).filter((x) => x.area === 'gen-2'); return { opened: boardWorld.game.me.opened, area: area && { name: area.name, tier: area.tier }, drawn: own.filter((x) => s.circles.has(x.id)).length, spaces: own.length, cover: s.covers.get('gen-2')?.visible, width: b.width, height: b.height, kills: boardWorld.game.me.bossKills, message: boardWorld.phaser.scene.getScene('hud').message.text }; });
check('a reload keeps the grown area drawn; its boss lays and opens the second grown area under the first', redrawn.gen1Drawn && redrawn.width === grown.width && redrawn.enemy === grown.gate.bossName && second.opened.includes('gen-2') && second.area?.tier === 5 && second.drawn === second.spaces && second.spaces >= 40 && second.cover === false && second.width === grown.width && second.height === 3800 && second.kills[grown.gate.id] === 1 && new RegExp(`${second.area?.name} is open`).test(second.message), JSON.stringify({ redrawn, second }));
await ev(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(400);
await settle();
await shot('24-overview-grown');

// The world as a list: World opens the atlas with the areas by tier and where you are; Go frames one; Settings toggles.
await stockSave({ ...STRONG, space: 'ashford', opened: ['meadows', 'thornwood'] }, {}, true);
await page.reload();
await ready();
await settle();
await tapAt(...B.world);
await sleep(400);
const atlas = await ev(() => ({ active: boardWorld.phaser.scene.isActive('atlas'), rows: boardWorld.phaser.scene.getScene('atlas').children.list.filter((o) => o.text && /tier \d/.test(o.text)).map((o) => o.text) }));
check('World opens the atlas: the areas by tier, the open ones bright, you are here', atlas.active && atlas.rows.length === 3 && atlas.rows[0] === 'Cloverfield Meadows · tier 1 · you are here' && atlas.rows[1] === 'Wobblewood Forest · tier 2' && atlas.rows[2] === 'Honeyhill Fields · tier 3', JSON.stringify(atlas));
await tapAt(364, 176 + 74 + 12); // Go, Wobblewood Forest
await sleep(500);
await settle();
const framed = await ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const b = boardWorld.game.state.board.areas.thornwood.bounds; const v = s.cameras.main.worldView; const cx = b.x + b.width / 2; const cy = b.y + b.height / 2; return { atlas: boardWorld.phaser.scene.isActive('atlas'), following: s.following, inside: v.x <= cx && cx <= v.x + v.width && v.y <= cy && cy <= v.y + v.height, view: { x: Math.round(v.x), y: Math.round(v.y), w: Math.round(v.width), h: Math.round(v.height) }, bounds: b }; });
check('Go frames the area on the board and closes the atlas', !framed.atlas && framed.following === false && framed.inside, JSON.stringify(framed));
await tapAt(...B.world);
await sleep(300);
await tapAt(276, 126); // Settings
await sleep(200);
const toggles = await ev(() => boardWorld.phaser.scene.getScene('atlas').children.list.flatMap((o) => (o.list ? o.list : [o])).filter((o) => o.text && /^(On|Off|Full|Fewer|Large|Normal)$/.test(o.text)).map((o) => o.text));
check('Settings lists sound, effects and text with their toggles', JSON.stringify(toggles) === '["On","Full","Normal"]', JSON.stringify(toggles));
await tapAt(364 + 4, 176 + 74 + 12); // Effects: fewer
await sleep(200);
const fewer = await ev(() => JSON.parse(localStorage.getItem('boardworld.settings') || '{}'));
check('a toggle is kept in the page\'s storage', fewer.fewerEffects === true, JSON.stringify(fewer));
await tapAt(364 + 4, 176 + 74 + 12); // and back
await sleep(200);
await tapAt(364, 126); // Close
await sleep(300);

// reset() throws the save away: the next load is the character screen again.
await ev(() => boardWorld.game.reset());
await page.reload();
await page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.isActive('create'), null, { timeout: 15000 });
check('reset then reload shows the character screen again', true);

const logErrors = await ev(() => boardWorld.log.errorCount);
const fps = await ev(() => boardWorld.phaser.loop.actualFps.toFixed(0));
check('no page errors and none in the game log', errors.length === 0 && logErrors === 0, `${errors.join(' | ')} log errors ${logErrors}, renderer ${c.renderer === 1 ? 'canvas' : 'webgl'}, fps ${fps} (software GL here)`);
await browser.close();
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
