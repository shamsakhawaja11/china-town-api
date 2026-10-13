import { TransformFnParams } from 'class-transformer';

export const Trim = ({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value;