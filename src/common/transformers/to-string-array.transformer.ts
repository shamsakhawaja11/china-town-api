import { TransformFnParams } from 'class-transformer';

export function ToStringArray({ value }: TransformFnParams) {
    if (value === undefined || value === null) return undefined;

    const parts = Array.isArray(value) ? value : [value];
    if (!parts.every((part) => typeof part === 'string')) return value;

    const items = parts
        .flatMap((part: string) => part.split(','))
        .map((item) => item.trim())
        .filter((item) => item !== '');

    return items.length > 0 ? items : undefined;
}