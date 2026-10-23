import { TransformFnParams } from 'class-transformer';

export function ToBoolean({ value }: TransformFnParams) {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return value;

    const text = value.trim().toLowerCase();
    if (text === '') return undefined;
    if (text === 'true') return true;
    if (text === 'false') return false;

    return value;
}