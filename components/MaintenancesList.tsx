"use client";

import {useEffect, useState} from 'react';
import type {Maintenance} from '@/lib/types';
import MaintenanceForm from '@/components/MaintenanceForm';
import ReactMarkdown from 'react-markdown';

export default function MaintenancesList() {
    const [items, setItems] = useState<Maintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/maintenance`, {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load');
            const sorted: Maintenance[] = [...(data.data as Maintenance[])]
                .sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
            setItems(sorted);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function onCreated(m: Maintenance) {
        setItems((prev) => {
            const next = [m, ...prev];
            next.sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
            return next;
        });
    }

    function onSaved(updated: Maintenance) {
        setItems((prev) => {
            const next = prev.map((i) => (i.id === updated.id ? updated : i));
            next.sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
            return next;
        });
        setEditingId(null);
    }

    async function onDelete(id: string) {
        if (!confirm('Delete this maintenance procedure?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/maintenance/${id}`, {method: 'DELETE'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to delete');
            setItems((prev) => {
                const next = prev.filter((i) => i.id !== id);
                next.sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
                return next;
            });
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
                    <h2>Maintenance</h2>
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
                {!loading && items.length === 0 &&
                  <div style={{color: '#a9b4c1'}}>No maintenance procedures yet. Click Create to add one.</div>}
                <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem'}}>
                    {items.map((m) => (
                        <li key={m.id} style={{border: '1px solid #223055', borderRadius: 8, padding: '0.75rem'}}>
                            {editingId === m.id ? (
                                <MaintenanceForm
                                    mode="edit"
                                    initial={m}
                                    onCancel={() => setEditingId(null)}
                                    onSaved={onSaved}
                                />
                            ) : (
                                <div style={{display: 'grid', gap: '0.5rem'}}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <strong>{m.name}</strong>
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
                                    <div style={{
                                        padding: '0.5rem',
                                        background: '#0f1630',
                                        borderRadius: 6,
                                        border: '1px solid #2a3550',
                                        overflowX: 'auto'
                                    }}>
                                        <ReactMarkdown>{m.procedure}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {creating && (
                <div role="dialog" aria-modal="true" aria-label="Create Maintenance"
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
                            <h3 style={{margin: 0}}>Create Maintenance</h3>
                            <button onClick={() => setCreating(false)} aria-label="Close" style={{
                                padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #2a3550',
                                background: 'transparent', color: 'white'
                            }}>✕
                            </button>
                        </div>
                        <MaintenanceForm
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
