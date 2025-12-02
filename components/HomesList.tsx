"use client";

import {useEffect, useState} from 'react';
import Link from 'next/link';
import type {Home} from '@/lib/types';
import HomeForm from '@/components/HomeForm';
import {byNameCI, sorted} from '@/lib/utils/sort';

export default function HomesList() {
    const [homes, setHomes] = useState<Home[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/homes', {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load');
            const list: Home[] = sorted(data.data as Home[], byNameCI);
            setHomes(list);
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
        setHomes((prev) => sorted([home, ...prev], byNameCI));
    }

    function onSaved(updated: Home) {
        setHomes((prev) => sorted(prev.map((h) => (h.id === updated.id ? updated : h)), byNameCI));
        setEditingId(null);
    }

    async function onDelete(id: string) {
        if (!confirm('Delete this home?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/homes/${id}`, {method: 'DELETE'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to delete');
            setHomes((prev) => sorted(prev.filter((h) => h.id !== id), byNameCI));
        } catch (e) {
            alert('Failed to delete');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div style={{display: 'grid', gap: '1rem', width: '100%', maxWidth: 800}}>
            <section style={{padding: '1rem', border: '1px solid #2a3550', borderRadius: 8, background: '#0b1230'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <h2>Homes</h2>
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
                {!loading && homes.length === 0 &&
                  <div style={{color: '#a9b4c1'}}>No homes yet. Click Create to add one.</div>}
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
                                            <Link href={`/homes/${h.id}`}
                                                  style={{color: 'inherit', textDecoration: 'none'}}>
                                                <strong>{h.name}</strong>
                                            </Link>
                                            {h.description && <span style={{color: '#a9b4c1'}}>{h.description}</span>}
                                        </div>
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                            <Link href={`/homes/${h.id}`} style={{
                                                padding: '0.35rem 0.7rem',
                                                borderRadius: 6,
                                                border: '1px solid #2a3550',
                                                background: '#10203a',
                                                color: 'white',
                                                textDecoration: 'none'
                                            }}>Open</Link>
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

            {creating && (
                <div role="dialog" aria-modal="true" aria-label="Create Home"
                     style={{
                         position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                         background: 'rgba(0,0,0,0.5)', padding: '1rem', zIndex: 1000
                     }}
                     onClick={(e) => {
                         // close when clicking backdrop only
                         if (e.target === e.currentTarget) setCreating(false);
                     }}
                >
                    <div style={{
                        width: '100%', maxWidth: 560, background: '#0b1230', border: '1px solid #2a3550',
                        borderRadius: 10, padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <h3 style={{margin: 0}}>Create Home</h3>
                            <button onClick={() => setCreating(false)} aria-label="Close" style={{
                                padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #2a3550',
                                background: 'transparent', color: 'white'
                            }}>✕
                            </button>
                        </div>
                        <HomeForm
                            mode="create"
                            onSaved={(home) => {
                                onCreated(home);
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
