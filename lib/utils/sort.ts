// Small shared sort utilities and helpers

// Case-insensitive name comparator (uses localeCompare with sensitivity 'base')
export function byNameCI<T extends { name: string }>(a: T, b: T): number {
    return a.name.localeCompare(b.name, undefined, {sensitivity: 'base'});
}

// Default name comparator (case-sensitive/default locale rules)
export function byName<T extends { name: string }>(a: T, b: T): number {
    return a.name.localeCompare(b.name);
}

// Compare by updatedAt ISO string ascending
export function byUpdatedAt<T extends { updatedAt: string }>(a: T, b: T): number {
    return a.updatedAt.localeCompare(b.updatedAt);
}

// Compare by performedAt ISO string ascending
export function byPerformedAt<T extends { performedAt: string }>(a: T, b: T): number {
    return a.performedAt.localeCompare(b.performedAt);
}

// Return a new sorted copy of an array
export function sorted<T>(arr: readonly T[], compareFn: (a: T, b: T) => number): T[] {
    return [...arr].sort(compareFn);
}

// Return a new sorted copy in descending order by inverting comparator
export function sortedDesc<T>(arr: readonly T[], compareFn: (a: T, b: T) => number): T[] {
    return [...arr].sort((x, y) => -compareFn(x, y));
}
