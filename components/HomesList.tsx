"use client";

import {useEffect, useState} from 'react';
import type {Home} from '@/lib/types';
import HomeForm from '@/components/HomeForm';

export default function HomesList() {
    const [homes, setHomes] = useState<Home[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/homes', {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load');
            setHomes(data.data as Home[]);
        } catch (e: any) {
            setError(e?.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function onCreated(home: Home) {
        setHomes((prev) => [home, ...prev]);
    }

    function onSaved(updated: Home) {
        setHomes((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
        setEditingId(null);
    }

    async function onDelete(id: string) {
        if (!confirm('Delete this home?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/homes/${id}`, {method: 'DELETE'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to delete');
            setHomes((prev) => prev.filter((h) => h.id !== id));
        } catch (e) {
            alert('Failed to delete');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div style={{display: 'grid', gap: '1rem', width: '100%', maxWidth: 800}}>
            <section style={{padding: '1rem', border: '1px solid #2a3550', borderRadius: 8, background: '#0b1230'}}>
                <h2 style={{marginBottom: '0.5rem'}}>Create Home</h2>
                <HomeForm mode="create" onSaved={onCreated}/>
            </section>

            <section style={{padding: '1rem', border: '1px solid #2a3550', borderRadius: 8, background: '#0b1230'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <h2>Homes</h2>
                    <button onClick={load} disabled={loading} style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: 6,
                        border: '1px solid #2a3550',
                        background: '#101a3a',
                        color: 'white'
                    }}>Refresh
                    </button>
                </div>
                {loading && <div>Loading…</div>}
                {error && <div style={{color: '#ff8a8a'}}>{error}</div>}
                {!loading && homes.length === 0 &&
                  <div style={{color: '#a9b4c1'}}>No homes yet. Create one above.</div>}
                <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem'}}>
                    {homes.map((h) => (
                        <li key={h.id} style={{border: '1px solid #223055', borderRadius: 8, padding: '0.75rem'}}>
                            {editingId === h.id ? (
                                <HomeForm
                                    mode="edit"
                                    initial={h}
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
                                            <strong>{h.name}</strong>
                                            {h.description && <span style={{color: '#a9b4c1'}}>{h.description}</span>}
                                        </div>
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                            <button onClick={() => setEditingId(h.id)} style={{
                                                padding: '0.35rem 0.7rem',
                                                borderRadius: 6,
                                                border: '1px solid #2a3550',
                                                background: '#101a3a',
                                                color: 'white'
                                            }}>Edit
                                            </button>
                                            <button onClick={() => onDelete(h.id)} disabled={deletingId === h.id}
                                                    style={{
                                                        padding: '0.35rem 0.7rem',
                                                        borderRadius: 6,
                                                        border: '1px solid #553333',
                                                        background: deletingId === h.id ? '#3a1010' : '#4a1414',
                                                        color: 'white'
                                                    }}>{deletingId === h.id ? 'Deleting…' : 'Delete'}</button>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#7f8aa5'
                                    }}>Updated {new Date(h.updatedAt).toLocaleString()}</div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
