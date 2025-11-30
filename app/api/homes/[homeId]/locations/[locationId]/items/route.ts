import {NextResponse} from 'next/server';
import {getHome} from '@/lib/storage/homes';
import {getLocation} from '@/lib/storage/locations';
import {createItem, listItemsByLocation} from '@/lib/storage/items';
import {getEquipment} from '@/lib/storage/equipment';
import {type ApiResponse, type Item, validateItemInput} from '@/lib/types';

type Params = { params: { homeId: string; locationId: string } };

export async function GET(_req: Request, {params}: Params) {
    const home = await getHome(params.homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const loc = await getLocation(params.homeId, params.locationId);
    if (!loc) {
        const body: ApiResponse<never> = {ok: false, error: 'Location not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const items = await listItemsByLocation(params.locationId);
    const body: ApiResponse<Item[]> = {ok: true, data: items};
    return NextResponse.json(body, {status: 200});
}

export async function POST(req: Request, {params}: Params) {
    const home = await getHome(params.homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const loc = await getLocation(params.homeId, params.locationId);
    if (!loc) {
        const body: ApiResponse<never> = {ok: false, error: 'Location not found.'};
        return NextResponse.json(body, {status: 404});
    }
    try {
        const json = await req.json();
        const error = validateItemInput({name: json?.name, description: json?.description});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        // Optional equipment link validation
        let equipmentId: string | undefined = undefined;
        if (json?.equipmentId !== undefined && json.equipmentId !== null && String(json.equipmentId).trim() !== '') {
            equipmentId = String(json.equipmentId);
            const eq = await getEquipment(equipmentId);
            if (!eq) {
                const body: ApiResponse<never> = {ok: false, error: 'Equipment not found.'};
                return NextResponse.json(body, {status: 400});
            }
        }
        const item = await createItem(params.locationId, {
            name: json.name,
            description: json.description,
            equipmentId
        });
        const body: ApiResponse<Item> = {ok: true, data: item};
        return NextResponse.json(body, {status: 201});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}
