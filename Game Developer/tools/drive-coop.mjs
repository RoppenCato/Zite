// Two phones in one world (the skill shared-world, rule 9: multiplayer is tested with two browser windows from the first
// shared feature). Starts the real server on a port of its own with a database of its own, serves the built client, and
// drives two headless phones through it: each makes a character on the server, each sees the other arrive, stand and
// move; a reload comes back as the same character; the server is stopped and started and the phones reconnect; a third
// phone brings a character over with its recovery code; a note left by one is read by the other; a world boss planted
// in the database is fought by one while the other watches its shared HP drop. Screenshots land in tools/out/coop/.
//
//   npm run build && npm run preview &
//   node tools/drive-coop.mjs [pageUrl] [serverPort]
//
// Needs Chromium through Playwright, like drive-board.mjs. Exits 1 when a check fails.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const OUT = fileURLToPath(new URL('./out/coop/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const PAGE = process.argv[2] ?? 'http://localhost:4173/';
const PORT = Number(process.argv[3] ?? 8790);
const SERVER_URL = `ws://localhost:${PORT}`;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DB_DIR = mkdtempSync(join(tmpdir(), 'zite-coop-'));
const DB_PATH = join(DB_DIR, 'world.db');
const B = { map: [60, 836], world: [158, 836], bag: [256, 836], log: [354, 836], roll: [206, 884] };
const F = { a: [108, 744], cont: [206, 802] }; // FightScene FIGHT_BUTTONS: Attack, then Block in the same slot; Continue
const WORLD_BOSS_HP = 1375;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };

// ---- the server, as a child process, restartable ---------------------------------------------------------------------
let server = null;
const serverLines = [];
async function startServer() {
  server = spawn(process.execPath, ['server/src/index.ts'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), DB_PATH }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', (d) => serverLines.push(...String(d).trim().split('\n')));
  server.stderr.on('data', (d) => serverLines.push(`ERR ${String(d).trim()}`));
  for (let i = 0; i < 100; i++) {
    if (serverLines.some((l) => l.includes('listening'))) return;
    await sleep(100);
  }
  throw new Error(`server did not start: ${serverLines.join(' | ')}`);
}
async function stopServer() {
  if (!server) return;
  const s = server;
  server = null;
  const gone = new Promise((r) => s.once('exit', r));
  s.kill('SIGTERM');
  await Promise.race([gone, sleep(3000)]);
  serverLines.length = 0;
}
await startServer();

// ---- two phones -------------------------------------------------------------------------------------------------------
const browser = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
async function phone(name) {
  const context = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${name} pageerror: ${e.message}`));
  // The browser itself logs a failed socket while the server is down; that is the reconnect at work, not an error of ours.
  page.on('console', (m) => { if (m.type() === 'error' && !/WebSocket connection to .* failed/.test(m.text())) errors.push(`${name} console: ${m.text()}`); });
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id ?? 0 })) });
  const tapAt = async (x, y) => { await touch('touchStart', [{ x, y }]); await sleep(40); await touch('touchEnd', []); await sleep(60); };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const ready = async () => { await page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.getScene('hud')?.message?.text, null, { timeout: 20000 }); await sleep(500); };
  const shot = (file) => page.screenshot({ path: `${OUT}/${file}.png` });
  const me = () => ev(() => ({ player: boardWorld.game?.player, name: boardWorld.game?.me.name, space: boardWorld.game?.me.space, steps: boardWorld.game?.me.steps, fight: boardWorld.game?.me.fight ? { enemy: boardWorld.game.me.fight.enemy.name, hp: boardWorld.game.me.fight.enemy.hp, shared: !!boardWorld.game.me.fight.shared } : null, link: boardWorld.game?.link(), others: Object.values(boardWorld.game?.state.characters ?? {}).filter((c) => c.id !== boardWorld.game.player).map((c) => ({ id: c.id, name: c.name, space: c.space })), marks: [...boardWorld.phaser.scene.getScene('board').others.keys()], spawnMarks: boardWorld.phaser.scene.getScene('board').spawnMarks.size, traceMarks: [...boardWorld.phaser.scene.getScene('board').traceMarks.keys()], linkText: boardWorld.phaser.scene.getScene('hud').linkText.text, place: boardWorld.phaser.scene.getScene('hud').place.text, message: boardWorld.phaser.scene.getScene('hud').message.text }));
  /** Wait until the page's view of the world satisfies `pred`. */
  const until = async (pred, ms = 8000) => { const t0 = Date.now(); let last; while (Date.now() - t0 < ms) { last = await me(); if (pred(last)) return last; await sleep(150); } return last; };
  return { name, page, context, tapAt, ev, ready, shot, me, until };
}

const a = await phone('A');
const b = await phone('B');
const url = `${PAGE}?server=${encodeURIComponent(SERVER_URL)}`;

// A makes a character on the server.
await a.page.goto(url);
await a.page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.isActive('create'), null, { timeout: 20000 });
await sleep(300);
const createA = await a.ev(() => ({ where: [...boardWorld.phaser.scene.getScene('create').children.list].find((o) => o.text && /world at/.test(o.text))?.text, code: [...boardWorld.phaser.scene.getScene('create').children.list].flatMap((o) => (o.list ? o.list : [o])).some((o) => o.text === 'I have a code from another phone'), server: boardWorld.server }));
check('with ?server= the character screen says where the world is and offers the code from another phone', /world at ws:\/\/localhost/.test(createA.where ?? '') && createA.code && createA.server === SERVER_URL, JSON.stringify(createA));
await a.shot('0-create-online');
await a.page.fill('#game input', 'Anna');
await a.tapAt(206, 420); // the second card: Trickster
await a.tapAt(206, 812); // Begin
await a.ready();
const joinedA = await a.me();
const accountA = await a.ev(() => JSON.parse(localStorage.getItem('boardworld.account') ?? 'null'));
check('Begin makes the account on the server: Anna the Trickster at Puddlewick Village, online alone, the token and the code kept on the phone', joinedA.name === 'Anna' && joinedA.space === 'ashford' && joinedA.link?.kind === 'online' && joinedA.link.online === 1 && joinedA.linkText === 'online' && /^p-/.test(accountA?.player ?? '') && typeof accountA?.token === 'string' && /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(accountA?.recovery ?? ''), JSON.stringify({ joinedA, accountA }));
await a.shot('1-a-alone');

// B joins: both see each other.
await b.page.goto(url);
await b.page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.isActive('create'), null, { timeout: 20000 });
await sleep(300);
await b.page.fill('#game input', 'Bo');
await b.tapAt(206, 812); // Begin, the Knight
await b.ready();
const joinedB = await b.me();
check('B joins as Bo the Knight and sees Anna standing at Puddlewick Village, online two', joinedB.name === 'Bo' && joinedB.others.length === 1 && joinedB.others[0].name === 'Anna' && joinedB.others[0].space === 'ashford' && joinedB.marks.length === 1 && joinedB.link?.online === 2 && joinedB.linkText === 'online · 2 here', JSON.stringify(joinedB));
const sawB = await a.until((m) => m.others.length === 1 && m.link?.online === 2);
check('A hears Bo arrive: a mark for him, "with Bo" in the place line, the link says two, a line in the message', sawB.others[0]?.name === 'Bo' && sawB.marks.length === 1 && sawB.linkText === 'online · 2 here' && /with Bo/.test(sawB.place) && /Bo the Knight has joined the world/.test(sawB.message), JSON.stringify(sawB));
await a.shot('2-a-sees-b');

// A rolls and walks; B sees Anna move.
await a.tapAt(...B.roll);
await sleep(400);
const rolledA = await a.until((m) => m.steps > 0 || m.space !== 'ashford');
if (rolledA.steps > 0) {
  // More than one place to go: take the first lit spot.
  const choice = await a.ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const id = [...s.choices.keys()][0]; const sp = boardWorld.game.state.board.spaces[id]; const c = s.cameras.main; return { id, x: (sp.x - c.worldView.x) * c.zoom, y: 100 + (sp.y - c.worldView.y) * c.zoom }; });
  await a.tapAt(choice.x, choice.y);
}
const movedA = await a.until((m) => m.space !== 'ashford' && m.steps === 0, 10000);
check('A rolls on the server and walks: the die was thrown there, the token moved here', movedA.space !== 'ashford' && movedA.steps === 0, JSON.stringify(movedA));
const sawMove = await b.until((m) => m.others[0]?.space === movedA.space);
check('B sees Anna\'s mark move to where she landed, without doing anything', sawMove.others[0]?.space === movedA.space && sawMove.marks.length === 1, JSON.stringify(sawMove));
await b.shot('3-b-sees-a-move');
// Whatever A landed in: a fight, a question or a shop is finished so the next steps find her free.
await settle(a);
/** Finish whatever a phone's landing brought: a fight (Attack and Block to the end, Continue), a shop (Leave), a question (the first chip). */
async function settle(p) {
  for (let i = 0; i < 60; i++) {
    const st = await p.ev(() => ({ fight: !!boardWorld.game.me.fight, offer: !!boardWorld.game.me.offer || boardWorld.game.me.picks.length > 0, shop: boardWorld.phaser.scene.isActive('shop'), fightScene: boardWorld.phaser.scene.isActive('fight'), fightBusy: boardWorld.phaser.scene.getScene('fight')?.busy, outcome: !!boardWorld.phaser.scene.getScene('fight')?.outcome }));
    if (st.fightScene) {
      if (st.fightBusy) { await sleep(300); continue; }
      if (st.outcome) { await p.tapAt(206, 802); await sleep(400); continue; }
      await p.tapAt(110, 600); await sleep(150); await p.tapAt(110, 600); await sleep(600); // Attack, Block, the round's playback
      continue;
    }
    if (st.shop) { await p.tapAt(206, 706); await sleep(300); continue; } // Leave
    if (st.offer) { await p.ev(() => boardWorld.phaser.scene.getScene('hud').chipRow.list[0]?.emit('pointerdown')); await sleep(400); continue; }
    if (st.fight) { await sleep(300); continue; } // the fight scene is on its way
    return;
  }
}

// A reloads: the token on the phone brings the same character back, through the connect screen.
await a.page.reload();
const connecting = await a.page.waitForFunction(() => window.boardWorld && (boardWorld.phaser.scene.isActive('connect') || boardWorld.phaser.scene.isActive('board')), null, { timeout: 20000 }).then(() => a.ev(() => boardWorld.phaser.scene.isActive('connect')));
await a.ready();
const backA = await a.me();
check('a reload on A goes through the connect screen and comes back as the same character, where she stood', backA.player === accountA.player && backA.name === 'Anna' && backA.space === movedA.space && backA.link?.online === 2, JSON.stringify({ connecting, backA }));

// The server stops: both phones say so; it starts again: both are back without a tap.
await stopServer();
const downA = await a.until((m) => m.link?.kind === 'connecting', 15000);
check('the server stops: the HUD says reconnecting', downA.link?.kind === 'connecting' && /connecting|reconnecting/.test(downA.linkText), JSON.stringify(downA));
await a.shot('4-a-reconnecting');
await startServer();
const upA = await a.until((m) => m.link?.kind === 'online', 30000);
const upB = await b.until((m) => m.link?.kind === 'online', 30000);
check('the server starts again: both phones reconnect on their own, with a fresh snapshot, the same characters', upA.link?.kind === 'online' && upB.link?.kind === 'online' && upA.name === 'Anna' && upB.name === 'Bo' && upA.space === movedA.space && upA.link.online === 2, JSON.stringify({ upA: upA.link, upB: upB.link }));

// B rolls after the reconnect: the server still answers, and A sees it.
await b.tapAt(...B.roll);
await sleep(400);
const rolledB = await b.until((m) => m.steps > 0 || m.space !== 'ashford');
if (rolledB.steps > 0) {
  const choice = await b.ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const id = [...s.choices.keys()][0]; const sp = boardWorld.game.state.board.spaces[id]; const c = s.cameras.main; return { id, x: (sp.x - c.worldView.x) * c.zoom, y: 100 + (sp.y - c.worldView.y) * c.zoom }; });
  await b.tapAt(choice.x, choice.y);
}
const movedB = await b.until((m) => m.space !== 'ashford' && m.steps === 0, 10000);
const sawMoveB = await a.until((m) => m.others[0]?.space === movedB.space);
check('after the reconnect B rolls and walks, and A sees Bo\'s mark move', movedB.space !== 'ashford' && sawMoveB.others[0]?.space === movedB.space, JSON.stringify({ movedB: movedB.space, sawMoveB: sawMoveB.others }));
await settle(b);

// A third phone brings Anna over with her code; Anna's own phone still works.
const c = await phone('C');
c.page.on('dialog', (d) => d.accept(accountA.recovery.toLowerCase()));
await c.page.goto(url);
await c.page.waitForFunction(() => window.boardWorld && boardWorld.phaser.scene.isActive('create'), null, { timeout: 20000 });
await sleep(300);
await c.tapAt(206, 872); // I have a code from another phone
await c.ready();
const recovered = await c.me();
const accountC = await c.ev(() => JSON.parse(localStorage.getItem('boardworld.account') ?? 'null'));
check('a third phone with the code is Anna too, where she stands, with a token of its own; online still two players', recovered.player === accountA.player && recovered.name === 'Anna' && recovered.space === movedA.space && accountC?.token && accountC.token !== accountA.token && recovered.link?.online === 2, JSON.stringify({ recovered, sameToken: accountC?.token === accountA.token }));
await c.shot('5-c-recovered');

// The settings say where the world is and show the code.
await a.tapAt(...B.world);
await sleep(300);
await a.tapAt(276, 126); // Settings
await sleep(200);
const settingsA = await a.ev(() => [...boardWorld.phaser.scene.getScene('atlas').children.list].filter((o) => o.text).map((o) => o.text).filter((t) => /Online at|Your code/.test(t)));
check('the settings show the world\'s address with the players here, and the account\'s code', settingsA.some((t) => /Online at ws:\/\/localhost/.test(t) && /2 players here/.test(t)) && settingsA.some((t) => t.includes(accountA.recovery)), JSON.stringify(settingsA));
await a.shot('6-settings-online');

await a.tapAt(364, 126); // Close the atlas
await sleep(300);

// ---- the shared world: notes, and a world boss fought by one while the other watches ----------------------------------
// The server is stopped, a world boss is planted on every free wild spot of the meadows straight in the database (there is
// no action that makes one: the tick brings it now and then), and the server is started again; both phones reconnect.
await stopServer();
const { default: Database } = await import('better-sqlite3');
{
  const db = new Database(DB_PATH);
  const row = db.prepare("SELECT state FROM regions WHERE id = 'region-0'").get();
  const state = JSON.parse(row.state);
  const standing = new Set(Object.values(state.characters).map((ch) => ch.space));
  let planted = 0;
  for (const sp of Object.values(state.board.spaces)) {
    if (sp.area === 'meadows' && sp.kind === 'normal' && !standing.has(sp.id) && !state.spawns[sp.id]) {
      state.spawns[sp.id] = { kind: 'worldboss', enemy: 'thornwood-warden', until: Date.now() + 3_600_000, hp: WORLD_BOSS_HP, maxHp: WORLD_BOSS_HP, hitters: {} };
      planted++;
    }
  }
  db.prepare("UPDATE regions SET state = ?, version = version + 1 WHERE id = 'region-0'").run(JSON.stringify(state));
  db.close();
  console.log(`planted ${planted} world bosses`);
}
await startServer();
const bossesA = await a.until((m) => m.link?.kind === 'online' && m.spawnMarks > 5, 30000);
const bossesB = await b.until((m) => m.link?.kind === 'online' && m.spawnMarks > 5, 30000);
check('after the restart both phones draw the planted world bosses as badges', bossesA.spawnMarks > 5 && bossesB.spawnMarks === bossesA.spawnMarks, JSON.stringify({ a: bossesA.spawnMarks, b: bossesB.spawnMarks }));
await a.shot('7-world-bosses');

// A taps her own spot: the hint, and the notes as chips; the first chip leaves "Danger!".
const ownSpot = await a.ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const sp = boardWorld.game.state.board.spaces[boardWorld.game.me.space]; const c = s.cameras.main; return { id: sp.id, x: (sp.x - c.worldView.x) * c.zoom, y: 100 + (sp.y - c.worldView.y) * c.zoom }; });
await a.tapAt(ownSpot.x, ownSpot.y);
await sleep(300);
const chips = await a.ev(() => { const hud = boardWorld.phaser.scene.getScene('hud'); return { texts: hud.chipRow.list.map((ch) => ch.list[1]?.text), firstX: hud.chipRow.x + (hud.chipRow.list[0]?.x ?? 0), y: hud.chipRow.y, message: hud.message.text }; });
check('a tap on her own spot gives the hint and the four notes as chips', JSON.stringify(chips.texts) === '["Danger!","Loot here","Boss near","Help!"]' && /Leave a note here\?/.test(chips.message), JSON.stringify(chips));
await a.tapAt(chips.firstX, chips.y);
const noted = await a.until((m) => m.traceMarks.includes(ownSpot.id));
check('the first chip leaves the note: the message says so and the spot gets its mark', /You leave a note here: "Danger!"/.test(noted.message) && noted.traceMarks.includes(ownSpot.id), JSON.stringify({ message: noted.message, marks: noted.traceMarks }));
const readB = await b.until((m) => m.traceMarks.includes(ownSpot.id));
const hintB = await b.ev(({ id }) => boardWorld.rules.hintFor(boardWorld.game.state, id, boardWorld.game.player, boardWorld.game.now()), { id: ownSpot.id });
check('B gets the note: the mark on his board, the line in his message, and the hint reads it', readB.traceMarks.includes(ownSpot.id) && /Anna left a note at/.test(readB.message) && /Notes here: Anna: "Danger!" \(just now\)/.test(hintB), JSON.stringify({ message: readB.message, hint: hintB }));
await b.shot('8-b-reads-note');

// A rolls onto a world boss (every wild spot has one): the fight screen says so; one round, and B sees the HP drop.
let fightA = null;
for (let attempt = 0; attempt < 4 && !fightA; attempt++) {
  await a.tapAt(...B.roll);
  await sleep(400);
  const rolled = await a.until((m) => m.steps > 0 || m.fight || m.space !== ownSpot.id);
  if (rolled.steps > 0) {
    const choice = await a.ev(() => { const s = boardWorld.phaser.scene.getScene('board'); const st = boardWorld.game.state; const ids = [...s.choices.keys()]; const id = ids.find((x) => st.spawns[x]?.kind === 'worldboss') ?? ids[0]; const sp = st.board.spaces[id]; const c = s.cameras.main; return { id, x: (sp.x - c.worldView.x) * c.zoom, y: 100 + (sp.y - c.worldView.y) * c.zoom }; });
    await a.tapAt(choice.x, choice.y);
  }
  const landed = await a.until((m) => m.steps === 0 && (m.fight || !boardWorldBusy(m)), 10000);
  if (landed.fight?.shared) fightA = landed;
  else await settle(a);
}
function boardWorldBusy(m) { return m.message === ''; }
if (fightA) await a.page.waitForFunction(() => boardWorld.phaser.scene.isActive('fight') && boardWorld.phaser.scene.getScene('fight').children.list.length > 5, null, { timeout: 15000 });
await sleep(300);
const header = fightA ? await a.ev(() => [...boardWorld.phaser.scene.getScene('fight').children.list].find((o) => o.text && /world boss/.test(o.text))?.text ?? '') : '';
check('A lands on a world boss: the fight is the shared one and the screen says world boss', !!fightA?.fight?.shared && fightA.fight.hp === WORLD_BOSS_HP && /world boss/.test(header), JSON.stringify({ fight: fightA?.fight, header }));
await a.shot('9-a-world-boss-fight');
await a.tapAt(...F.a); // Attack
await sleep(250);
await a.tapAt(...F.a); // Block
const struck = await a.until((m) => !m.fight || m.fight.hp < WORLD_BOSS_HP, 15000);
const bossSpot = struck.space;
let hpB = null;
for (let i = 0; i < 40 && (hpB === null || hpB >= WORLD_BOSS_HP); i++) {
  hpB = await b.ev(({ id }) => boardWorld.game.state.spawns[id]?.hp ?? null, { id: bossSpot });
  await sleep(150);
}
const badgeB = await b.ev(({ id }) => boardWorld.phaser.scene.getScene('board').spawnMarks.get(id)?.list[2]?.text ?? '', { id: bossSpot });
const hintBoss = await b.ev(({ id }) => boardWorld.rules.hintFor(boardWorld.game.state, id, boardWorld.game.player, boardWorld.game.now()), { id: bossSpot });
check('after one round B sees the shared HP drop in his state, on the badge, and in the hint', hpB !== null && hpB < WORLD_BOSS_HP && hpB === struck.fight?.hp && badgeB === `${hpB} / ${WORLD_BOSS_HP}` && new RegExp(`A world boss, the King Goo, rages here: ${hpB} of ${WORLD_BOSS_HP} HP left`).test(hintBoss), JSON.stringify({ hpB, mine: struck.fight?.hp, badgeB, hintBoss }));
await b.shot('10-b-sees-shared-hp');

const logErrors = await a.ev(() => boardWorld.log.errorCount);
check('no page errors on either phone and none in the game log', errors.length === 0 && logErrors === 0, `${errors.join(' | ')} log errors ${logErrors}`);

await browser.close();
await stopServer();
rmSync(DB_DIR, { recursive: true, force: true });
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
