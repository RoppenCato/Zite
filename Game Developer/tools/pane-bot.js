// A player for the browser pane: drives the real scenes' methods, from the first roll to a boss, watching for bad numbers,
// two sheets at once and stuck screens. Not part of the game. In the pane, open with ?server=off&mute=1, then:
//   await import('/@fs/C:/dev/Zite/Game Developer/tools/pane-bot.js')
//   bot.start('rogue', 'Tess')     // a fresh character of a class, in this tab's save
//   await bot.run(35000)           // plays for so long; call again; a call stays under 45 s
//   bot.report()
const W = window;
const dist = (a, c) => Math.hypot(a.x - c.x, a.y - c.y);
const P = { log: [], problems: [], rolls: 0, wins: 0, deaths: 0, asks: 0, bossRounds: {}, bossWins: {}, stuck: 0, lastSig: '', gold: [] };
const note = (s) => { P.log.push(s); if (P.log.length > 300) P.log.shift(); };
const problem = (s) => { if (!P.problems.includes(s)) P.problems.push(s); };
const step = (ms) => { const g = W.boardWorld.phaser; for (let i = 0; i < ms / 16; i++) { P.t = (P.t || performance.now()) + 16; g.step(P.t, 16); } };
const wait = () => new Promise((r) => setTimeout(r, 0));

/** The space of the boss of the furthest area open to this character. */
function bossSpace(g, me) {
  const spaces = Object.values(g.state.board.spaces).filter((s) => s.kind === 'boss' && s.boss && me.opened.includes(s.area));
  spaces.sort((a, c) => g.state.board.areas[c.area].tier - g.state.board.areas[a.area].tier);
  return spaces[0] ?? null;
}

async function tick() {
  const sm = W.boardWorld.phaser.scene, g = W.boardWorld.game;
  step(120);
  await wait();
  const b = sm.getScene('board'), me = g.me, r = W.boardWorld.rules, st = r.stats(me);
  if (me.hp > st.maxHp || me.hp < 0 || me.mana < 0 || me.gold < 0 || me.mana > st.maxMana) problem(`numbers hp ${me.hp}/${st.maxHp} mana ${me.mana}/${st.maxMana} gold ${me.gold}`);
  const active = sm.getScenes(true).map((s) => s.sys.settings.key).filter((k) => !['board', 'hud', 'moment'].includes(k));
  if (active.length > 1) problem(`two sheets: ${active}`);
  if (W.boardWorld.log.errors.length) problem(`log error: ${W.boardWorld.log.errors[0]}`);
  const sig = JSON.stringify([me.space, me.hp, me.gold, me.steps, me.xp, active, me.fight?.round, b.busy, sm.isActive('reveal') && sm.getScene('reveal').phase, sm.getScene('fight')?.busy, b.inFlight, b.walking, b.asking]);
  P.stuck = sig === P.lastSig ? P.stuck + 1 : 0;
  P.lastSig = sig;
  if (P.stuck === 150) problem(`stuck ${sig} msg=${sm.getScene('hud').message.text}`);
  if (sm.isActive('reveal')) { const m = sm.getScene('reveal'); if (m.phase === 'resting' || m.phase === 'build') m.tap(); return 'reveal'; }
  if (sm.isActive('fight')) {
    const f = sm.getScene('fight');
    if (f.busy) return 'busy';
    if (f.outcome) {
      note(`L${me.level} ${f.outcome.type}: ${f.outcome.summary.slice(0, 60)}`);
      if (f.outcome.type === 'won') P.wins++;
      if (f.outcome.type === 'died') P.deaths++;
      if (P.fighting?.role === 'boss' && f.outcome.type === 'won') P.bossWins[P.fighting.name] = me.level;
      f.leave();
      return 'left';
    }
    if (!me.fight) return 'wait';
    const e = me.fight.enemy;
    P.fighting = { role: e.role, name: e.name };
    if (e.role === 'boss') P.bossRounds[e.name] = (P.bossRounds[e.name] ?? 0) + 1;
    let move = { kind: 'attack' };
    const heal = ['potion-3', 'potion-2', 'potion'].find((id) => (me.items[id] ?? 0) > 0);
    if (me.hp < st.maxHp * 0.35 && heal) move = { kind: 'item', item: heal };
    else {
      const ids = Object.keys(me.abilities).filter((id) => { const a = r.ABILITIES[id]; return a && me.mana >= a.mana && (!a.meter || (me.fight.meter ?? 0) >= a.meter) && !(a.oncePerFight && me.fight.used?.includes(id)); });
      if (ids.length && Math.random() < 0.6) move = { kind: 'ability', ability: ids[Math.floor(Math.random() * ids.length)] };
    }
    f.pick(move);
    f.act(e.charged || e.next?.charge ? 'block' : ['block', 'brace', 'counter', 'dodge'][Math.floor(Math.random() * 4)]);
    return 'round';
  }
  if (sm.isActive('shop')) {
    const s = sm.getScene('shop');
    if (s.inFlight) return 'shop';
    const tier = g.state.board.areas[g.state.board.spaces[me.space]?.area]?.tier ?? 1;
    const offer = r.shopOffer(g.state, me);
    const line = offer?.lines.find((l) => l === { warrior: 'heavy', rogue: 'light', mage: 'magic', ranger: 'light' }[me.classId]) ?? offer?.lines[0];
    const want = line ? r.SLOTS.filter((x) => (me.equipment[x]?.rank ?? 0) < tier && me.equipment[x]?.rarity !== 'rare' && me.bag.length < 12).map((x) => [x, r.plainGear('p', x, tier, line, me.classId).price]).filter(([, c]) => c <= me.gold) : [];
    if (want.length) { note(`L${me.level} buys rank ${tier} ${line} ${want[0][0]}`); s.buy({ slot: want[0][0], line }); return 'buy'; }
    const flask = ['potion', 'potion-2', 'potion-3'].find((id) => offer?.items.includes(id) && (tier === 1 ? id === 'potion' : id.endsWith(String(Math.min(tier, 3)))));
    if (flask && (me.items[flask] ?? 0) < 3 && me.gold >= r.ITEMS[flask].price + 5) { s.buy({ item: flask }); return 'buy'; }
    b.shopLeft();
    return 'leftshop';
  }
  if (me.offer && !sm.isActive('ask')) return 'waiting-ask';
  if (sm.isActive('ask') && !b.inFlight) {
    P.asks++;
    if (!me.offer) b.answerPath(null);
    else if (me.offer?.kind === 'roll') b.answerRoll();
    else if (me.offer?.kind === 'gamble') b.answerGamble('pass');
    else if (me.offer?.kind === 'board') (me.offer.quests.length ? b.answerQuest(true, 0) : b.answerQuest(false));
    else if (me.offer) b.answerKeep('sell');
    return 'answered';
  }
  if (b.busy && !b.choices_) return 'busy';
  if (b.choices_) {
    const sp = g.state.board.spaces, opts = [...b.choices_.keys()], here = sp[me.space];
    const nearest = (kinds) => Object.values(sp).filter((s) => kinds.includes(s.kind) && me.opened.includes(s.area)).sort((a, c) => dist(a, here) - dist(c, here))[0];
    const tier = g.state.board.areas[here.area]?.tier ?? 1;
    const boss = bossSpace(g, me);
    let t;
    if (me.hp < st.maxHp * 0.5) t = nearest(['church', 'town']);
    else if (me.bag.length < 12 && r.SLOTS.some((x) => (me.equipment[x]?.rank ?? 0) < tier) && me.gold > 60) t = nearest(['shop']);
    else if (boss && me.level >= g.state.board.areas[boss.area].tier * 4) t = boss;
    else t = sp[opts[Math.floor(Math.random() * opts.length)]];
    b.onSpaceTap(opts.sort((a, c) => dist(sp[a], t) - dist(sp[c], t))[0]);
    return 'chose';
  }
  if (!b.busy && !b.inFlight) {
    if (P.stopAt && P.bossWins[P.stopAt]) return 'done';
    b.roll();
    P.rolls++;
    return 'roll';
  }
  return 'idle';
}

W.bot = {
  P,
  start(classId, name = 'Bot', stopAt = 'Grumblebark') {
    const sm = W.boardWorld.phaser.scene, b = sm.getScene('board'), g = W.boardWorld.game;
    const fresh = W.boardWorld.rules.makeCharacter(g.player, name, classId, g.state.board);
    g.state = { ...g.state, spawns: {}, characters: { ...g.state.characters, [g.player]: fresh } };
    Object.assign(P, { log: [], problems: [], rolls: 0, wins: 0, deaths: 0, asks: 0, bossRounds: {}, bossWins: {}, stuck: 0, lastSig: '', stopAt });
    b.placeToken();
    b.setBusy(false);
    b.refreshHud();
    return 'started';
  },
  /** A character already in the forest: level 6 in tin with gold to spend. Saved; reload the page after it, so the board redraws. */
  forest(classId, name = 'Bot') {
    const g = W.boardWorld.game, r = W.boardWorld.rules, areas = g.state.board.areas;
    const forest = Object.values(areas).find((a) => a.tier === 2);
    const town = Object.values(g.state.board.spaces).find((s) => s.area === forest.id && s.kind === 'town');
    let c = r.makeCharacter(g.player, name, classId, g.state.board);
    const equipment = { ...c.equipment };
    r.SLOTS.forEach((s, i) => { equipment[s] = r.plainGear(`t${i}`, s, 2); });
    c = { ...c, level: 8, xp: r.PROGRESSION.xpForLevel[7] ?? c.xp, opened: [...new Set([...c.opened, forest.id])], space: town.id, equipment, gold: 500, items: { ...c.items, potion: 3 } };
    const st = r.stats(c);
    c = { ...c, hp: st.maxHp, mana: st.maxMana };
    g.state = { ...g.state, spawns: {}, characters: { ...g.state.characters, [g.player]: c } };
    g.save();
    location.reload();
  },
  async run(ms = 35000) {
    const end = performance.now() + ms;
    let last = '';
    while (performance.now() < end) {
      last = await tick();
      if (last === 'done') break;
    }
    return { last, ...this.report() };
  },
  report() {
    const me = W.boardWorld.game.me, r = W.boardWorld.rules;
    return { cls: me.classId, level: me.level, hp: me.hp, gold: me.gold, where: me.space, opened: me.opened, rolls: P.rolls, wins: P.wins, deaths: P.deaths, bossRounds: P.bossRounds, bossWins: P.bossWins, worn: r.SLOTS.map((s) => me.equipment[s]?.rank ?? 0).join(''), problems: P.problems, errors: W.boardWorld.log.errors };
  },
};
