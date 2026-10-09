export type NormalizedContact = {
    type: 'email' | 'phone';
    value: string;
};

export function normalizeContact(input: unknown): NormalizedContact | null {
    if (typeof input !== 'string') return null;

    const trimmed = input.trim();
    if (!trimmed) return null;

    if (trimmed.includes('@')) {
        return { type: 'email', value: trimmed.toLowerCase() };
    }

    let phone = trimmed.replace(/[\s()\-]/g, '');

    if (phone.startsWith('0092')) {
        phone = '+92' + phone.slice(4);
    } else if (phone.startsWith('0')) {
        phone = '+92' + phone.slice(1);
    } else if (/^92\d{10}$/.test(phone)) {
        phone = '+' + phone;
    }

    if (!/^\+92\d{10}$/.test(phone)) return null;

    return { type: 'phone', value: phone };
}