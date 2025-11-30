export type Home = {
    id: string;
    name: string;
    description?: string;
    createdAt: string; // ISO
    updatedAt: string; // ISO
};

export type HomeInput = {
    name: string;
    description?: string;
};

export type ApiResponse<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };

export function validateHomeInput(input: Partial<HomeInput>): string | null {
    const name = input.name ?? '';
    const description = input.description ?? '';
    if (typeof name !== 'string' || name.trim().length === 0) {
        return 'Name is required.';
    }
    if (name.trim().length > 100) {
        return 'Name must be at most 100 characters.';
    }
    if (typeof description === 'string' && description.length > 1000) {
        return 'Description must be at most 1000 characters.';
    }
    return null;
}
