import {NextResponse} from 'next/server';
import {getHome} from '@/lib/storage/homes';
import {deleteLocation, getLocation, updateLocation} from '@/lib/storage/locations';
import {type ApiResponse, type Location, validateLocationInput} from '@/lib/types';

export const runtime = 'nodejs';

type Params = { params: Promise<{ homeId: string; locationId: string }> };

export async function GET(_req: Request, {params}: Params) {
    const {homeId, locationId} = await params;
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
    const body: ApiResponse<Location> = {ok: true, data: loc};
    return NextResponse.json(body, {status: 200});
}

export async function PUT(req: Request, {params}: Params) {
    const {homeId, locationId} = await params;
    const home = await getHome(homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    try {
        const json = await req.json();
        const error = validateLocationInput({name: json?.name ?? '', description: json?.description ?? ''});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const updated = await updateLocation(homeId, locationId, {
            name: json.name,
            description: json.description
        });
        if (!updated) {
            const body: ApiResponse<never> = {ok: false, error: 'Location not found.'};
            return NextResponse.json(body, {status: 404});
        }
        const body: ApiResponse<Location> = {ok: true, data: updated};
        return NextResponse.json(body, {status: 200});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}

export async function DELETE(_req: Request, {params}: Params) {
    const {homeId, locationId} = await params;
    const home = await getHome(homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const ok = await deleteLocation(homeId, locationId);
    if (!ok) {
        const body: ApiResponse<never> = {ok: false, error: 'Location not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<{ id: string }> = {ok: true, data: {id: locationId}};
    return NextResponse.json(body, {status: 200});
}
