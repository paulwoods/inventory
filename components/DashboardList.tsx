import {listLocationsByHome} from '@/lib/storage/locations';
import {listItemsByLocation} from '@/lib/storage/items';
import {listServicesByItem} from '@/lib/storage/services';
import {listWorksByService} from '@/lib/storage/work';
import {getProcedure} from '@/lib/storage/procedures';
import Link from 'next/link';

type Props = {
    homeId: string;
};

function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    try {
        return d.toLocaleString();
    } catch {
        return iso;
    }
}

function daysUntilDue(lastDoneISO: string | null, createdAtISO: string, intervalDays: number): number | null {
    if (!Number.isFinite(intervalDays) || intervalDays <= 0) return null;
    const baseISO = lastDoneISO ?? createdAtISO;
    const base = new Date(baseISO);
    if (Number.isNaN(base.getTime())) return null;
    const nextDue = new Date(base.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = nextDue.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    // return Math.max(0, days);
    return days;
}

function formatDueIn(days: number | null): string {
    if (days === null) return '—';
    return `${days}d`;
}

export default async function DashboardList({homeId}: Props) {
    // Load locations for the home
    const locations = await listLocationsByHome(homeId);
    if (locations.length === 0) {
        return (
            <section style={{
                padding: '1rem',
                border: '1px solid #2a3550',
                borderRadius: 8,
                background: '#0b1230',
                width: '100%',
                maxWidth: 1000
            }}>
                <h2 style={{marginTop: 0}}>Dashboard</h2>
                <div style={{color: '#a9b4c1'}}>No locations yet.</div>
            </section>
        );
    }

    // Load all items for all locations
    const items = (await Promise.all(
        locations.map(async (loc) => {
            const list = await listItemsByLocation(loc.id);
            return list.map((it) => ({
                ...it,
                locationId: loc.id,
                locationName: loc.name,
            }));
        })
    )).flat();

    // Load services for each item
    const servicesByItem = await Promise.all(
        items.map(async (it) => {
            const services = await listServicesByItem(it.id);
            return services.map((s) => ({
                service: s,
                itemId: it.id,
                itemName: it.name,
                locationId: it.locationId,
                locationName: it.locationName,
            }));
        })
    );
    const serviceRows = servicesByItem.flat();

    // If there are no services, show empty state
    if (serviceRows.length === 0) {
        return (
            <section style={{
                padding: '1rem',
                border: '1px solid #2a3550',
                borderRadius: 8,
                background: '#0b1230',
                width: '100%',
                maxWidth: 1000
            }}>
                <h2 style={{marginTop: 0}}>Dashboard</h2>
                <div style={{color: '#a9b4c1'}}>No services to display yet.</div>
            </section>
        );
    }

    // Load last completion dates and procedure names for each service
    const enriched = await Promise.all(
        serviceRows.map(async (row) => {
            const [works, proc] = await Promise.all([
                listWorksByService(row.service.id),
                getProcedure(row.service.procedureId),
            ]);
            const last = works[0]?.performedAt ?? null;
            const dueIn = daysUntilDue(last, row.service.createdAt, row.service.interval);
            return {
                itemId: row.itemId,
                itemName: row.itemName,
                locationId: row.locationId,
                locationName: row.locationName,
                serviceName: proc?.name ?? 'Service',
                lastDone: last,
                dueIn,
            };
        })
    );

    // Sort by dueIn ascending (overdue/soonest first), nulls last; tie-break by item name, then last done desc
    enriched.sort((a, b) => {
        const av = a.dueIn ?? Number.POSITIVE_INFINITY;
        const bv = b.dueIn ?? Number.POSITIVE_INFINITY;
        if (av !== bv) return av - bv;
        const nameCmp = a.itemName.localeCompare(b.itemName, undefined, {sensitivity: 'base'});
        if (nameCmp !== 0) return nameCmp;
        const ad = a.lastDone ?? '';
        const bd = b.lastDone ?? '';
        return bd.localeCompare(ad);
    });

    return (
        <section style={{
            padding: '1rem',
            border: '1px solid #2a3550',
            borderRadius: 8,
            background: '#0b1230',
            width: '100%',
            maxWidth: 1000
        }}>
            <h2 style={{marginTop: 0}}>Dashboard</h2>
            <div style={{fontSize: 12, color: '#93a0b8', marginBottom: '0.5rem'}}>Item → Service → Last complete → Due
                in
            </div>
            <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem'}}>
                {enriched.map((r, idx) => (
                    <li key={idx} style={{
                        border: '1px solid #223055',
                        borderRadius: 8,
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                    }}>
                        <div style={{
                            whiteSpace: 'nowrap',
                            width: "20%",
                            textAlign: "left",
                            color: '#c7d4ea'
                        }}>{formatDueIn(r.dueIn)}</div>
                        <div style={{display: 'grid', width: "20%"}}>
                            <span style={{fontWeight: 600}}>{r.itemName}</span>
                            <span style={{fontSize: 12, color: '#93a0b8'}}>{r.locationName}</span>
                        </div>
                        <div style={{color: '#d7e2f2', width: "35%", textAlign: 'left'}}>{r.serviceName}</div>
                        <div style={{
                            whiteSpace: 'nowrap',
                            width: "25%",
                            textAlign: "right",
                            color: '#a9b4c1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.5rem'
                        }}>
                            <span>{formatDate(r.lastDone)}</span>
                            <Link
                                href={`/homes/${homeId}/locations/${r.locationId}/items/${r.itemId}/view`}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    border: '1px solid #2a3550',
                                    borderRadius: 6,
                                    background: '#162046',
                                    color: '#c7d4ea',
                                    textDecoration: 'none',
                                    fontSize: 13
                                }}
                            >
                                View
                            </Link>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
