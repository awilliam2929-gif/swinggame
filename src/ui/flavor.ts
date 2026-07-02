/**
 * Trash talk. The engine is accountable to the penny; this file is not
 * accountable to anyone.
 */

const WINNER_LINES = [
  'Buying drinks tonight, big shot. House rules.',
  'Somebody call the tour, we got a sandbagger over here.',
  'Straight robbery. Check their pockets for extra balls.',
  "Cleaned 'em out like a ball washer.",
  'The bank of buddies thanks you for your hostile withdrawal.',
  'Absolute crime scene. Someone chalk the fairway.',
]

const LOSER_LINES = [
  'Donations accepted every Saturday, apparently.',
  'Your wallet just filed a restraining order.',
  'Thanks for sponsoring the group. Same time next week?',
  "Couldn't buy a putt with someone else's money.",
  'The range called — they want their swing back.',
  'ATM with a glove on. Beautiful to watch.',
]

const SETTLE_LINES = [
  'Pay up. Venmo, cash, or dignity — we take all three.',
  'No IOUs. We watched you order the good beer at the turn.',
  'Settle now, cry later.',
  'The math is done. The excuses are not our department.',
  'Losers pay in the parking lot. Tradition is tradition.',
]

const EMPTY_LINES = [
  'No scores yet. The lies are still being negotiated on the course.',
  'Nothing entered. Everybody shot even par, right? Right.',
  'Scorecards pending. Sandbagging in progress.',
]

function pick(lines: string[], seed: number): string {
  return lines[Math.abs(seed) % lines.length]
}

export function winnerLine(seed: number): string {
  return pick(WINNER_LINES, seed)
}

export function loserLine(seed: number): string {
  return pick(LOSER_LINES, seed)
}

export function settleLine(seed: number): string {
  return pick(SETTLE_LINES, seed)
}

export function emptyLine(seed: number): string {
  return pick(EMPTY_LINES, seed)
}

/** Stable-ish seed from a string so lines don't reshuffle on every render. */
export function seedFrom(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return h
}
