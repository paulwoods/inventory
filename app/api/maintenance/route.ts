import {NextResponse} from 'next/server';
import {createMaintenance, listMaintenances} from '@/lib/storage/maintenances';
import {type ApiResponse, type Maintenance, validateMaintenanceInput} from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
    const items = await listMaintenances();
    const body: ApiResponse<Maintenance[]> = {ok: true, data: items};
    return NextResponse.json(body, {status: 200});
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const error = validateMaintenanceInput({name: json?.name, procedure: json?.procedure});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const created = await createMaintenance({name: json.name, procedure: json.procedure});
        const body: ApiResponse<Maintenance> = {ok: true, data: created};
        return NextResponse.json(body, {status: 201});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}
