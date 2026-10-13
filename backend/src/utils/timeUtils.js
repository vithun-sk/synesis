/**
 * Time utility functions for Phantom Classrooms
 * Ensures all stored and compared timestamps are in UTC, while respecting campus timezone contexts.
 */

// Threshold in minutes after which a sensor reading is considered stale
export const STALE_READING_THRESHOLD_MINUTES = 120;

// Grace period in minutes for pre-cooling or early arrival before a scheduled class starts
export const PRE_COOL_GRACE_PERIOD_MINUTES = 20;

/**
 * Returns current timestamp in UTC ISO format
 */
export function getCurrentUtcIso() {
  return new Date().toISOString();
}

/**
 * Checks if a timestamp is older than the staleness threshold
 * @param {string|Date} recordedAt
 * @param {number} thresholdMinutes
 * @returns {boolean}
 */
export function isReadingStale(recordedAt, thresholdMinutes = STALE_READING_THRESHOLD_MINUTES) {
  if (!recordedAt) return true;
  const recordedTime = new Date(recordedAt).getTime();
  if (isNaN(recordedTime)) return true;
  const now = Date.now();
  const diffMinutes = (now - recordedTime) / (1000 * 60);
  return diffMinutes > thresholdMinutes;
}

/**
 * Calculates minutes elapsed since a given timestamp
 * @param {string|Date} timestamp
 * @returns {number}
 */
export function getMinutesElapsed(timestamp) {
  if (!timestamp) return 0;
  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return 0;
  return Math.max(0, (Date.now() - time) / (1000 * 60));
}

/**
 * Checks if a scheduled class is starting soon within the grace period (e.g. pre-cooling)
 * @param {Array<{start_time: string, end_time: string, status: string}>} timetables
 * @param {number} gracePeriodMinutes
 * @returns {boolean}
 */
export function isClassStartingSoon(timetables = [], gracePeriodMinutes = PRE_COOL_GRACE_PERIOD_MINUTES) {
  const now = Date.now();
  const gracePeriodMs = gracePeriodMinutes * 60 * 1000;

  return timetables.some((entry) => {
    if (entry.status !== 'scheduled') return false;
    const startTime = new Date(entry.start_time).getTime();
    return startTime > now && startTime - now <= gracePeriodMs;
  });
}

/**
 * Checks if a class is actively in session according to timetable
 * @param {Array<{start_time: string, end_time: string, status: string}>} timetables
 * @returns {boolean}
 */
export function isClassCurrentlyActive(timetables = []) {
  const now = Date.now();

  return timetables.some((entry) => {
    if (entry.status !== 'scheduled') return false;
    const startTime = new Date(entry.start_time).getTime();
    const endTime = new Date(entry.end_time).getTime();
    return now >= startTime && now <= endTime;
  });
}
