import Phaser from 'phaser';
import * as rules from '../../rules/src/index.ts';
import type { GameHolder } from './game-holder.ts';
import { GameLog } from './game-log.ts';
import { audio } from './audio.ts';
import { HIRES_PLUGIN } from './hires.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, SCREEN_WIDTH, DPR } from './layout.ts';
import { LocalGame, TICK_MS } from './local-game.ts';
import { ACCOUNT_KEY, RECOVER_KEY, RemoteGame, serverUrl, storedAccount, type Credentials } from './remote-game.ts';
import { ConnectScene } from './scenes/ConnectScene.ts';
import { CreateScene } from './scenes/CreateScene.ts';
import { SlotsScene } from './scenes/SlotsScene.ts';
import { activeSave, flow, forgetAccount, freeSaveKey, localSlots, onlineSlots, rememberAccount, removeSave, setActiveSave, setFlow, stepOutOfAccount, useAccount } from './slots.ts';
import { playScenes } from './scenes/play.ts';
import { moveAll, receiveMove } from './move.ts';

const log = new GameLog();
log.attach(window);
const note = (line: string): void => log.note(line);

// Where the world is: a server remembered from ?server=… (co-op, the save is the account there), or this phone alone.
const storage = window.localStorage;
const server = serverUrl(storage, location.search);
const account = server ? storedAccount(storage) : null;
const recoverCode = server ? takeRecoverCode(storage) : null;

// The characters on this phone (Robin, 2026-11-02): two or more and the page opens on the list, once a tab; one opens straight on the board.
const slots = server ? onlineSlots(storage) : localSlots(storage);
const way = recoverCode ? 'picked' : flow();
const backToList = (): void => {
  setFlow('choose');
  location.reload();
};
const connect = (credentials: Credentials): Promise<GameHolder> => RemoteGame.connect({ url: server!, storage, credentials, note });
const onlineCreate = (): CreateScene =>
  new CreateScene({
    log,
    where: `the world at ${server}`,
    make: (o) => connect(o),
    recover: (code) => connect({ recover: code }),
    onCreated: (game) => {
      window.boardWorld.game = game;
      rememberAccount(storage, game);
      setFlow('picked');
    },
    back: slots.length ? backToList : null,
  });
const localCreate = (): CreateScene =>
  new CreateScene({
    log,
    where: 'solo play on this phone',
    make: (o) => {
      const key = freeSaveKey(storage);
      setActiveSave(storage, key);
      return Promise.resolve(LocalGame.create(storage, o, key));
    },
    recover: null,
    onCreated: (game) => {
      window.boardWorld.game = game;
      setFlow('picked');
    },
    back: slots.length ? backToList : null,
  });
const listScene = (): SlotsScene =>
  new SlotsScene({
    log,
    where: server ? `the world at ${server}` : 'solo play on this phone',
    online: !!server,
    slots,
    current: server ? (storedAccount(storage)?.token ?? null) : activeSave(storage),
    play: (id) => {
      if (server) useAccount(storage, id);
      else setActiveSave(storage, id);
      setFlow('picked');
      location.reload();
    },
    remove: (id) => {
      if (server) forgetAccount(storage, id);
      else removeSave(storage, id);
      setFlow('choose');
      location.reload();
    },
    make: () => {
      setFlow('new');
      location.reload();
    },
  });

let first: Phaser.Scene[];
let saved: GameHolder | null = null;
if (way === 'new') {
  // A new character; the current one stays on the list.
  if (server) stepOutOfAccount(storage);
  log.note('a new character');
  first = [server ? onlineCreate() : localCreate()];
} else if (slots.length && (way === 'choose' || (way !== 'picked' && slots.length > 1))) {
  first = [listScene()];
} else if (server && (account || recoverCode)) {
  const credentials: Credentials = recoverCode ? { recover: recoverCode } : { token: account!.token };
  log.note(`co-op: ${server}, ${recoverCode ? 'a code from another phone' : `account ${account!.player}`}`);
  first = [
    new ConnectScene({
      log,
      where: server,
      attempt: () => connect(credentials),
      offline: (scene) => {
        const local = LocalGame.load(storage, activeSave(storage));
        log.note(local ? 'playing offline on the local save' : 'playing offline: a new local character');
        if (local) {
          window.boardWorld.game = local;
          for (const { key, scene: s } of playScenes(local, log)) scene.scene.add(key, s, false);
          scene.scene.start('board');
        } else {
          scene.scene.add('create', localCreate(), true);
          scene.scene.stop();
        }
      },
      startOver: (scene) => {
        const lost = storedAccount(storage);
        if (lost) forgetAccount(storage, lost.token);
        try {
          storage.removeItem(ACCOUNT_KEY);
        } catch {
          // nothing to forget
        }
        scene.scene.add('create', onlineCreate(), true);
        scene.scene.stop();
      },
      onConnected: (game) => {
        window.boardWorld.game = game;
        rememberAccount(storage, game);
      },
    }),
  ];
} else if (server) {
  log.note(`co-op: ${server}, no account on this phone yet`);
  first = [onlineCreate()];
} else {
  // A save opens straight on the board; no save opens the character screen, which makes the game and starts the board.
  saved = LocalGame.load(storage, activeSave(storage));
  log.note(saved ? `loaded: ${saved.me.name} the ${saved.me.classId} on ${saved.me.space}, seed ${saved.state.seed}` : 'no save: the character screen');
  first = saved ? playScenes(saved, log).map((s) => s.scene) : [localCreate()];
}

// The UI kit's fonts, before any text is drawn: a short wait, then the system face if they have not come (offline).
await Promise.race([
  Promise.all([document.fonts.load('700 20px Fredoka'), document.fonts.load('400 15px Nunito'), document.fonts.load('700 15px Nunito')]).catch(() => undefined),
  new Promise((resolve) => setTimeout(resolve, 1500)),
]);

const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // The canvas at the phone's pixel density; the scenes still work in the design size (hires.ts).
  width: SCREEN_WIDTH * DPR,
  height: DESIGN_HEIGHT * DPR,
  backgroundColor: COLORS.background,
  banner: false,
  dom: { createContainer: true }, // the name field on the character screen
  scale: {
    mode: Phaser.Scale.FIT,
    // The page's own flex box centres the canvas; Phaser's centring on top of it pushed the game to one side (Robin's picture).
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: first,
  plugins: { scene: [HIRES_PLUGIN] },
});

// For the browser pane and the tools in tools/: drive the game from a script, read the log, reach the rules (to plant a
// state or look a creature up). `game` is null on the character screen and while connecting.
declare global {
  interface Window {
    boardWorld: { game: GameHolder | null; log: GameLog; phaser: Phaser.Game; rules: typeof rules; server: string | null; audio: typeof audio; move: { moveAll: typeof moveAll; receiveMove: typeof receiveMove } };
  }
}
// move: the characters' move to the online app, reachable from the browser pane for a test (2026-11-10).
window.boardWorld = { game: saved, log, phaser, rules, server, audio, move: { moveAll, receiveMove } };

// The world ticks once a minute while the page is open, and when it comes back to the front: spawns come and go (solo);
// with a server the tick only checks the link, and a socket the phone killed in the background is replaced.
const tick = (): void => {
  const game = window.boardWorld.game;
  if (!game) return;
  if (server) rememberAccount(storage, game);
  void game.tick().then((events) => {
    for (const e of events) log.note(e.type === 'spawned' ? `spawned ${e.spawn.kind} at ${e.space}` : e.type === 'despawned' ? `despawned at ${e.space}` : e.type);
  });
};
window.setInterval(tick, TICK_MS);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') tick();
});
window.addEventListener('pageshow', () => tick());
if (saved) tick();

/** A recovery code left by the settings screen for the next load, taken once. */
function takeRecoverCode(s: Storage): string | null {
  try {
    const code = s.getItem(RECOVER_KEY);
    if (code) s.removeItem(RECOVER_KEY);
    return code;
  } catch {
    return null;
  }
}
