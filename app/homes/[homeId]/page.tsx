import {notFound} from 'next/navigation';
import {type Home} from '@/lib/types';
import LocationsList from '@/components/LocationsList';
import Link from 'next/link';
import {getHome} from '@/lib/storage/homes';
import DashboardList from '@/components/DashboardList';
import HomeTabs from '@/components/HomeTabs';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ homeId: string }> };

export default async function HomeLocationsPage({params}: Params) {
    const {homeId} = await params;
    const home = (await getHome(homeId)) as Home | undefined;
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
            <nav style={{fontSize: 14}}>
                <Link href="/">← Back to Homes</Link>
            </nav>
            <h1 style={{marginTop: 0}}>Home: {home.name}</h1>
            {home.description && <p style={{color: 'var(--muted)'}}>{home.description}</p>}

            <HomeTabs/>

            {/* Panels controlled by HomeTabs (client) via element IDs */}
            <div id="dashboard-panel" style={{display: 'block', width: '100%'}}>
                <DashboardList homeId={home.id}/>
            </div>
            <div id="locations-panel" style={{display: 'none', width: '100%'}}>
                <LocationsList homeId={home.id}/>
            </div>

        </main>
    );
}
