import {NextResponse} from 'next/server';
import {createProcedure, listProcedures} from '@/lib/storage/procedures';
import {type ApiResponse, type Procedure, validateProcedureInput} from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
    const items = await listProcedures();
    const body: ApiResponse<Procedure[]> = {ok: true, data: items};
    return NextResponse.json(body, {status: 200});
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const error = validateProcedureInput({name: json?.name, procedure: json?.procedure});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const created = await createProcedure({name: json.name, procedure: json.procedure});
        const body: ApiResponse<Procedure> = {ok: true, data: created};
        return NextResponse.json(body, {status: 201});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}
