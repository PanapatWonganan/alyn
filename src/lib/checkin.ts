/**
 * Daily check-in helpers — Asia/Bangkok day boundary, 7-day cycle.
 *
 * Reward table is locked per docs/mobile-plan.md §7.2 and lives here so
 * the API and admin pages share one source of truth.
 */

const BANGKOK_OFFSET_MINUTES = 7 * 60;

export const CHECK_IN_REWARDS: readonly number[] = [2, 2, 3, 3, 5, 5, 10];

/**
 * Returns the Asia/Bangkok calendar date (with time stripped) for the given
 * instant. We avoid pulling in a tz library by shifting to UTC+7 manually.
 */
export function bangkokDayStart(at: Date = new Date()): Date {
  const ms = at.getTime() + BANGKOK_OFFSET_MINUTES * 60_000;
  const shifted = new Date(ms);
  // shifted is now expressed as if local==Bangkok; strip TOD
  shifted.setUTCHours(0, 0, 0, 0);
  // Convert back to UTC
  return new Date(shifted.getTime() - BANGKOK_OFFSET_MINUTES * 60_000);
}

/** Whole days between two Bangkok day-starts. Always non-negative. */
export function daysBetween(a: Date, b: Date): number {
  const aStart = bangkokDayStart(a).getTime();
  const bStart = bangkokDayStart(b).getTime();
  return Math.round(Math.abs(bStart - aStart) / 86_400_000);
}

/**
 * Given the user's previous lastCheckInDate and current streak, decide what
 * happens *today* (in Bangkok time):
 *   - "claimed_today" → already checked in today, nothing to do
 *   - "next_in_streak" → streakDay = previous + 1 (or 1 if reset/none)
 *
 * Streak resets to 1 if more than 1 calendar day has passed.
 * Streak wraps at 7 → 1 (8th day starts a new cycle).
 */
export interface CheckInDecision {
  alreadyClaimedToday: boolean;
  nextStreakDay: number; // 1..7
  coinsForNextClaim: number;
  resetFromBreak: boolean;
}

export function decideCheckIn(params: {
  now?: Date;
  lastCheckInDate: Date | null | undefined;
  currentStreak: number;
}): CheckInDecision {
  const now = params.now ?? new Date();
  const today = bangkokDayStart(now);
  const last = params.lastCheckInDate
    ? bangkokDayStart(params.lastCheckInDate)
    : null;

  const alreadyClaimedToday = !!last && last.getTime() === today.getTime();
  if (alreadyClaimedToday) {
    const day = wrapStreak(params.currentStreak);
    return {
      alreadyClaimedToday: true,
      nextStreakDay: day,
      coinsForNextClaim: CHECK_IN_REWARDS[day - 1],
      resetFromBreak: false,
    };
  }

  // Not claimed yet today. Determine next streak day.
  let nextStreakDay = 1;
  let resetFromBreak = false;
  if (last) {
    const gap = daysBetween(last, today);
    if (gap === 1) {
      nextStreakDay = wrapStreak(params.currentStreak + 1);
    } else if (gap > 1) {
      // Missed a day: reset
      nextStreakDay = 1;
      resetFromBreak = true;
    } else {
      // gap === 0 should be the alreadyClaimed branch above; defensive
      nextStreakDay = wrapStreak(params.currentStreak);
    }
  }

  return {
    alreadyClaimedToday: false,
    nextStreakDay,
    coinsForNextClaim: CHECK_IN_REWARDS[nextStreakDay - 1],
    resetFromBreak,
  };
}

function wrapStreak(day: number): number {
  if (day <= 0) return 1;
  // 1..7 cycle, 8 -> 1, 14 -> 7, etc.
  const mod = ((day - 1) % 7) + 1;
  return mod;
}
