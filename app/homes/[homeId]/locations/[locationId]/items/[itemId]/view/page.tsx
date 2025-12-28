import {notFound} from 'next/navigation';
import Link from 'next/link';
import {getHome} from '@/lib/storage/homes';
import {getLocation} from '@/lib/storage/locations';
import {getItem} from '@/lib/storage/items';
import {getEquipment} from '@/lib/storage/equipment';
import {listServicesByItem} from '@/lib/storage/services';
import {listProcedures} from '@/lib/storage/procedures';
import ReactMarkdown from 'react-markdown';
import CompleteServiceButton from '@/components/CompleteServiceButton';
import {listWorksByService} from '@/lib/storage/work';

type Params = { params: Promise<{ homeId: string; locationId: string; itemId: string }> };

export const dynamic = 'force-dynamic';

export default async function ItemViewPage({params}: Params) {
    const {homeId, locationId, itemId} = await params;
    const home = await getHome(homeId);
    if (!home) return notFound();
    const location = await getLocation(homeId, locationId);
    if (!location) return notFound();
    const item = await getItem(locationId, itemId);
    if (!item) return notFound();

    const [equipment, services, procedures] = await Promise.all([
        item.equipmentId ? getEquipment(item.equipmentId) : Promise.resolve(undefined),
        listServicesByItem(item.id),
        listProcedures()
    ]);

    const procBodyById: Record<string, string> = {};
    const procNameById: Record<string, string> = {};
    for (const p of procedures) {
        procBodyById[p.id] = p.procedure;
        procNameById[p.id] = p.name;
    }

    // Fetch work history and derive last completion info for each service
    const lastDoneByService: Record<string, string | null> = {};
    const daysSinceByService: Record<string, number | null> = {};
    const worksByService: Record<string, { performedAt: string }[]> = {};
    if (services.length > 0) {
        const worksArrays = await Promise.all(services.map((s) => listWorksByService(s.id)));
        services.forEach((s, idx) => {
            const arr = worksArrays[idx];
            worksByService[s.id] = arr.map(w => ({performedAt: w.performedAt}));
            if (arr.length > 0) {
                const performedAt = arr[0].performedAt;
                lastDoneByService[s.id] = performedAt;
                const days = Math.floor((Date.now() - new Date(performedAt).getTime()) / 86_400_000);
                daysSinceByService[s.id] = days;
            } else {
                lastDoneByService[s.id] = null;
                daysSinceByService[s.id] = null;
            }
        });
    }

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem'
        }}>
            <nav style={{fontSize: 14, display: 'flex', gap: '0.5rem'}}>
                <Link href="/">← Homes</Link>
                <span>/</span>
                <Link href={`/homes/${home.id}`}>Locations</Link>
                <span>/</span>
                <Link href={`/homes/${home.id}/locations/${location.id}`}>Items</Link>
                <span>/</span>
                <span>{item.name}</span>
            </nav>

            <h1 style={{marginTop: 0}}>Item: {item.name}</h1>
            {item.description && (
                <p style={{color: 'var(--muted)'}}>{item.description}</p>
            )}

            <section style={{width: '100%', maxWidth: 800, display: 'grid', gap: '1rem'}}>
                <div style={{padding: '1rem', border: '1px solid #2a3550', borderRadius: 8, background: '#0b1230'}}>
                    <h2 style={{marginTop: 0}}>Equipment</h2>
                    {equipment ? (
                        <div style={{display: 'grid', gap: '0.25rem'}}>
                            <strong>{equipment.name}</strong>
                            {/* Equipment has no description in the current model */}
                        </div>
                    ) : (
                        <div style={{color: '#a9b4c1'}}>No equipment linked.</div>
                    )}
                </div>

                <div>
                    {services.length === 0 ? (
                        <div style={{color: '#a9b4c1'}}>No services.</div>
                    ) : (
                        <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem'}}>
                            {services.map((s) => (
                                <li key={s.id}
                                    style={{border: '1px solid #223055', borderRadius: 8, padding: '0.5rem'}}>
                                    <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem'}}>
                                        <div style={{
                                            padding: "1em",
                                            flex: 1,
                                            display: 'grid',
                                            gap: '0.25rem',
                                            background: '#0f1630'
                                        }}>
                                            <h2>{procNameById[s.procedureId] || 'Unknown procedure'}</h2>
                                            <span style={{color: '#a9b4c1'}}>Every {s.interval} days</span>
                                            <div style={{
                                                marginTop: "1em",
                                                paddingTop: "1em",
                                                borderTop: "1px solid #223055"
                                            }}>
                                                <ReactMarkdown>
                                                    {procBodyById[s.procedureId] || '*Unknown procedure*'}
                                                </ReactMarkdown>
                                            </div>
                                            <div style={{marginTop: '0.75rem'}}>
                                                <CompleteServiceButton serviceId={s.id}/>
                                            </div>
                                            <span style={{fontSize: 12, color: '#7f8aa5'}}>
                                                Last done: {lastDoneByService[s.id] ? new Date(lastDoneByService[s.id] as string).toLocaleString() : 'never'}{daysSinceByService[s.id] !== null ? ` (${daysSinceByService[s.id]} days ago)` : ''}
                                            </span>
                                            {worksByService[s.id] && worksByService[s.id].length > 0 && (
                                                <div style={{marginTop: '0.5rem'}}>
                                                    <div style={{fontWeight: 600, marginBottom: 4}}>History</div>
                                                    <ul style={{margin: 0, paddingLeft: '1rem'}}>
                                                        {worksByService[s.id].map((w, i) => (
                                                            <li key={i} style={{color: '#a9b4c1', fontSize: 13}}>
                                                                {new Date(w.performedAt).toLocaleString()}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </main>
    );
}
