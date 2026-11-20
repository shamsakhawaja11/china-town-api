/**
 * Small helpers to work with the restaurant's local time zone without
 * pulling in a date library. Opening/closing hours are stored as plain
 * "HH:mm" wall-clock times, so we compare them with the wall-clock time
 * of a moment in the restaurant's zone.
 */

/** Offset of `timeZone` from UTC at `date`, in minutes (e.g. +300 for Asia/Karachi). */
export function zoneOffsetMinutes(date: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return Math.round((asUtc - date.getTime()) / 60000);
}

/** Wall-clock "HH:mm" of `date` in `timeZone`. */
export function localTimeHHmm(date: Date, timeZone: string): string {
    const local = new Date(date.getTime() + zoneOffsetMinutes(date, timeZone) * 60000);
    return local.toISOString().slice(11, 16);
}

/** Local calendar date "YYYY-MM-DD" of `date` in `timeZone`. */
export function localDateString(date: Date, timeZone: string): string {
    const local = new Date(date.getTime() + zoneOffsetMinutes(date, timeZone) * 60000);
    return local.toISOString().slice(0, 10);
}

/** [start, end) of the local day (in `timeZone`) that contains `date`, as UTC instants. */
export function localDayRange(date: Date, timeZone: string): { start: Date; end: Date } {
    const day = localDateString(date, timeZone);
    return dayRangeFromLocalDate(day, timeZone);
}

/** [start, end) for a local calendar day given as "YYYY-MM-DD". */
export function dayRangeFromLocalDate(day: string, timeZone: string): { start: Date; end: Date } {
    const midnightUtcGuess = new Date(`${day}T00:00:00.000Z`);
    const offset = zoneOffsetMinutes(midnightUtcGuess, timeZone);
    const start = new Date(midnightUtcGuess.getTime() - offset * 60000);
    const end = new Date(start.getTime() + 24 * 60 * 60000);
    return { start, end };
}

/** "HH:mm" of a Postgres TIME column (Prisma returns it as 1970-01-01T..Z). */
export function timeColumnToHHmm(value: Date): string {
    return value.toISOString().slice(11, 16);
}
