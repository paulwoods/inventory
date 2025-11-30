"use client";

import {useEffect, useMemo, useState} from 'react';
import type {Item, ItemInput} from '@/lib/types';

type Props = {
    homeId: string;
    locationId: string;
    initial?: Partial<Item>;
    mode: 'create' | 'edit';
    onCancel?: () => void;
    onSaved?: (item: Item) => void;
};

export default function ItemForm({homeId, locationId, initial, mode, onCancel, onSaved}: Props) {
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(initial?.name ?? '');
        setDescription(initial?.description ?? '');
    }, [initial?.name, initial?.description]);

    const disabled = useMemo(() => {
        if (submitting) return true;
        const nm = name.trim();
        if (nm.length === 0 || nm.length > 100) return true;
        if (description && description.length > 1000) return true;
        return false;
    }, [submitting, name, description]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const payload: ItemInput = {name: name.trim(), description: description.trim() || undefined};
            let res: Response;
            if (mode === 'create') {
                res = await fetch(`/api/homes/${homeId}/locations/${locationId}/items`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`/api/homes/${homeId}/locations/${locationId}/items/${initial?.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            }
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError(data?.error || 'Failed to save.');
            } else {
                onSaved?.(data.data as Item);
                if (mode === 'create') {
                    setName('');
                    setDescription('');
                }
            }
        } catch {
            setError('Network error.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%'}}>
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <span>Name</span>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    required
                    placeholder="e.g., Rice Cooker"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 6,
                        border: '1px solid #2a3550',
                        background: '#0f1630',
                        color: 'white'
                    }}
                />
            </label>
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <span>Description (optional)</span>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Short description"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 6,
                        border: '1px solid #2a3550',
                        background: '#0f1630',
                        color: 'white'
                    }}
                />
            </label>
            {error && <div style={{color: '#ff8a8a'}}>{error}</div>}
            <div style={{display: 'flex', gap: '0.5rem'}}>
                <button type="submit" disabled={disabled} style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: 6,
                    border: '1px solid #2a3550',
                    background: disabled ? '#1b2445' : '#1f2a50',
                    color: 'white',
                    cursor: disabled ? 'not-allowed' : 'pointer'
                }}>
                    {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={submitting} style={{
                        padding: '0.5rem 0.9rem',
                        borderRadius: 6,
                        border: '1px solid #2a3550',
                        background: 'transparent',
                        color: 'white'
                    }}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
