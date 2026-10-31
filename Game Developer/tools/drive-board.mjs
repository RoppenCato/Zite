// Drives the built game headless at phone size (412 by 915, touch) and checks the camera and the board: start,
// overview and back, a framed roll, a drag, a drag ending on a lit space, a tap and the walk, pinch, wheel, the hub-name
// threshold, a reload mid-choice, a version-1 save, the landed message. Screenshots land in tools/out/shots/.
//
//   npm run build && npm run preview &      (or npm run dev, then pass http://localhost:5173/)
//   node tools/drive-board.mjs [url]
//
// Needs Chromium through Playwright: the cloud sessions have it installed globally; locally `npm i -D playwright` and
// `npx playwright install chromium` once. Exits 1 when a check fails. It clears the page's save first: run it against a
// pane, never against Robin's phone.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const OUT = fileURLToPath(new URL('./out/shots/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const PAGE = process.argv[2] ?? 'http://localhost:4173/';
const BAND_H = 660; // the world band's height in design pixels (layout.ts VIEW_HEIGHT)
const STATE_VERSION = 4; // rules/src/types.ts
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };

const browser = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id ?? 0 })) });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const cam = () => page.evaluate(() => {
  const s = boardWorld.phaser.scene.getScene('board');
  const c = s.cameras.main;
  return { zoom: +c.zoom.toFixed(3), scrollX: Math.round(c.scrollX), scrollY: Math.round(c.scrollY), wv: { x: Math.round(c.worldView.x), y: Math.round(c.worldView.y), w: Math.round(c.worldView.width), h: Math.round(c.worldView.height) }, following: s.following, choices: s.choices ? [...s.choices.keys()] : null, token: { x: Math.round(s.token.x), y: Math.round(s.token.y) }, me: boardWorld.game.me.space, steps: boardWorld.game.me.steps, mapLabel: boardWorld.phaser.scene.getScene('hud').mapLabel.text, message: boardWorld.phaser.scene.getScene('hud').message.text, renderer: boardWorld.phaser.renderer.type };
});
const worldToScreen = async (wx, wy) => { const c = await cam(); return { x: (wx - c.wv.x) * c.zoom, y: 90 + (wy - c.wv.y) * c.zoom }; };
const settle = async () => { let last = ''; for (let i = 0; i < 40; i++) { await sleep(150); const now = JSON.stringify(await cam()); if (now === last) return; last = now; } };
const clampedCentre = (c, target) => { const dw = 412 / c.zoom, dh = BAND_H / c.zoom; return { x: dw >= 1400 ? 700 : Math.min(Math.max(target.x, dw / 2), 1400 - dw / 2), y: dh >= 1850 ? 925 : Math.min(Math.max(target.y, dh / 2), 1850 - dh / 2) }; };
const centredOn = (c, target, tol = 3) => { const e = clampedCentre(c, target); return Math.abs(c.wv.x + c.wv.w / 2 - e.x) < tol && Math.abs(c.wv.y + c.wv.h / 2 - e.y) < tol; };
const tapAt = async (x, y) => { await touch('touchStart', [{ x, y }]); await sleep(40); await touch('touchEnd', []); };
const inFight = () => page.evaluate(() => !!boardWorld.game.me.fight);
/** Attack until a fight that opened is over, then Continue; nothing when there is none. Returns how many rounds it took. */
const finishFight = async () => {
  let rounds = 0;
  if (!(await inFight())) return 0;
  await page.waitForFunction(() => boardWorld.phaser.scene.isActive('fight') && !boardWorld.phaser.scene.getScene('fight').busy, null, { timeout: 15000 });
  await sleep(300);
  while (rounds < 20 && (await inFight())) {
    await tapAt(110, 672);
    rounds++;
    await sleep(100);
    await page.waitForFunction(() => !boardWorld.phaser.scene.getScene('fight').busy, null, { timeout: 15000 });
    await sleep(100);
  }
  await tapAt(206, 704);
  await sleep(400);
  return rounds;
};
/** Of the lit choices, the first whose kind is in `prefer`, else the first; null when there is no choice. */
const pickChoice = async (prefer) => {
  const c = await cam();
  if (!c.choices) return null;
  const kinds = await page.evaluate((ids) => ids.map((id) => boardWorld.game.state.board.spaces[id].kind), c.choices);
  const i = kinds.findIndex((k) => prefer.includes(k));
  return c.choices[i < 0 ? 0 : i];
};
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const ready = async () => { await page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.getScene('hud')?.message?.text, null, { timeout: 15000 }); await sleep(600); };

await page.goto(PAGE);
await page.evaluate(() => localStorage.clear());
await page.reload();
// No save: the character screen. Type a name, pick the Mage, Begin.
await page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.isActive('create'), null, { timeout: 15000 });
await sleep(400);
const createShown = await page.evaluate(() => ({ create: boardWorld.phaser.scene.isActive('create'), game: boardWorld.game, input: document.querySelector('#game input')?.value }));
check('no save: the character screen comes first, the name field filled with the default', createShown.create && createShown.game === null && createShown.input === 'Robin', JSON.stringify(createShown));
await shot('0-character-screen');
await page.fill('#game input', 'Driver');
await touch('touchStart', [{ x: 206, y: 536 }]); // the third card: Mage
await sleep(40);
await touch('touchEnd', []);
await sleep(100);
await touch('touchStart', [{ x: 206, y: 812 }]); // Begin
await sleep(40);
await touch('touchEnd', []);
await ready();
const created = await page.evaluate(() => ({ create: boardWorld.phaser.scene.isActive('create'), name: boardWorld.game?.me.name, classId: boardWorld.game?.me.classId, space: boardWorld.game?.me.space, header: boardWorld.phaser.scene.getScene('hud').children.list.find((o) => o.text && /the /.test(o.text))?.text }));
check('Begin makes the character and starts the board: Driver the Mage on Ashford', !created.create && created.name === 'Driver' && created.classId === 'mage' && created.space === 'ashford' && created.header === 'Driver the Mage', JSON.stringify(created));
await page.reload();
await ready();
const kept = await page.evaluate(() => ({ create: boardWorld.phaser.scene.isActive('create'), name: boardWorld.game?.me.name }));
check('a reload with a save skips the character screen', !kept.create && kept.name === 'Driver', JSON.stringify(kept));
let c = await cam();
console.log('start', JSON.stringify(c));
check('follow zoom 0.8 at start, following', c.zoom === 0.8 && c.following === true && c.mapLabel === 'Map', JSON.stringify(c));
check('token centred in the band (as far as the bounds allow)', centredOn(c, c.token), `view centre ${c.wv.x + c.wv.w / 2},${c.wv.y + c.wv.h / 2} token ${c.token.x},${c.token.y} reachable ${JSON.stringify(clampedCentre(c, c.token))}`);
await shot('1-start-follow');

// Overview and back.
await page.evaluate(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(600);
c = await cam();
check('overview: min zoom, whole island in view, label Back', Math.abs(c.zoom - 412 / 1400) < 0.002 && c.wv.x <= 0 && c.wv.x + c.wv.w >= 1400 && c.wv.y <= 0 && c.wv.y + c.wv.h >= 1850 && c.mapLabel === 'Back', JSON.stringify(c));
await shot('2-overview');
await page.evaluate(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(700);
c = await cam();
check('back: follow zoom and following', c.zoom === 0.8 && c.following === true && c.mapLabel === 'Map', JSON.stringify(c));

// Roll: from Ashford every roll has three ways to go, so the choices are framed.
await page.evaluate(() => boardWorld.phaser.scene.getScene('board').roll());
await settle();
c = await cam();
check('roll frames the choices: following stopped, zoom under follow zoom', c.choices && c.choices.length >= 2 && c.following === false && c.zoom <= 0.8, JSON.stringify(c));
const spaces = await page.evaluate(() => Object.fromEntries(Object.values(boardWorld.game.state.board.spaces).map((s) => [s.id, { x: s.x, y: s.y }])));
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
check('drag pans: following stopped, scroll moved against the finger (y stops at the top bound)', c.following === false && dxWorld < -60 && dxWorld > -82 && (dyWorld < -100 || (c.wv.y === 0 && dyWorld < 0)) && c.choices && c.choices.length >= 2, `scroll moved ${dxWorld.toFixed(0)},${dyWorld.toFixed(0)} design px (finger +80,+120; the first 8 px arm the drag), view y ${c.wv.y}`);
await shot('4-after-drag');

// A drag that ends on a lit space must not pick it.
let target = c.choices[0];
let pos = await worldToScreen(spaces[target].x, spaces[target].y);
await touch('touchStart', [{ x: pos.x - 60, y: pos.y - 60 }]);
for (let i = 1; i <= 6; i++) { await touch('touchMove', [{ x: pos.x - 60 + i * 10, y: pos.y - 60 + i * 10 }]); await sleep(20); }
await touch('touchEnd', []);
await sleep(200);
c = await cam();
check('a drag ending on a lit space is not a tap', c.choices && c.choices.length >= 2 && c.steps > 0, JSON.stringify({ choices: c.choices, steps: c.steps }));

// Tap a lit space: the move is sent, the camera returns to the follow zoom and follows the walk.
// The drags may have scrolled the lit spaces out of the band, so frame them again first (as a fresh roll does).
await page.evaluate(() => { const s = boardWorld.phaser.scene.getScene('board'); s.frame([s.token, ...[...s.choices.keys()].map((id) => boardWorld.game.state.board.spaces[id])]); });
await settle();
c = await cam();
target = (await pickChoice(['treasure', 'event', 'shrine', 'town', 'shop', 'quest', 'bossgate'])) ?? c.choices[1];
pos = await worldToScreen(spaces[target].x, spaces[target].y);
console.log('tapping', target, 'at', pos, 'view', c.wv);
await touch('touchStart', [{ x: pos.x, y: pos.y }]);
await sleep(40);
await touch('touchEnd', []);
await sleep(150);
c = await cam();
check('tap sends the move at once and follows again', c.me === target && c.steps === 0 && c.following === true && c.choices === null, JSON.stringify({ me: c.me, following: c.following }));
await sleep(2200);
await settle();
const fought = await finishFight();
await settle();
c = await cam();
check('after the walk: follow zoom, token centred, the outcome in the message', c.zoom === 0.8 && centredOn(c, c.token, 4) && /Landed on|Beat the|wake in|got away/.test(c.message), JSON.stringify({ fought, ...c }));
await shot('5-after-walk');

// Pinch: two fingers apart zooms in, clamped at 1.4; together zooms out.
await touch('touchStart', [{ x: 180, y: 420, id: 0 }, { x: 230, y: 480, id: 1 }]);
await sleep(30);
for (let i = 1; i <= 8; i++) { await touch('touchMove', [{ x: 180 - i * 12, y: 420 - i * 12, id: 0 }, { x: 230 + i * 12, y: 480 + i * 12, id: 1 }]); await sleep(20); }
await touch('touchEnd', []);
await sleep(150);
c = await cam();
check('pinch out zooms in (clamped at 1.4)', c.zoom > 0.8 && c.zoom <= 1.4, `zoom ${c.zoom}`);
await shot('6-pinched-in');
await touch('touchStart', [{ x: 100, y: 300, id: 0 }, { x: 300, y: 600, id: 1 }]);
await sleep(30);
for (let i = 1; i <= 8; i++) { await touch('touchMove', [{ x: 100 + i * 20, y: 300 + i * 30, id: 0 }, { x: 300 - i * 20, y: 600 - i * 30, id: 1 }]); await sleep(20); }
await touch('touchEnd', []);
await sleep(150);
const pinchedOut = await cam();
check('pinch in zooms out', pinchedOut.zoom < c.zoom, `zoom ${c.zoom} -> ${pinchedOut.zoom}`);

// Wheel: a notch is 10 percent.
await page.mouse.move(206, 450);
await page.mouse.wheel(0, 100);
await sleep(100);
c = await cam();
check('wheel down zooms out by a tenth', Math.abs(c.zoom - pinchedOut.zoom / 1.1) < 0.01, `zoom ${pinchedOut.zoom} -> ${c.zoom}`);
await page.mouse.wheel(0, -100);
await sleep(100);

// Hub names hide below zoom 0.45.
const namesAt = async (z) => { await page.evaluate((z) => boardWorld.phaser.scene.getScene('board').cameras.main.setZoom(z), z); await sleep(80); return page.evaluate(() => boardWorld.phaser.scene.getScene('board').names.map((n) => n.visible)); };
const shown = await namesAt(0.5);
const hidden = await namesAt(0.4);
check('hub names shown at 0.5, hidden at 0.4', shown.every(Boolean) && hidden.every((v) => !v) && shown.length === 11, `${shown.length} names`);
await page.evaluate(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(500);
await page.evaluate(() => boardWorld.phaser.scene.getScene('board').toggleMap());
await sleep(600);

// Reload mid-choice: the choice is lit again.
await page.evaluate(() => boardWorld.phaser.scene.getScene('board').roll());
await settle();
c = await cam();
for (let i = 0; i < 5 && !c.choices; i++) {
  console.log('single path roll; rolling again after the walk');
  await sleep(2500);
  await settle();
  await finishFight();
  await page.evaluate(() => boardWorld.phaser.scene.getScene('board').roll());
  await settle();
  c = await cam();
}
const litBefore = c.choices;
await page.reload();
await ready();
c = await cam();
const ringsLit = await page.evaluate(() => [...boardWorld.phaser.scene.getScene('board').rings.values()].filter((r) => r.visible).length);
check('reload mid-choice relights the same choice and frames it', litBefore && c.choices && c.choices.join() === litBefore.join() && ringsLit === c.choices.length && c.following === false && c.steps > 0, JSON.stringify({ litBefore, after: c.choices, ringsLit }));
await shot('7-reload-mid-choice');

// A version-1 save (the ring) opens on the island, the character on Ashford.
await page.evaluate(() => {
  const v1 = { version: 1, seed: 'old-seed', board: { start: 's0', spaces: { s0: { id: 's0', kind: 'town', name: 'Ashford', x: 206, y: 715, links: ['s11', 's1'] } } }, characters: { local: { id: 'local', name: 'Robin', classId: 'warrior', hp: 77, maxHp: 120, attack: 12, defense: 8, gold: 95, space: 's7', steps: 3 } }, die: { sides: 6, last: 3 } };
  localStorage.setItem('boardworld.save', JSON.stringify({ version: 1, state: v1, rng: 123456 }));
});
await page.reload();
await ready();
const migrated = await page.evaluate(() => ({ version: boardWorld.game.state.version, space: boardWorld.game.me.space, hp: boardWorld.game.me.hp, gold: boardWorld.game.me.gold, steps: boardWorld.game.me.steps, seed: boardWorld.game.state.seed, start: boardWorld.game.state.board.start, stats: boardWorld.phaser.scene.getScene('hud').stats.text }));
check('a version-1 save opens at the current version on the island with hp and gold kept', migrated.version === STATE_VERSION && migrated.space === 'ashford' && migrated.hp === 77 && migrated.gold === 95 && migrated.steps === 0 && migrated.seed === 'old-seed', JSON.stringify(migrated));

// HUD: the Space line shows a kind for an unnamed space.
await page.evaluate(() => boardWorld.phaser.scene.getScene('board').roll());
await settle();
c = await cam();
if (c.choices) {
  const id = (await pickChoice(['treasure', 'event', 'shrine'])) ?? c.choices[0];
  await page.evaluate((id) => { const s = boardWorld.phaser.scene.getScene('board'); s.frame([s.token, boardWorld.game.state.board.spaces[id]]); }, id);
  await settle();
  const p = await worldToScreen(spaces[id].x, spaces[id].y);
  await tapAt(p.x, p.y);
}
await sleep(2400);
await settle();
const hudFought = await finishFight();
const hud = await page.evaluate(() => ({ stats: boardWorld.phaser.scene.getScene('hud').stats.text, message: boardWorld.phaser.scene.getScene('hud').message.text, me: boardWorld.game.me.space }));
check('HUD shows the kind for an unnamed space and the message says the landing or the fight', /Space (Battle|Event|Treasure|Shop|Quest|Shrine|Boss gate|Town)/.test(hud.stats) && /Landed on (a \w+( gate)? space|\w+)|Beat the|wake in|got away/.test(hud.message), JSON.stringify({ hudFought, ...hud }));
await shot('8-landed-road-space');

// The fight: walk onto a battle space (from Ashford most rolls offer one), fight it out with Attack, continue.
for (let i = 0; i < 10 && !(await inFight()); i++) {
  await page.evaluate(() => boardWorld.phaser.scene.getScene('board').roll());
  await settle();
  const pick = await pickChoice(['battle']);
  if (pick) {
    await page.evaluate((id) => { const s = boardWorld.phaser.scene.getScene('board'); s.frame([s.token, boardWorld.game.state.board.spaces[id]]); }, pick);
    await settle();
    const p = await worldToScreen(spaces[pick].x, spaces[pick].y);
    await tapAt(p.x, p.y);
  }
  await sleep(6 * 260 + 600);
  await settle();
}
await sleep(500);
const fightOn = await page.evaluate(() => ({ active: boardWorld.phaser.scene.isActive('fight'), enemy: boardWorld.game.me.fight?.enemy.name, rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha, message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('landing on a battle opens the fight screen and dims Roll', fightOn.active && !!fightOn.enemy && fightOn.rollAlpha < 1 && /blocks the way/.test(fightOn.message), JSON.stringify(fightOn));
await shot('9-fight-open');
await page.reload();
await ready();
await sleep(400);
const reopened = await page.evaluate(() => ({ active: boardWorld.phaser.scene.isActive('fight'), enemy: boardWorld.game.me.fight?.enemy.name }));
check('a reload mid-fight reopens the fight against the same enemy', reopened.active && reopened.enemy === fightOn.enemy, JSON.stringify(reopened));
const beforeFight = await page.evaluate(() => ({ gold: boardWorld.game.me.gold, xp: boardWorld.game.me.xp, hp: boardWorld.game.me.hp, space: boardWorld.game.me.space }));
let roundsPlayed = 0;
await page.waitForFunction(() => !boardWorld.phaser.scene.getScene('fight').busy, null, { timeout: 15000 });
while (roundsPlayed < 20 && (await inFight())) {
  await tapAt(110, 672); // Attack
  roundsPlayed++;
  await sleep(100);
  await page.waitForFunction(() => !boardWorld.phaser.scene.getScene('fight').busy, null, { timeout: 15000 });
  await sleep(100);
}
const afterFight = await page.evaluate(() => ({ fight: boardWorld.game.me.fight, gold: boardWorld.game.me.gold, xp: boardWorld.game.me.xp, hp: boardWorld.game.me.hp, space: boardWorld.game.me.space, outcome: boardWorld.phaser.scene.getScene('fight').outcome?.type, continueVisible: boardWorld.phaser.scene.getScene('fight').continueButton.visible, fightMessage: boardWorld.phaser.scene.getScene('fight').message.text }));
const consistent = afterFight.outcome === 'won' ? afterFight.gold > beforeFight.gold && afterFight.xp > beforeFight.xp : afterFight.outcome === 'died' ? afterFight.gold <= beforeFight.gold && afterFight.space !== beforeFight.space : false;
check('Attack plays rounds until the fight ends and Continue shows; gold and xp follow the outcome', afterFight.fight === null && consistent && afterFight.continueVisible, JSON.stringify({ roundsPlayed, before: beforeFight, after: afterFight }));
await shot('10-fight-over');
await tapAt(206, 704); // Continue
await sleep(400);
const back = await page.evaluate(() => { const s = boardWorld.phaser.scene.getScene('board'); const sp = boardWorld.game.state.board.spaces[boardWorld.game.me.space]; return { active: boardWorld.phaser.scene.isActive('fight'), stats: boardWorld.phaser.scene.getScene('hud').stats.text, message: boardWorld.phaser.scene.getScene('hud').message.text, rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha, tokenOnMe: Math.abs(s.token.x - sp.x) < 1 && Math.abs(s.token.y - (sp.y - 32)) < 1 }; });
check('Continue closes the fight: Roll is back, the HUD shows the level, the token stands where the character is', !back.active && /^Lv \d+ /.test(back.stats) && back.rollAlpha === 1 && /(Beat the|wake in)/.test(back.message) && back.tokenOnMe, JSON.stringify(back));
await shot('11-after-fight');

// The shop: a save standing on Tinker Cart with gold; tap the shop you stand on, buy a potion and a +1, leave.
const stockSave = (patch) => page.evaluate((patch) => {
  const state = structuredClone(boardWorld.game.state);
  Object.assign(state.characters.local, patch);
  localStorage.setItem('boardworld.save', JSON.stringify({ version: 1, state, rng: 424242 }));
}, patch);
await stockSave({ space: 'tinker', steps: 0, gold: 100, items: {}, fight: null, hp: 60 });
await page.reload();
await ready();
await settle();
pos = await worldToScreen(spaces.tinker.x, spaces.tinker.y);
await tapAt(pos.x, pos.y);
await sleep(400);
const shopOpen = await page.evaluate(() => ({ active: boardWorld.phaser.scene.isActive('shop'), rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha }));
check('tapping the shop you stand on opens it and dims Roll', shopOpen.active && shopOpen.rollAlpha < 1, JSON.stringify(shopOpen));
await shot('12-shop');
await tapAt(352, 214); // Buy, first row: the potion
await sleep(150);
await tapAt(352, 214 + 2 * 72); // Buy, third row: +1
await sleep(150);
const bought = await page.evaluate(() => ({ gold: boardWorld.game.me.gold, items: boardWorld.game.me.items, message: boardWorld.phaser.scene.getScene('shop').message.text, stats: boardWorld.phaser.scene.getScene('hud').stats.text }));
check('Buy takes the gold and fills the bag; the HUD follows', bought.gold === 73 && bought.items.potion === 1 && bought.items['plus-one'] === 1 && /Gold 73/.test(bought.stats) && /Bought a \+1 for 12 gold/.test(bought.message), JSON.stringify(bought));
await tapAt(206, 696); // Leave
await sleep(400);
const left = await page.evaluate(() => ({ active: boardWorld.phaser.scene.isActive('shop'), rollAlpha: boardWorld.phaser.scene.getScene('hud').rollButton.alpha, message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('Leave closes the shop and gives Roll back', !left.active && left.rollAlpha === 1 && /Left Tinker Cart/.test(left.message), JSON.stringify(left));

// A dice card: with one in the bag the choice waits even with one way to go, and the +1 chip shows.
await page.evaluate(() => boardWorld.phaser.scene.getScene('board').roll());
await settle();
const chips = await page.evaluate(() => { const row = boardWorld.phaser.scene.getScene('hud').cardRow; const b = row.list[0]; return { n: row.list.length, label: b?.list[1]?.text, x: row.x + (b?.x ?? 0), y: row.y, steps: boardWorld.game.me.steps, choices: !!boardWorld.phaser.scene.getScene('board').choices }; });
check('a pending roll offers the +1 chip and waits for a tap', chips.n === 1 && chips.label === '+1' && chips.choices && chips.steps > 0, JSON.stringify(chips));
await shot('13-dice-card');
await tapAt(chips.x, chips.y);
await sleep(300);
await settle();
const plusOne = await page.evaluate(() => ({ steps: boardWorld.game.me.steps, items: boardWorld.game.me.items, chips: boardWorld.phaser.scene.getScene('hud').cardRow.list.length, die: boardWorld.phaser.scene.getScene('hud').dieText.text, choices: boardWorld.phaser.scene.getScene('board').choices ? [...boardWorld.phaser.scene.getScene('board').choices.keys()].length : 0, message: boardWorld.phaser.scene.getScene('hud').message.text }));
check('the +1 chip adds a step, spends the card, relights the choices and shows the new number', plusOne.steps === chips.steps + 1 && plusOne.items['plus-one'] === undefined && plusOne.chips === 0 && plusOne.die === String(plusOne.steps) && plusOne.choices > 0 && /\+1: now \d+ steps?\./.test(plusOne.message), JSON.stringify(plusOne));

// A potion in a fight: a save in a fight with one in the bag.
await stockSave({ space: 'ashford-millford-1', steps: 0, hp: 30, items: { potion: 1 }, fight: { enemy: { id: 'slime', name: 'Slime', hp: 30, maxHp: 30, attack: 6, defense: 2, xp: 6, gold: 8 }, round: 1, charged: false } });
await page.reload();
await ready();
await sleep(400);
const potionShown = await page.evaluate(() => ({ active: boardWorld.phaser.scene.isActive('fight'), visible: boardWorld.phaser.scene.getScene('fight').potionButton.visible, label: boardWorld.phaser.scene.getScene('fight').potionLabel.text }));
check('a fight with a potion in the bag shows the Potion button', potionShown.active && potionShown.visible && potionShown.label === 'Potion', JSON.stringify(potionShown));
await tapAt(206, 612);
await sleep(100);
await page.waitForFunction(() => !boardWorld.phaser.scene.getScene('fight').busy, null, { timeout: 15000 });
await sleep(100);
const drank = await page.evaluate(() => ({ hp: boardWorld.game.me.hp, potion: boardWorld.game.me.items.potion, visible: boardWorld.phaser.scene.getScene('fight').potionButton.visible, round: boardWorld.game.me.fight?.round, message: boardWorld.phaser.scene.getScene('fight').message.text }));
check('Potion heals, is spent and hides, and the enemy still struck', drank.hp > 30 && drank.potion === undefined && !drank.visible && drank.round === 2, JSON.stringify(drank));
await shot('14-fight-potion');
await finishFight();

// reset() throws the save away: the next load is the character screen again.
await page.evaluate(() => boardWorld.game.reset());
await page.reload();
await page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.isActive('create'), null, { timeout: 15000 });
check('reset then reload shows the character screen again', true);

const logErrors = await page.evaluate(() => boardWorld.log.errorCount);
const fps = await page.evaluate(() => boardWorld.phaser.loop.actualFps.toFixed(0));
check('no page errors and none in the game log', errors.length === 0 && logErrors === 0, `${errors.join(' | ')} log errors ${logErrors}, renderer ${c.renderer === 1 ? 'canvas' : 'webgl'}, fps ${fps} (software GL here)`);
await browser.close();
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
