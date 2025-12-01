import {notFound} from 'next/navigation';
import {type Home} from '@/lib/types';
import LocationsList from '@/components/LocationsList';
import Link from 'next/link';
import {getHome} from '@/lib/storage/homes';
import TitleBar from '@/components/TitleBar';
import DashboardList from '@/components/DashboardList';

type Params = { params: { homeId: string } };

export default async function HomeLocationsPage({params}: Params) {
    const home = (await getHome(params.homeId)) as Home | undefined;
    if (!home) return notFound();
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
            <nav style={{fontSize: 14}}>
                <Link href="/">← Back to Homes</Link>
            </nav>
            <h1 style={{marginTop: 0}}>Home: {home.name}</h1>
            {home.description && <p style={{color: 'var(--muted)'}}>{home.description}</p>}

            <DashboardList homeId={home.id}/>
            <LocationsList homeId={home.id}/>

        </main>
    );
}
