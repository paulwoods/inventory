import {notFound} from 'next/navigation';
import Link from 'next/link';
import {getHome} from '@/lib/storage/homes';
import {getLocation} from '@/lib/storage/locations';
import ItemsList from '@/components/ItemsList';

type Params = { params: { homeId: string; locationId: string } };

export default async function LocationItemsPage({params}: Params) {
    const home = await getHome(params.homeId);
    if (!home) return notFound();
    const location = await getLocation(params.homeId, params.locationId);
    if (!location) return notFound();
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
            </nav>
            <h1 style={{marginTop: 0}}>Location: {location.name}</h1>
            {location.description && <p style={{color: 'var(--muted)'}}>{location.description}</p>}

            <ItemsList homeId={home.id} locationId={location.id}/>
        </main>
    );
}
