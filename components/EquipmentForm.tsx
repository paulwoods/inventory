"use client";

import {useEffect, useMemo, useState} from 'react';
import type {Equipment, EquipmentInput, Procedure} from '@/lib/types';

type Props = {
    initial?: Partial<Equipment>;
    mode: 'create' | 'edit';
    onCancel?: () => void;
    onSaved?: (m: Equipment) => void;
};

export default function EquipmentForm({initial, mode, onCancel, onSaved}: Props) {
    const [name, setName] = useState(initial?.name ?? '');
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [selected, setSelected] = useState<string[]>(initial?.procedureIds ?? []);
    const [loadingProcedures, setLoadingProcedures] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadProcedures() {
        setLoadingProcedures(true);
        try {
            const res = await fetch('/api/procedure', {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load procedures');
            const list: Procedure[] = (data.data as Procedure[]).slice().sort((a, b) => a.name.localeCompare(b.name));
            setProcedures(list);
        } catch (e: any) {
            setError(e?.message || 'Failed to load procedures');
        } finally {
            setLoadingProcedures(false);
        }
    }

    useEffect(() => {
        loadProcedures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setName(initial?.name ?? '');
        setSelected(initial?.procedureIds ?? []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial?.name, initial?.procedureIds]);

    const disabled = useMemo(() => {
        if (submitting) return true;
        const nm = name.trim();
        if (nm.length === 0 || nm.length > 100) return true;
        return false;
    }, [submitting, name]);

    function toggle(pid: string) {
        setSelected((prev) => (prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const payload: EquipmentInput = {name: name.trim(), procedureIds: selected};
            let res: Response;
            if (mode === 'create') {
                res = await fetch('/api/equipment', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`/api/equipment/${initial?.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            }
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError(data?.error || 'Failed to save.');
            } else {
                onSaved?.(data.data as Equipment);
                if (mode === 'create') {
                    setName('');
                    setSelected([]);
                }
            }
        } catch {
            setError('Network error.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <span>Name</span>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    required
                    placeholder="e.g., Lawn Mower"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 6,
                        border: '1px solid #2a3550',
                        background: '#0f1630',
                        color: 'white'
                    }}
                />
            </label>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <span>Procedures</span>
                {loadingProcedures ? (
                    <div>Loading procedures…</div>
                ) : (
                    <div style={{display: 'grid', gap: '0.25rem'}}>
                        {procedures.length === 0 && (
                            <div style={{color: '#a9b4c1'}}>No procedures yet. You can add them later.</div>
                        )}
                        {procedures.map((p) => (
                            <label key={p.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(p.id)}
                                    onChange={() => toggle(p.id)}
                                />
                                <span>{p.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

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
