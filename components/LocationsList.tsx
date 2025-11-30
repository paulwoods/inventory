"use client";

import {useEffect, useState} from 'react';
import type {Location} from '@/lib/types';
import LocationForm from '@/components/LocationForm';

type Props = {
    homeId: string;
};

export default function LocationsList({homeId}: Props) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/homes/${homeId}/locations`, {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load');
            setLocations(data.data as Location[]);
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
        setLocations((prev) => [loc, ...prev]);
    }

    function onSaved(updated: Location) {
        setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setEditingId(null);
    }

    async function onDelete(id: string) {
        if (!confirm('Delete this location?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/homes/${homeId}/locations/${id}`, {method: 'DELETE'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to delete');
            setLocations((prev) => prev.filter((l) => l.id !== id));
        } catch (e) {
            alert('Failed to delete');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div style={{display: 'grid', gap: '1rem', width: '100%', maxWidth: 800}}>
            <section style={{padding: '1rem', border: '1px solid #2a3550', borderRadius: 8, background: '#0b1230'}}>
                <h2 style={{marginBottom: '0.5rem'}}>Create Location</h2>
                <LocationForm homeId={homeId} mode="create" onSaved={onCreated}/>
            </section>

            <section style={{padding: '1rem', border: '1px solid #2a3550', borderRadius: 8, background: '#0b1230'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <h2>Locations</h2>
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
                {!loading && locations.length === 0 &&
                  <div style={{color: '#a9b4c1'}}>No locations yet. Create one above.</div>}
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
                                            <strong>{l.name}</strong>
                                            {l.description && <span style={{color: '#a9b4c1'}}>{l.description}</span>}
                                        </div>
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
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
        </div>
    );
}
