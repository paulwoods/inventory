"use client";

import {useEffect, useState} from 'react';

export default function HomeTabs() {
    const [active, setActive] = useState<'dashboard' | 'locations'>('dashboard');

    useEffect(() => {
        const dash = document.getElementById('dashboard-panel');
        const locs = document.getElementById('locations-panel');
        if (!dash || !locs) return;
        if (active === 'dashboard') {
            dash.style.display = 'block';
            locs.style.display = 'none';
        } else {
            dash.style.display = 'none';
            locs.style.display = 'block';
        }
    }, [active]);

    const tabBtnStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '0.4rem 0.8rem',
        borderRadius: 8,
        border: '1px solid #2a3550',
        background: isActive ? '#1a2a4f' : '#0f1b3a',
        color: 'white',
        cursor: 'pointer'
    });

    return (
        <div role="tablist" aria-label="Home sections" style={{display: 'flex', gap: '0.5rem'}}>
            <button
                role="tab"
                aria-selected={active === 'dashboard'}
                aria-controls="dashboard-panel"
                onClick={() => setActive('dashboard')}
                style={tabBtnStyle(active === 'dashboard')}
            >
                Dashboard
            </button>
            <button
                role="tab"
                aria-selected={active === 'locations'}
                aria-controls="locations-panel"
                onClick={() => setActive('locations')}
                style={tabBtnStyle(active === 'locations')}
            >
                Locations
            </button>
        </div>
    );
}
