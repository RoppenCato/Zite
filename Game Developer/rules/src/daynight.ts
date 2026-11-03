// Day and night, counted in die rolls (Robin, 2026-11-03: "should we have a day/night cycle where hours are counted in number
// of die rolls?"; a day of 20 rolls and a night of 10). Each character keeps its own clock: the rolls it has made. At night
// the wild's creatures are stronger and pay more, a town's shop turns into a night merchant, rumours come more often, and a
// town can put you to sleep till morning. Weekly events stay on real days (calendar.ts).

import { PROGRESSION } from './data.ts';
import type { Character } from './types.ts';

export type Phase = 'morning' | 'day' | 'dusk' | 'night';

/** Where the character's clock stands: the day's number, the phase, whether it is night, rolls left in it. */
export function clockOf(c: Pick<Character, 'clock'>): { day: number; phase: Phase; night: boolean; left: number } {
  const { dayRolls, nightRolls } = PROGRESSION.dayNight;
  const turn = dayRolls + nightRolls;
  const rolls = c.clock ?? 0;
  const at = rolls % turn;
  const night = at >= dayRolls;
  const phase: Phase = night ? 'night' : at < dayRolls / 4 ? 'morning' : at < (dayRolls * 3) / 4 ? 'day' : 'dusk';
  return { day: Math.floor(rolls / turn) + 1, phase, night, left: night ? turn - at : dayRolls - at };
}

export function isNight(c: Pick<Character, 'clock'>): boolean {
  return clockOf(c).night;
}

/** The clock at the next morning. */
export function nextMorning(c: Pick<Character, 'clock'>): number {
  const turn = PROGRESSION.dayNight.dayRolls + PROGRESSION.dayNight.nightRolls;
  return (Math.floor((c.clock ?? 0) / turn) + 1) * turn;
}
