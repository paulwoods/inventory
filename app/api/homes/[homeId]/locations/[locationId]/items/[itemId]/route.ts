import {NextResponse} from 'next/server';
import {getHome} from '@/lib/storage/homes';
import {getLocation} from '@/lib/storage/locations';
import {deleteItem, getItem, updateItem} from '@/lib/storage/items';
import {getEquipment} from '@/lib/storage/equipment';
import {type ApiResponse, type Item, validateItemInput} from '@/lib/types';

export const runtime = 'nodejs';

type Params = { params: Promise<{ homeId: string; locationId: string; itemId: string }> };

export async function GET(_req: Request, {params}: Params) {
    const {homeId, locationId, itemId} = await params;
    const home = await getHome(homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const loc = await getLocation(homeId, locationId);
    if (!loc) {
        const body: ApiResponse<never> = {ok: false, error: 'Location not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const item = await getItem(locationId, itemId);
    if (!item) {
        const body: ApiResponse<never> = {ok: false, error: 'Item not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<Item> = {ok: true, data: item};
    return NextResponse.json(body, {status: 200});
}

export async function PUT(req: Request, {params}: Params) {
    const {homeId, locationId, itemId} = await params;
    const home = await getHome(homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const loc = await getLocation(homeId, locationId);
    if (!loc) {
        const body: ApiResponse<never> = {ok: false, error: 'Location not found.'};
        return NextResponse.json(body, {status: 404});
    }
    try {
        const json = await req.json();
        const error = validateItemInput({name: json?.name ?? '', description: json?.description ?? ''});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        // Validate optional equipment link
        let equipmentId: string | undefined = undefined;
        if (json?.equipmentId !== undefined && json.equipmentId !== null && String(json.equipmentId).trim() !== '') {
            equipmentId = String(json.equipmentId);
            const eq = await getEquipment(equipmentId);
            if (!eq) return NextResponse.json({
                ok: false,
                error: 'Equipment not found.'
            } as ApiResponse<never>, {status: 400});
        }
        const updated = await updateItem(locationId, itemId, {
            name: json.name,
            description: json.description,
            equipmentId
        });
        if (!updated) {
            const body: ApiResponse<never> = {ok: false, error: 'Item not found.'};
            return NextResponse.json(body, {status: 404});
        }
        const body: ApiResponse<Item> = {ok: true, data: updated};
        return NextResponse.json(body, {status: 200});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}

export async function DELETE(_req: Request, {params}: Params) {
    const {homeId, locationId, itemId} = await params;
    const home = await getHome(homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const loc = await getLocation(homeId, locationId);
    if (!loc) {
        const body: ApiResponse<never> = {ok: false, error: 'Location not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const ok = await deleteItem(locationId, itemId);
    if (!ok) {
        const body: ApiResponse<never> = {ok: false, error: 'Item not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<{ id: string }> = {ok: true, data: {id: itemId}};
    return NextResponse.json(body, {status: 200});
}
