"use client";

import {useEffect, useMemo, useState} from 'react';
import type {Procedure, Service, ServiceInput} from '@/lib/types';

type Props = {
    homeId: string;
    locationId: string;
    itemId: string;
    initial?: Partial<Service>;
    mode: 'create' | 'edit';
    onCancel?: () => void;
    onSaved?: (m: Service) => void;
};

export default function ServiceForm({homeId, locationId, itemId, initial, mode, onCancel, onSaved}: Props) {
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [procedureId, setProcedureId] = useState(initial?.procedureId ?? '');
    const [interval, setInterval] = useState<number>(typeof initial?.interval === 'number' ? initial!.interval! : 30);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingProcedures, setLoadingProcedures] = useState(true);

    async function loadProcedures() {
        setLoadingProcedures(true);
        try {
            const res = await fetch('/api/procedure', {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load procedures.');
            const list: Procedure[] = (data.data as Procedure[]).slice().sort((a, b) => a.name.localeCompare(b.name));
            setProcedures(list);
            if (!initial?.procedureId && list.length > 0) setProcedureId(list[0].id);
        } catch (e: any) {
            setError(e?.message || 'Failed to load procedures.');
        } finally {
            setLoadingProcedures(false);
        }
    }

    useEffect(() => {
        loadProcedures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (initial?.procedureId) setProcedureId(initial.procedureId);
        if (typeof initial?.interval === 'number') setInterval(initial.interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial?.procedureId, initial?.interval]);

    const disabled = useMemo(() => {
        if (submitting) return true;
        if (!procedureId) return true;
        if (!Number.isFinite(interval) || !Number.isInteger(interval) || interval <= 0) return true;
        return false;
    }, [submitting, procedureId, interval]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const payload: ServiceInput = {procedureId, interval: Number(interval)};
            let res: Response;
            if (mode === 'create') {
                res = await fetch(`/api/homes/${homeId}/locations/${locationId}/items/${itemId}/services`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`/api/services/${initial?.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            }
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError(data?.error || 'Failed to save.');
            } else {
                onSaved?.(data.data as Service);
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
                <span>Procedure</span>
                <select value={procedureId} onChange={(e) => setProcedureId(e.target.value)}
                        disabled={loadingProcedures}
                        required
                        style={{
                            padding: '0.5rem',
                            borderRadius: 6,
                            border: '1px solid #2a3550',
                            background: '#0f1630',
                            color: 'white'
                        }}>
                    {procedures.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </label>
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <span>Interval (days)</span>
                <input type="number" min={1} step={1}
                       value={interval}
                       onChange={(e) => setInterval(parseInt(e.target.value || '0', 10))}
                       required
                       style={{
                           padding: '0.5rem',
                           borderRadius: 6,
                           border: '1px solid #2a3550',
                           background: '#0f1630',
                           color: 'white'
                       }}/>
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
