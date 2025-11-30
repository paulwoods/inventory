import {NextResponse} from 'next/server';
import {getHome} from '@/lib/storage/homes';
import {getLocation} from '@/lib/storage/locations';
import {deleteItem, getItem, updateItem} from '@/lib/storage/items';
import {type ApiResponse, type Item, validateItemInput} from '@/lib/types';

type Params = { params: { homeId: string; locationId: string; serviceId: string } };

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
    const item = await getItem(params.locationId, params.serviceId);
    if (!item) {
        const body: ApiResponse<never> = {ok: false, error: 'Item not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<Item> = {ok: true, data: item};
    return NextResponse.json(body, {status: 200});
}

export async function PUT(req: Request, {params}: Params) {
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
        const error = validateItemInput({name: json?.name ?? '', description: json?.description ?? ''});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const updated = await updateItem(params.locationId, params.serviceId, {
            name: json.name,
            description: json.description
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
    const ok = await deleteItem(params.locationId, params.serviceId);
    if (!ok) {
        const body: ApiResponse<never> = {ok: false, error: 'Item not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<{ id: string }> = {ok: true, data: {id: params.serviceId}};
    return NextResponse.json(body, {status: 200});
}
