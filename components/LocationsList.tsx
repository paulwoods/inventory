"use client";

import {useEffect, useState} from 'react';
import type {Location} from '@/lib/types';
import LocationForm from '@/components/LocationForm';
import Link from 'next/link';
import {byNameCI, sorted} from '@/lib/utils/sort';

type Props = {
    homeId: string;
};

export default function LocationsList({homeId}: Props) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/homes/${homeId}/locations`, {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load');
            const list: Location[] = sorted(data.data as Location[], byNameCI);
            setLocations(list);
        } catch (e: any) {
            setError(e?.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [homeId]);

    function onCreated(loc: Location) {
        setLocations((prev) => sorted([loc, ...prev], byNameCI));
    }

    function onSaved(updated: Location) {
        setLocations((prev) => sorted(prev.map((l) => (l.id === updated.id ? updated : l)), byNameCI));
        setEditingId(null);
    }

    async function onDelete(id: string) {
        if (!confirm('Delete this location?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/homes/${homeId}/locations/${id}`, {method: 'DELETE'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to delete');
            setLocations((prev) => sorted(prev.filter((l) => l.id !== id), byNameCI));
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
                    <h2>Locations</h2>
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
                {!loading && locations.length === 0 &&
                  <div style={{color: '#a9b4c1'}}>No locations yet. Click Create to add one.</div>}
                <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem'}}>
                    {locations.map((l) => (
                        <li key={l.id} style={{border: '1px solid #223055', borderRadius: 8, padding: '0.75rem'}}>
                            {editingId === l.id ? (
                                <LocationForm
                                    homeId={homeId}
                                    mode="edit"
                                    initial={l}
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
                                            <Link href={`/homes/${homeId}/locations/${l.id}`}
                                                  style={{color: 'inherit', textDecoration: 'none'}}>
                                                <strong>{l.name}</strong>
                                            </Link>
                                            {l.description && <span style={{color: '#a9b4c1'}}>{l.description}</span>}
                                        </div>
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                            <Link href={`/homes/${homeId}/locations/${l.id}`} style={{
                                                padding: '0.35rem 0.7rem',
                                                borderRadius: 6,
                                                border: '1px solid #2a3550',
                                                background: '#10203a',
                                                color: 'white',
                                                textDecoration: 'none'
                                            }}>Open</Link>
                                            <button onClick={() => setEditingId(l.id)} style={{
                                                padding: '0.35rem 0.7rem',
                                                borderRadius: 6,
                                                border: '1px solid #2a3550',
                                                background: '#101a3a',
                                                color: 'white'
                                            }}>Edit
                                            </button>
                                            <button onClick={() => onDelete(l.id)} disabled={deletingId === l.id}
                                                    style={{
                                                        padding: '0.35rem 0.7rem',
                                                        borderRadius: 6,
                                                        border: '1px solid #553333',
                                                        background: deletingId === l.id ? '#3a1010' : '#4a1414',
                                                        color: 'white'
                                                    }}>{deletingId === l.id ? 'Deleting…' : 'Delete'}</button>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#7f8aa5'
                                    }}>Updated {new Date(l.updatedAt).toLocaleString()}</div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {creating && (
                <div role="dialog" aria-modal="true" aria-label="Create Location"
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
                            <h3 style={{margin: 0}}>Create Location</h3>
                            <button onClick={() => setCreating(false)} aria-label="Close" style={{
                                padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #2a3550',
                                background: 'transparent', color: 'white'
                            }}>✕
                            </button>
                        </div>
                        <LocationForm
                            homeId={homeId}
                            mode="create"
                            onSaved={(loc) => {
                                onCreated(loc);
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
