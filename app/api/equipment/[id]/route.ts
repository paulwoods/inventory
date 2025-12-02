import {deleteEquipment, getEquipment, updateEquipment} from '@/lib/storage/equipment';
import {type Equipment, validateEquipmentInput} from '@/lib/types';
import {fail, ok} from '@/lib/utils/api';

type Params = { params: { id: string } };

export const runtime = 'nodejs';

export async function GET(_req: Request, {params}: Params) {
    const item = await getEquipment(params.id);
    if (!item) return fail('Equipment not found.', 404);
    return ok<Equipment>(item, 200);
}

export async function PUT(req: Request, {params}: Params) {
    try {
        const json = await req.json();
        const err = validateEquipmentInput({name: json?.name, procedureIds: json?.procedureIds});
        if (err) return fail(err, 400);
        const updated = await updateEquipment(params.id, {
            name: String(json.name),
            procedureIds: Array.isArray(json.procedureIds) ? json.procedureIds.map(String) : []
        });
        if (!updated) return fail('Equipment not found.', 404);
        return ok<Equipment>(updated, 200);
    } catch {
        return fail('Invalid JSON body.', 400);
    }
}

export async function DELETE(_req: Request, {params}: Params) {
    const ok = await deleteEquipment(params.id);
    if (!ok) return fail('Equipment not found.', 404);
    return ok<{ id: string }>({id: params.id}, 200);
}
