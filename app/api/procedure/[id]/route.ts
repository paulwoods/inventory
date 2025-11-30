import {NextResponse} from 'next/server';
import {deleteProcedure, getProcedure, updateProcedure} from '@/lib/storage/procedures';
import {type ApiResponse, type Procedure, validateProcedureInput} from '@/lib/types';

type Params = { params: { id: string } };

export const runtime = 'nodejs';

export async function GET(_req: Request, {params}: Params) {
    const m = await getProcedure(params.id);
    if (!m) {
        const body: ApiResponse<never> = {ok: false, error: 'Procedure not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<Procedure> = {ok: true, data: m};
    return NextResponse.json(body, {status: 200});
}

export async function PUT(req: Request, {params}: Params) {
    try {
        const json = await req.json();
        const error = validateProcedureInput({name: json?.name ?? '', procedure: json?.procedure ?? ''});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const updated = await updateProcedure(params.id, {name: json.name, procedure: json.procedure});
        if (!updated) {
            const body: ApiResponse<never> = {ok: false, error: 'Procedure not found.'};
            return NextResponse.json(body, {status: 404});
        }
        const body: ApiResponse<Procedure> = {ok: true, data: updated};
        return NextResponse.json(body, {status: 200});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}

export async function DELETE(_req: Request, {params}: Params) {
    const ok = await deleteProcedure(params.id);
    if (!ok) {
        const body: ApiResponse<never> = {ok: false, error: 'Procedure not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<{ id: string }> = {ok: true, data: {id: params.id}};
    return NextResponse.json(body, {status: 200});
}
