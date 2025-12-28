import {NextResponse} from 'next/server';
import {getHome} from '@/lib/storage/homes';
import {getLocation} from '@/lib/storage/locations';
import {getItem} from '@/lib/storage/items';
import {createService, listServicesByItem} from '@/lib/storage/services';
import {type ApiResponse, type Service, validateServiceInput} from '@/lib/types';

export const runtime = 'nodejs';

type Params = { params: Promise<{ homeId: string; locationId: string; itemId: string }> };

export async function GET(_req: Request, {params}: Params) {
    const {homeId, locationId, itemId} = await params;
    const home = await getHome(homeId);
    if (!home) return NextResponse.json({ok: false, error: 'Home not found.'} as ApiResponse<never>, {status: 404});
    const loc = await getLocation(homeId, locationId);
    if (!loc) return NextResponse.json({ok: false, error: 'Location not found.'} as ApiResponse<never>, {status: 404});
    const item = await getItem(locationId, itemId);
    if (!item) return NextResponse.json({ok: false, error: 'Item not found.'} as ApiResponse<never>, {status: 404});
    const services = await listServicesByItem(item.id);
    const body: ApiResponse<Service[]> = {ok: true, data: services};
    return NextResponse.json(body, {status: 200});
}

export async function POST(req: Request, {params}: Params) {
    const {homeId, locationId, itemId} = await params;
    const home = await getHome(homeId);
    if (!home) return NextResponse.json({ok: false, error: 'Home not found.'} as ApiResponse<never>, {status: 404});
    const loc = await getLocation(homeId, locationId);
    if (!loc) return NextResponse.json({ok: false, error: 'Location not found.'} as ApiResponse<never>, {status: 404});
    const item = await getItem(locationId, itemId);
    if (!item) return NextResponse.json({ok: false, error: 'Item not found.'} as ApiResponse<never>, {status: 404});
    try {
        const json = await req.json();
        const interval = Number(json?.interval);
        const error = validateServiceInput({procedureId: json?.procedureId, interval});
        if (error) return NextResponse.json({ok: false, error} as ApiResponse<never>, {status: 400});
        const created = await createService(item.id, {procedureId: json.procedureId, interval});
        const body: ApiResponse<Service> = {ok: true, data: created};
        return NextResponse.json(body, {status: 201});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}
