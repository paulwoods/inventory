"use client";

import {useEffect, useState} from 'react';
import type {Item} from '@/lib/types';
import ItemForm from '@/components/ItemForm';

type Props = {
    homeId: string;
    locationId: string;
};

export default function ItemsList({homeId, locationId}: Props) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/homes/${homeId}/locations/${locationId}/items`, {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load');
            const sorted: Item[] = [...(data.data as Item[])]
                .sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
            setItems(sorted);
        } catch (e: any) {
            setError(e?.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [homeId, locationId]);

    function onCreated(item: Item) {
        setItems((prev) => {
            const next = [item, ...prev];
            next.sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
            return next;
        });
    }

    function onSaved(updated: Item) {
        setItems((prev) => {
            const next = prev.map((i) => (i.id === updated.id ? updated : i));
            next.sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
            return next;
        });
        setEditingId(null);
    }

    async function onDelete(id: string) {
        if (!confirm('Delete this item?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/homes/${homeId}/locations/${locationId}/items/${id}`, {method: 'DELETE'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to delete');
            setItems((prev) => {
                const next = prev.filter((i) => i.id !== id);
                next.sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
                return next;
            });
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
                    <h2>Items</h2>
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
                  <div style={{color: '#a9b4c1'}}>No items yet. Click Create to add one.</div>}
                <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem'}}>
                    {items.map((i) => (
                        <li key={i.id} style={{border: '1px solid #223055', borderRadius: 8, padding: '0.75rem'}}>
                            {editingId === i.id ? (
                                <ItemForm
                                    homeId={homeId}
                                    locationId={locationId}
                                    mode="edit"
                                    initial={i}
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
                                            <strong>{i.name}</strong>
                                            {i.description && <span style={{color: '#a9b4c1'}}>{i.description}</span>}
                                        </div>
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                            <button onClick={() => setEditingId(i.id)} style={{
                                                padding: '0.35rem 0.7rem',
                                                borderRadius: 6,
                                                border: '1px solid #2a3550',
                                                background: '#101a3a',
                                                color: 'white'
                                            }}>Edit
                                            </button>
                                            <button onClick={() => onDelete(i.id)} disabled={deletingId === i.id}
                                                    style={{
                                                        padding: '0.35rem 0.7rem',
                                                        borderRadius: 6,
                                                        border: '1px solid #553333',
                                                        background: deletingId === i.id ? '#3a1010' : '#4a1414',
                                                        color: 'white'
                                                    }}>{deletingId === i.id ? 'Deleting…' : 'Delete'}</button>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#7f8aa5'
                                    }}>Updated {new Date(i.updatedAt).toLocaleString()}</div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {creating && (
                <div role="dialog" aria-modal="true" aria-label="Create Item"
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
                            <h3 style={{margin: 0}}>Create Item</h3>
                            <button onClick={() => setCreating(false)} aria-label="Close" style={{
                                padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #2a3550',
                                background: 'transparent', color: 'white'
                            }}>✕
                            </button>
                        </div>
                        <ItemForm
                            homeId={homeId}
                            locationId={locationId}
                            mode="create"
                            onSaved={(item) => {
                                onCreated(item);
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
