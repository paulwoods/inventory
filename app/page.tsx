export default function HomePage() {
    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem'
        }}>
            <h1>Inventory</h1>
            <p>Welcome! This is a fresh Next.js app router project.</p>
            <p>
                Get started by editing <code>app/page.tsx</code>
            </p>
            <div>
                <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer">
                    Next.js Docs
                </a>
            </div>
        </main>
    );
}
