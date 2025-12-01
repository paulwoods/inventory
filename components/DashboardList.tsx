import {listLocationsByHome} from '@/lib/storage/locations';
import {listItemsByLocation} from '@/lib/storage/items';
import {listServicesByItem} from '@/lib/storage/services';
import {listWorksByService} from '@/lib/storage/work';
import {getProcedure} from '@/lib/storage/procedures';

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
    return Math.max(0, days);
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
            return list.map((it) => ({...it, locationName: loc.name}));
        })
    )).flat();

    // Load services for each item
    const servicesByItem = await Promise.all(
        items.map(async (it) => {
            const services = await listServicesByItem(it.id);
            return services.map((s) => ({service: s, itemId: it.id, itemName: it.name, locationName: it.locationName}));
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
                itemName: row.itemName,
                locationName: row.locationName,
                serviceName: proc?.name ?? 'Service',
                lastDone: last,
                dueIn,
            };
        })
    );

    // Sort by last done desc, then item name
    enriched.sort((a, b) => {
        const ad = a.lastDone ?? '';
        const bd = b.lastDone ?? '';
        const cmp = bd.localeCompare(ad);
        if (cmp !== 0) return cmp;
        return a.itemName.localeCompare(b.itemName, undefined, {sensitivity: 'base'});
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
                        <div style={{display: 'grid', width: "40%"}}>
                            <span style={{fontWeight: 600}}>{r.itemName}</span>
                            <span style={{fontSize: 12, color: '#93a0b8'}}>{r.locationName}</span>
                        </div>
                        <div style={{color: '#d7e2f2', width: "20%", textAlign: 'center'}}>{r.serviceName}</div>
                        <div style={{
                            whiteSpace: 'nowrap',
                            width: "20%",
                            textAlign: "right",
                            color: '#a9b4c1'
                        }}>{formatDate(r.lastDone)}</div>
                        <div style={{
                            whiteSpace: 'nowrap',
                            width: "20%",
                            textAlign: "right",
                            color: '#c7d4ea'
                        }}>{formatDueIn(r.dueIn)}</div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
