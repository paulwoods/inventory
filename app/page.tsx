import HomesList from '@/components/HomesList';
import Link from 'next/link';

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
            <header style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid #2a3550'
            }}>
                <h1 style={{margin: 0}}>Inventory</h1>
                <nav style={{display: 'flex', gap: '0.5rem'}}>
                    <Link href="/" style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: 6,
                        border: '1px solid #2a3550',
                        background: '#101a3a',
                        color: 'white',
                        textDecoration: 'none'
                    }}>Home</Link>
                    <Link href="/maintenance" style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: 6,
                        border: '1px solid #2a3550',
                        background: '#10203a',
                        color: 'white',
                        textDecoration: 'none'
                    }}>Maintenance</Link>
                </nav>
            </header>

            <p style={{color: 'var(--muted)'}}>Manage your Homes below.</p>
            <HomesList/>
        </main>
    );
}
