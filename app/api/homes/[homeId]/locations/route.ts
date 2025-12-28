import {NextResponse} from 'next/server';
import {getHome} from '@/lib/storage/homes';
import {createLocation, listLocationsByHome} from '@/lib/storage/locations';
import {type ApiResponse, type Location, validateLocationInput} from '@/lib/types';

export const runtime = 'nodejs';

type Params = { params: Promise<{ homeId: string }> };

export async function GET(_req: Request, {params}: Params) {
    const {homeId} = await params;
    const home = await getHome(homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const locations = await listLocationsByHome(homeId);
    const body: ApiResponse<Location[]> = {ok: true, data: locations};
    return NextResponse.json(body, {status: 200});
}

export async function POST(req: Request, {params}: Params) {
    const {homeId} = await params;
    const home = await getHome(homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    try {
        const json = await req.json();
        const error = validateLocationInput({name: json?.name, description: json?.description});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const loc = await createLocation(homeId, {name: json.name, description: json.description});
        const body: ApiResponse<Location> = {ok: true, data: loc};
        return NextResponse.json(body, {status: 201});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}
