import {NextResponse} from 'next/server';
import type {ApiResponse} from '@/lib/types';

// Response helpers to standardize API JSON shapes
export function ok<T>(data: T, status = 200) {
    const body: ApiResponse<T> = {ok: true, data};
    return NextResponse.json(body, {status});
}

export function fail(message: string, status = 400) {
    const body: ApiResponse<never> = {ok: false, error: message};
    return NextResponse.json(body, {status});
}
