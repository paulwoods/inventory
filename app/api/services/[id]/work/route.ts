import {NextResponse} from 'next/server';
import {getService} from '@/lib/storage/services';
import {createWork, listWorksByService} from '@/lib/storage/work';
import {type ApiResponse, validateWorkInput, type Work, type WorkInput} from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, {params}: Params) {
    const {id} = await params;
    const svc = await getService(id);
    if (!svc) return NextResponse.json({ok: false, error: 'Service not found.'} as ApiResponse<never>, {status: 404});
    const items = await listWorksByService(id);
    const body: ApiResponse<Work[]> = {ok: true, data: items};
    return NextResponse.json(body, {status: 200});
}

export async function POST(req: Request, {params}: Params) {
    const {id} = await params;
    const svc = await getService(id);
    if (!svc) return NextResponse.json({ok: false, error: 'Service not found.'} as ApiResponse<never>, {status: 404});
    try {
        const json = await req.json().catch(() => ({}));
        const input: WorkInput = {};
        if (json && json.performedAt !== undefined) input.performedAt = String(json.performedAt);
        const err = validateWorkInput(input);
        if (err) return NextResponse.json({ok: false, error: err} as ApiResponse<never>, {status: 400});
        const created = await createWork(id, input);
        const body: ApiResponse<Work> = {ok: true, data: created};
        return NextResponse.json(body, {status: 201});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}
