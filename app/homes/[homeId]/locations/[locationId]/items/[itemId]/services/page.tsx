import {notFound} from 'next/navigation';
import Link from 'next/link';
import {getHome} from '@/lib/storage/homes';
import {getLocation} from '@/lib/storage/locations';
import {getItem} from '@/lib/storage/items';
import ServicesList from '@/components/ServicesList';

type Params = { params: { homeId: string; locationId: string; itemId: string } };

export const dynamic = 'force-dynamic';

export default async function ItemServicesPage({params}: Params) {
    const home = await getHome(params.homeId);
    if (!home) return notFound();
    const location = await getLocation(params.homeId, params.locationId);
    if (!location) return notFound();
    const item = await getItem(params.locationId, params.itemId);
    if (!item) return notFound();

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
            <h1 style={{marginTop: 0}}>Services for: {item.name}</h1>
            {item.description && <p style={{color: 'var(--muted)'}}>{item.description}</p>}

            <ServicesList homeId={home.id} locationId={location.id} itemId={item.id}/>
        </main>
    );
}
