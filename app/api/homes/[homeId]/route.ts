import {NextResponse} from 'next/server';
import {deleteHome, getHome, updateHome} from '@/lib/storage/homes';
import {type ApiResponse, type Home, validateHomeInput} from '@/lib/types';

type Params = { params: { homeId: string } };

export async function GET(_req: Request, {params}: Params) {
    const home = await getHome(params.homeId);
    if (!home) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<Home> = {ok: true, data: home};
    return NextResponse.json(body, {status: 200});
}

export async function PUT(req: Request, {params}: Params) {
    try {
        const json = await req.json();
        const error = validateHomeInput({name: json?.name ?? '', description: json?.description ?? ''});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const updated = await updateHome(params.homeId, {name: json.name, description: json.description});
        if (!updated) {
            const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
            return NextResponse.json(body, {status: 404});
        }
        const body: ApiResponse<Home> = {ok: true, data: updated};
        return NextResponse.json(body, {status: 200});
    } catch {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}

export async function DELETE(_req: Request, {params}: Params) {
    const ok = await deleteHome(params.homeId);
    if (!ok) {
        const body: ApiResponse<never> = {ok: false, error: 'Home not found.'};
        return NextResponse.json(body, {status: 404});
    }
    const body: ApiResponse<{ id: string }> = {ok: true, data: {id: params.homeId}};
    return NextResponse.json(body, {status: 200});
}
