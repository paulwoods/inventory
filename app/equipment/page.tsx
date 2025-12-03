import EquipmentList from '@/components/EquipmentList';

export const dynamic = 'force-dynamic';

export default function EquipmentPage() {
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
            <h1>Equipment</h1>
            <p style={{color: 'var(--muted)'}}>Manage global equipment and associate procedures.</p>
            <EquipmentList/>
        </main>
    );
}
