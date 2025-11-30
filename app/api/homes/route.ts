import {NextResponse} from 'next/server';
import {createHome, readHomes} from '@/lib/storage/homes';
import {type ApiResponse, type Home, validateHomeInput} from '@/lib/types';

export async function GET() {
    const homes = await readHomes();
    const sorted = [...homes].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
    const body: ApiResponse<Home[]> = {ok: true, data: sorted};
    return NextResponse.json(body, {status: 200});
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const error = validateHomeInput({name: json?.name, description: json?.description});
        if (error) {
            const body: ApiResponse<never> = {ok: false, error};
            return NextResponse.json(body, {status: 400});
        }
        const home = await createHome({name: json.name, description: json.description});
        const body: ApiResponse<Home> = {ok: true, data: home};
        return NextResponse.json(body, {status: 201});
    } catch (e) {
        const body: ApiResponse<never> = {ok: false, error: 'Invalid JSON body.'};
        return NextResponse.json(body, {status: 400});
    }
}
