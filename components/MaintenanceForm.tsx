"use client";

import {useEffect, useMemo, useState} from 'react';
import type {Maintenance, MaintenanceInput} from '@/lib/types';

type Props = {
    initial?: Partial<Maintenance>;
    mode: 'create' | 'edit';
    onCancel?: () => void;
    onSaved?: (m: Maintenance) => void;
};

export default function MaintenanceForm({initial, mode, onCancel, onSaved}: Props) {
    const [name, setName] = useState(initial?.name ?? '');
    const [procedure, setProcedure] = useState(initial?.procedure ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(initial?.name ?? '');
        setProcedure(initial?.procedure ?? '');
    }, [initial?.name, initial?.procedure]);

    const disabled = useMemo(() => {
        if (submitting) return true;
        const nm = name.trim();
        const proc = procedure.trim();
        if (nm.length === 0 || nm.length > 100) return true;
        if (proc.length === 0 || proc.length > 4000) return true;
        return false;
    }, [submitting, name, procedure]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const payload: MaintenanceInput = {name: name.trim(), procedure: procedure.trim()};
            let res: Response;
            if (mode === 'create') {
                res = await fetch('/api/maintenance', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`/api/maintenance/${initial?.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            }
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError(data?.error || 'Failed to save.');
            } else {
                onSaved?.(data.data as Maintenance);
                if (mode === 'create') {
                    setName('');
                    setProcedure('');
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
                    placeholder="e.g., HVAC Filter Change"
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
                <span>Procedure (Markdown)</span>
                <textarea
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    maxLength={4000}
                    rows={8}
                    required
                    placeholder="Steps in markdown..."
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
