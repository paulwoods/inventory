import {notFound} from 'next/navigation';
import Link from 'next/link';
import TitleBar from '@/components/TitleBar';
import {getHome} from '@/lib/storage/homes';
import {getLocation} from '@/lib/storage/locations';
import {getItem} from '@/lib/storage/items';
import {getEquipment} from '@/lib/storage/equipment';
import {listServicesByItem} from '@/lib/storage/services';
import {listProcedures} from '@/lib/storage/procedures';
import ReactMarkdown from 'react-markdown';

type Params = { params: { homeId: string; locationId: string; itemId: string } };

export const dynamic = 'force-dynamic';

export default async function ItemViewPage({params}: Params) {
    const home = await getHome(params.homeId);
    if (!home) return notFound();
    const location = await getLocation(params.homeId, params.locationId);
    if (!location) return notFound();
    const item = await getItem(params.locationId, params.itemId);
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
            <TitleBar/>
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
