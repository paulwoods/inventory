"use client";

import {useEffect, useMemo, useState} from 'react';
import type {Equipment, Procedure} from '@/lib/types';
import {byName, sorted} from '@/lib/utils/sort';
import EquipmentForm from '@/components/EquipmentForm';

export default function EquipmentList() {
    const [items, setItems] = useState<Equipment[]>([]);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [eqRes, procRes] = await Promise.all([
                fetch('/api/equipment', {cache: 'no-store'}),
                fetch('/api/procedure', {cache: 'no-store'})
            ]);
            const eqJson = await eqRes.json();
            const procJson = await procRes.json();
            if (!eqRes.ok || !eqJson.ok) throw new Error(eqJson?.error || 'Failed to load equipment');
            if (!procRes.ok || !procJson.ok) throw new Error(procJson?.error || 'Failed to load procedures');
            const list: Equipment[] = sorted(eqJson.data as Equipment[], byName);
            const procs: Procedure[] = sorted(procJson.data as Procedure[], byName);
            setItems(list);
            setProcedures(procs);
        } catch (e: any) {
            setError(e?.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const procNameById = useMemo(() => {
        const map: Record<string, string> = {};
        for (const p of procedures) map[p.id] = p.name;
        return map;
    }, [procedures]);

    function onCreated(m: Equipment) {
        setItems((prev) => sorted([m, ...prev], byName));
    }

    function onSaved(updated: Equipment) {
        setItems((prev) => sorted(prev.map((m) => (m.id === updated.id ? updated : m)), byName));
        setEditingId(null);
    }

    async function onDelete(id: string) {
        if (!confirm('Delete this equipment?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/equipment/${id}`, {method: 'DELETE'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to delete');
            setItems((prev) => prev.filter((m) => m.id !== id));
        } catch {
            alert('Failed to delete');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div style={{display: 'grid', gap: '1rem', width: '100%', maxWidth: 800}}>
            <section style={{padding: '1rem', border: '1px solid #2a3550', borderRadius: 8, background: '#0b1230'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <h2>Equipment</h2>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button onClick={() => setCreating(true)} style={{
                            padding: '0.35rem 0.7rem',
                            borderRadius: 6,
                            border: '1px solid #2a3550',
                            background: '#10203a',
                            color: 'white'
                        }}>Create
                        </button>
                        <button onClick={load} disabled={loading} style={{
                            padding: '0.35rem 0.7rem',
                            borderRadius: 6,
                            border: '1px solid #2a3550',
                            background: '#101a3a',
                            color: 'white'
                        }}>Refresh
                        </button>
                    </div>
                </div>
                {loading && <div>Loading…</div>}
                {error && <div style={{color: '#ff8a8a'}}>{error}</div>}
                {!loading && items.length === 0 && (
                    <div style={{color: '#a9b4c1'}}>No equipment yet. Click Create to add one.</div>
                )}
                <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem'}}>
                    {items.map((m) => (
                        <li key={m.id} style={{border: '1px solid #223055', borderRadius: 8, padding: '0.75rem'}}>
                            {editingId === m.id ? (
                                <EquipmentForm
                                    mode="edit"
                                    initial={m}
                                    onCancel={() => setEditingId(null)}
                                    onSaved={onSaved}
                                />
                            ) : (
                                <div style={{display: 'grid', gap: '0.4rem'}}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <strong>{m.name}</strong>
                                            <div style={{color: '#9ab0c8', marginTop: '0.25rem'}}>
                                                {m.procedureIds.length === 0 ? (
                                                    <span>No procedures</span>
                                                ) : (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.15rem'
                                                    }}>
                                                        <span>Procedures:</span>
                                                        {m.procedureIds.map((pid) => (
                                                            <span key={pid} style={{paddingLeft: '0.75rem'}}>
                                                                {procNameById[pid] || 'Unknown'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                            <button onClick={() => setEditingId(m.id)} style={{
                                                padding: '0.35rem 0.7rem',
                                                borderRadius: 6,
                                                border: '1px solid #2a3550',
                                                background: '#101a3a',
                                                color: 'white'
                                            }}>Edit
                                            </button>
                                            <button onClick={() => onDelete(m.id)} disabled={deletingId === m.id}
                                                    style={{
                                                        padding: '0.35rem 0.7rem',
                                                        borderRadius: 6,
                                                        border: '1px solid #553333',
                                                        background: deletingId === m.id ? '#3a1010' : '#4a1414',
                                                        color: 'white'
                                                    }}>{deletingId === m.id ? 'Deleting…' : 'Delete'}</button>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#7f8aa5'
                                    }}>Updated {new Date(m.updatedAt).toLocaleString()}</div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {creating && (
                <div role="dialog" aria-modal="true" aria-label="Create Equipment"
                     style={{
                         position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                         background: 'rgba(0,0,0,0.5)', padding: '1rem', zIndex: 1000
                     }}
                     onClick={(e) => {
                         if (e.target === e.currentTarget) setCreating(false);
                     }}
                >
                    <div style={{
                        width: '100%', maxWidth: 760, background: '#0b1230', border: '1px solid #2a3550',
                        borderRadius: 10, padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <h3 style={{margin: 0}}>Create Equipment</h3>
                            <button onClick={() => setCreating(false)} aria-label="Close" style={{
                                padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #2a3550',
                                background: 'transparent', color: 'white'
                            }}>✕
                            </button>
                        </div>
                        <EquipmentForm
                            mode="create"
                            onSaved={(m) => {
                                onCreated(m);
                                setCreating(false);
                            }}
                            onCancel={() => setCreating(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
