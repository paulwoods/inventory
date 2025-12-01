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
            return {
                itemName: row.itemName,
                locationName: row.locationName,
                serviceName: proc?.name ?? 'Service',
                lastDone: last,
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
            <div style={{fontSize: 12, color: '#93a0b8', marginBottom: '0.5rem'}}>Item → Service → Last complete</div>
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
                        <div style={{display: 'grid'}}>
                            <span style={{fontWeight: 600}}>{r.itemName}</span>
                            <span style={{fontSize: 12, color: '#93a0b8'}}>{r.locationName}</span>
                        </div>
                        <div style={{flex: 1, color: '#d7e2f2'}}>{r.serviceName}</div>
                        <div style={{whiteSpace: 'nowrap', color: '#a9b4c1'}}>{formatDate(r.lastDone)}</div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
