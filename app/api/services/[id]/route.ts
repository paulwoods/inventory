import {NextResponse} from 'next/server';
import {deleteService, getService, updateService} from '@/lib/storage/services';
import {type ApiResponse, type Service, validateServiceInput} from '@/lib/types';

type Params = { params: { id: string } };

export async function GET(_req: Request, {params}: Params) {
    const svc = await getService(params.id);
    if (!svc) return NextResponse.json({ok: false, error: 'Service not found.'} as ApiResponse<never>, {status: 404});
    const body: ApiResponse<Service> = {ok: true, data: svc};
    return NextResponse.json(body, {status: 200});
}

export async function PUT(req: Request, {params}: Params) {
    try {
        const json = await req.json();
        const payload: Partial<{ procedureId: string; interval: number }> = {};
        if (json?.procedureId !== undefined) payload.procedureId = String(json.procedureId);
        if (json?.interval !== undefined) payload.interval = Number(json.interval);
        const err = validateServiceInput({
            procedureId: payload.procedureId ?? '',
            interval: payload.interval ?? NaN
        });
        if (err) return NextResponse.json({ok: false, error: err} as ApiResponse<never>, {status: 400});
        const updated = await updateService(params.id, {
            procedureId: payload.procedureId!,
            interval: payload.interval!
        });
        if (!updated) return NextResponse.json({
            ok: false,
            error: 'Service not found.'
        } as ApiResponse<never>, {status: 404});
        const body: ApiResponse<Service> = {ok: true, data: updated};
        return NextResponse.json(body, {status: 200});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}

export async function DELETE(_req: Request, {params}: Params) {
    const ok = await deleteService(params.id);
    if (!ok) return NextResponse.json({ok: false, error: 'Service not found.'} as ApiResponse<never>, {status: 404});
    const body: ApiResponse<{ id: string }> = {ok: true, data: {id: params.id}};
    return NextResponse.json(body, {status: 200});
}
