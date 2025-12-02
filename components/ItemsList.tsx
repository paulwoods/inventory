"use client";

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import type {Equipment, Item, Procedure, Service, Work} from '@/lib/types';
import {byName, byNameCI, byUpdatedAt, sorted, sortedDesc} from '@/lib/utils/sort';
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
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [servicesByItem, setServicesByItem] = useState<Record<string, Service[]>>({});
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [lastDoneByService, setLastDoneByService] = useState<Record<string, string | null>>({});

    async function load() {
        setLoading(true);
        setError(null);
        try {
            // Load items first
            const res = await fetch(`/api/homes/${homeId}/locations/${locationId}/items`, {cache: 'no-store'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to load');
            const sortedItems: Item[] = sorted(data.data as Item[], byNameCI);
            setItems(sortedItems);

            // Load procedures, equipment, and services for each item in parallel
            const [procRes, eqRes, servicesList] = await Promise.all([
                fetch(`/api/procedure`, {cache: 'no-store'}).then(async (r) => {
                    const j = await r.json();
                    if (!r.ok || !j.ok) throw new Error(j?.error || 'Failed to load procedures');
                    return sorted(j.data as Procedure[], byName);
                }),
                fetch(`/api/equipment`, {cache: 'no-store'}).then(async (r) => {
                    const j = await r.json();
                    if (!r.ok || !j.ok) throw new Error(j?.error || 'Failed to load equipment');
                    return sorted(j.data as Equipment[], byName);
                }),
                Promise.all(sortedItems.map(async (it) => {
                    const r = await fetch(`/api/homes/${homeId}/locations/${locationId}/items/${it.id}/services`, {cache: 'no-store'});
                    const j = await r.json();
                    if (!r.ok || !j.ok) throw new Error(j?.error || 'Failed to load services');
                    const list = sortedDesc(j.data as Service[], byUpdatedAt);
                    return [it.id, list] as const;
                }))
            ]);

            const map: Record<string, Service[]> = {};
            for (const [itemId, list] of servicesList) map[itemId] = list;
            setProcedures(procRes);
            setEquipment(eqRes);
            setServicesByItem(map);

            // Fetch last completion date for each service
            const allServiceIds = servicesList.flatMap(([, list]) => list.map(s => s.id));
            const pairs = await Promise.all(allServiceIds.map(async (sid) => {
                try {
                    const r = await fetch(`/api/services/${sid}/work`, {cache: 'no-store'});
                    const j = await r.json();
                    if (!r.ok || !j.ok) throw new Error(j?.error || 'Failed to load work');
                    const works: Work[] = (j.data as Work[]);
                    const last = works.length > 0 ? works[0].performedAt : null;
                    return [sid, last] as const;
                } catch {
                    return [sid, null] as const;
                }
            }));
            const wd: Record<string, string | null> = {};
            for (const [sid, last] of pairs) wd[sid] = last;
            setLastDoneByService(wd);
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
        setItems((prev) => sorted([item, ...prev], byNameCI));
    }

    function onSaved(updated: Item) {
        setItems((prev) => sorted(prev.map((i) => (i.id === updated.id ? updated : i)), byNameCI));
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
            setServicesByItem((prev) => {
                const copy = {...prev};
                delete copy[id];
                return copy;
            });
        } catch (e) {
            alert('Failed to delete');
        } finally {
            setDeletingId(null);
        }
    }

    const procNameById = useMemo(() => {
        const map: Record<string, string> = {};
        for (const p of procedures) map[p.id] = p.name;
        return map;
    }, [procedures]);

    const equipmentNameById = useMemo(() => {
        const map: Record<string, string> = {};
        for (const e of equipment) map[e.id] = e.name;
        return map;
    }, [equipment]);

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
                                            <strong>
                                                {i.name}
                                                {i.equipmentId && (
                                                    <span style={{
                                                        fontWeight: 'normal',
                                                        color: '#9ab0c8'
                                                    }}> ({equipmentNameById[i.equipmentId] || 'Unknown equipment'})</span>
                                                )}
                                            </strong>
                                            {i.description && <span style={{color: '#a9b4c1'}}>{i.description}</span>}
                                            <div style={{color: '#9ab0c8', marginTop: '0.25rem'}}>
                                                {(() => {
                                                    const svcs = servicesByItem[i.id] || [];
                                                    if (svcs.length === 0) return <span>No services</span>;
                                                    return (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '0.15rem'
                                                        }}>
                                                            <span>Services:</span>
                                                            {svcs.map((s) => (
                                                                <span key={s.id} style={{
                                                                    paddingLeft: '0.75rem',
                                                                    display: 'flex',
                                                                    flexDirection: 'column'
                                                                }}>
                                                                    <span>
                                                                        {procNameById[s.procedureId] || 'Unknown'} ({s.interval} days)
                                                                    </span>
                                                                    <span style={{fontSize: 12, color: '#7f8aa5'}}>
                                                                        Last done: {lastDoneByService[s.id] ? new Date(lastDoneByService[s.id] as string).toLocaleString() : 'never'}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                            <Link
                                                href={`/homes/${homeId}/locations/${locationId}/items/${i.id}/view`}>
                                                <button style={{
                                                    padding: '0.35rem 0.7rem',
                                                    borderRadius: 6,
                                                    border: '1px solid #2a3550',
                                                    background: '#10203a',
                                                    color: 'white'
                                                }}>
                                                    View
                                                </button>
                                            </Link>
                                            <Link
                                                href={`/homes/${homeId}/locations/${locationId}/items/${i.id}/services`}>
                                                <button style={{
                                                    padding: '0.35rem 0.7rem',
                                                    borderRadius: 6,
                                                    border: '1px solid #2a3550',
                                                    background: '#103a20',
                                                    color: 'white'
                                                }}>
                                                    Services
                                                </button>
                                            </Link>
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
