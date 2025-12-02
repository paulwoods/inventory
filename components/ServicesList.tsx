"use client";

import {useEffect, useMemo, useState} from 'react';
import type {Procedure, Service} from '@/lib/types';
import {byName, byUpdatedAt, sorted, sortedDesc} from '@/lib/utils/sort';
import ServiceForm from '@/components/ServiceForm';

type Props = {
    homeId: string;
    locationId: string;
    itemId: string;
};

export default function ServicesList({homeId, locationId, itemId}: Props) {
    const [services, setServices] = useState<Service[]>([]);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [svcRes, procRes] = await Promise.all([
                fetch(`/api/homes/${homeId}/locations/${locationId}/items/${itemId}/services`, {cache: 'no-store'}),
                fetch(`/api/procedure`, {cache: 'no-store'})
            ]);
            const svcJson = await svcRes.json();
            const procJson = await procRes.json();
            if (!svcRes.ok || !svcJson.ok) throw new Error(svcJson?.error || 'Failed to load services');
            if (!procRes.ok || !procJson.ok) throw new Error(procJson?.error || 'Failed to load procedures');
            const list: Service[] = sortedDesc(svcJson.data as Service[], byUpdatedAt);
            const procs: Procedure[] = sorted(procJson.data as Procedure[], byName);
            setServices(list);
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
    }, [homeId, locationId, itemId]);

    const procNameById = useMemo(() => {
        const map: Record<string, string> = {};
        for (const p of procedures) map[p.id] = p.name;
        return map;
    }, [procedures]);

    function onCreated(s: Service) {
        setServices((prev) => sortedDesc([s, ...prev], byUpdatedAt));
    }

    function onSaved(updated: Service) {
        setServices((prev) => sortedDesc(prev.map((s) => (s.id === updated.id ? updated : s)), byUpdatedAt));
        setEditingId(null);
    }

    async function onDelete(id: string) {
        if (!confirm('Delete this service?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/services/${id}`, {method: 'DELETE'});
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to delete');
            setServices((prev) => prev.filter((s) => s.id !== id));
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
                    <h2>Services</h2>
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
                {!loading && services.length === 0 &&
                  <div style={{color: '#a9b4c1'}}>No services yet. Click Create to add one.</div>}
                <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem'}}>
                    {services.map((s) => (
                        <li key={s.id} style={{border: '1px solid #223055', borderRadius: 8, padding: '0.75rem'}}>
                            {editingId === s.id ? (
                                <ServiceForm
                                    homeId={homeId}
                                    locationId={locationId}
                                    itemId={itemId}
                                    mode="edit"
                                    initial={s}
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
                                            <strong>{procNameById[s.procedureId] || 'Unknown procedure'}</strong>
                                            <span style={{color: '#a9b4c1'}}>Interval: {s.interval} days</span>
                                        </div>
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                            <button onClick={() => setEditingId(s.id)} style={{
                                                padding: '0.35rem 0.7rem',
                                                borderRadius: 6,
                                                border: '1px solid #2a3550',
                                                background: '#101a3a',
                                                color: 'white'
                                            }}>Edit
                                            </button>
                                            <button onClick={() => onDelete(s.id)} disabled={deletingId === s.id}
                                                    style={{
                                                        padding: '0.35rem 0.7rem',
                                                        borderRadius: 6,
                                                        border: '1px solid #553333',
                                                        background: deletingId === s.id ? '#3a1010' : '#4a1414',
                                                        color: 'white'
                                                    }}>{deletingId === s.id ? 'Deleting…' : 'Delete'}</button>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#7f8aa5'
                                    }}>Updated {new Date(s.updatedAt).toLocaleString()}</div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {creating && (
                <div role="dialog" aria-modal="true" aria-label="Create Service"
                     style={{
                         position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                         background: 'rgba(0,0,0,0.5)', padding: '1rem', zIndex: 1000
                     }}
                     onClick={(e) => {
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
                            <h3 style={{margin: 0}}>Create Service</h3>
                            <button onClick={() => setCreating(false)} aria-label="Close" style={{
                                padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #2a3550',
                                background: 'transparent', color: 'white'
                            }}>✕
                            </button>
                        </div>
                        <ServiceForm
                            homeId={homeId}
                            locationId={locationId}
                            itemId={itemId}
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
