"use client";

import {useState} from 'react';
import {useRouter} from 'next/navigation';

type Props = {
    serviceId: string;
    onCompleted?: () => void;
};

export default function CompleteServiceButton({serviceId, onCompleted}: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleClick() {
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/services/${serviceId}/work`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({})
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) throw new Error(data?.error || 'Failed to complete.');
            onCompleted?.();
            router.refresh();
        } catch (e: any) {
            setError(e?.message || 'Failed to complete');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem'}}>
            <button onClick={handleClick} disabled={submitting} style={{
                padding: '0.35rem 0.7rem',
                borderRadius: 6,
                border: '1px solid #2a3550',
                background: submitting ? '#1b2445' : '#103a20',
                color: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer'
            }}>
                {submitting ? 'Completing…' : 'Complete'}
            </button>
            {error && <span style={{color: '#ff8a8a', fontSize: 12}}>{error}</span>}
        </div>
    );
}
