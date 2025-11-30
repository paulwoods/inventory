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

export type Location = {
    id: string;
    homeId: string;
    name: string;
    description?: string;
    createdAt: string; // ISO
    updatedAt: string; // ISO
};

export type LocationInput = {
    name: string;
    description?: string;
};

export type Item = {
    id: string;
    locationId: string;
    name: string;
    description?: string;
    createdAt: string; // ISO
    updatedAt: string; // ISO
};

export type ItemInput = {
    name: string;
    description?: string;
};

export type Maintenance = {
    id: string;
    name: string;
    procedure: string; // markdown
    createdAt: string; // ISO
    updatedAt: string; // ISO
};

export type MaintenanceInput = {
    name: string;
    procedure: string;
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

export function validateItemInput(input: Partial<ItemInput>): string | null {
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

export function validateLocationInput(input: Partial<LocationInput>): string | null {
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

export function validateMaintenanceInput(input: Partial<MaintenanceInput>): string | null {
    const name = input.name ?? '';
    const procedure = input.procedure ?? '';
    if (typeof name !== 'string' || name.trim().length === 0) {
        return 'Name is required.';
    }
    if (name.trim().length > 100) {
        return 'Name must be at most 100 characters.';
    }
    if (typeof procedure !== 'string' || procedure.trim().length === 0) {
        return 'Procedure is required.';
    }
    if (procedure.length > 4000) {
        return 'Procedure must be at most 4000 characters.';
    }
    return null;
}
