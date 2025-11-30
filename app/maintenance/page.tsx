import MaintenancesList from '@/components/MaintenancesList';
import TitleBar from '@/components/TitleBar';

export const dynamic = 'force-dynamic';

export default function MaintenancePage() {
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
            <h1>Maintenance</h1>
            <p style={{color: 'var(--muted)'}}>Manage global maintenance procedures. Procedure content supports
                Markdown.</p>
            <MaintenancesList/>
        </main>
    );
}
