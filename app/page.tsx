import HomesList from '@/components/HomesList';

export default function HomePage() {
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
            <h1>Inventory</h1>
            <p style={{color: 'var(--muted)'}}>Manage your Homes below.</p>
            <HomesList/>
        </main>
    );
}
