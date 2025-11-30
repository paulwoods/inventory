import {NextResponse} from 'next/server';
import {deleteEquipment, getEquipment, updateEquipment} from '@/lib/storage/equipment';
import {type ApiResponse, type Equipment, validateEquipmentInput} from '@/lib/types';

type Params = { params: { id: string } };

export const runtime = 'nodejs';

export async function GET(_req: Request, {params}: Params) {
    const item = await getEquipment(params.id);
    if (!item) return NextResponse.json({
        ok: false,
        error: 'Equipment not found.'
    } as ApiResponse<never>, {status: 404});
    const body: ApiResponse<Equipment> = {ok: true, data: item};
    return NextResponse.json(body, {status: 200});
}

export async function PUT(req: Request, {params}: Params) {
    try {
        const json = await req.json();
        const err = validateEquipmentInput({name: json?.name, procedureIds: json?.procedureIds});
        if (err) return NextResponse.json({ok: false, error: err} as ApiResponse<never>, {status: 400});
        const updated = await updateEquipment(params.id, {
            name: String(json.name),
            procedureIds: Array.isArray(json.procedureIds) ? json.procedureIds.map(String) : []
        });
        if (!updated) return NextResponse.json({
            ok: false,
            error: 'Equipment not found.'
        } as ApiResponse<never>, {status: 404});
        const body: ApiResponse<Equipment> = {ok: true, data: updated};
        return NextResponse.json(body, {status: 200});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}

export async function DELETE(_req: Request, {params}: Params) {
    const ok = await deleteEquipment(params.id);
    if (!ok) return NextResponse.json({ok: false, error: 'Equipment not found.'} as ApiResponse<never>, {status: 404});
    const body: ApiResponse<{ id: string }> = {ok: true, data: {id: params.id}};
    return NextResponse.json(body, {status: 200});
}
