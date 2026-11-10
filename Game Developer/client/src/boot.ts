// The page's first step (2026-11-10): characters moved from the home link arrive in the address (`#move=…`, move.ts) and
// are put into this page's storage before the game starts; then the game starts as always. Nothing else lives here.
import { hasMove, receiveMove } from './move.ts';

async function boot(): Promise<void> {
  if (hasMove(location.hash)) {
    try {
      const n = await receiveMove(window.localStorage, location.hash);
      console.log(`[move] ${n} character(s) moved here`);
    } catch (e) {
      console.error('[move] the characters could not be unpacked', e);
    }
    // The address without the saves, so a reload does not move them twice.
    history.replaceState(null, '', location.pathname + location.search);
  }
  await import('./main.ts');
}

void boot();
