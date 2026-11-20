import { Prisma } from '../../generated/prisma/client';

type DecimalLike = Prisma.Decimal | number | string | null | undefined;

/** Convert a Prisma Decimal (or anything numeric) to a JS number. null/undefined -> 0. */
export function toNum(value: DecimalLike): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    return value.toNumber();
}

/** Same as toNum but keeps null. */
export function toNumOrNull(value: DecimalLike): number | null {
    return value === null || value === undefined ? null : toNum(value);
}

/** Round to 2 decimals (money). */
export function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Round to 3 decimals (inventory quantities). */
export function round3(value: number): number {
    return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
