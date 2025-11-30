import {NextResponse} from 'next/server';
import {createEquipment, listEquipment} from '@/lib/storage/equipment';
import {type ApiResponse, type Equipment, validateEquipmentInput} from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
    const items = await listEquipment();
    const body: ApiResponse<Equipment[]> = {ok: true, data: items};
    return NextResponse.json(body, {status: 200});
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const error = validateEquipmentInput({name: json?.name, procedureIds: json?.procedureIds});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const created = await createEquipment({
            name: String(json.name),
            procedureIds: Array.isArray(json.procedureIds) ? json.procedureIds.map(String) : []
        });
        const body: ApiResponse<Equipment> = {ok: true, data: created};
        return NextResponse.json(body, {status: 201});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}
