import ProceduresList from '@/components/ProceduresList';
import TitleBar from '@/components/TitleBar';

export const dynamic = 'force-dynamic';

export default function ProcedurePage() {
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
            <h1>Procedures</h1>
            <p style={{color: 'var(--muted)'}}>Manage maintenance procedures. Procedure content supports
                Markdown.</p>
            <ProceduresList/>
        </main>
    );
}
