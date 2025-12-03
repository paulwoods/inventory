import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Inventory',
    description: 'Inventory app scaffolded with Next.js',
    icons: {
        icon: '/icon.svg',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
        <header className="app-header">
            <a className="app-brand" href="/">
                <img className="app-logo" src="/icon.svg" alt="Inventory logo" width={24} height={24}/>
                <span className="app-title">Inventory</span>
            </a>
        </header>
        <main className="app-main">
            {children}
        </main>
        </body>
        </html>
    );
}
