import {deleteEquipment, getEquipment, updateEquipment} from '@/lib/storage/equipment';
import {type Equipment, validateEquipmentInput} from '@/lib/types';
import {fail, ok} from '@/lib/utils/api';

type Params = { params: Promise<{ id: string }> };

export const runtime = 'nodejs';

export async function GET(_req: Request, {params}: Params) {
    const {id} = await params;
    const item = await getEquipment(id);
    if (!item) return fail('Equipment not found.', 404);
    return ok<Equipment>(item, 200);
}

export async function PUT(req: Request, {params}: Params) {
    try {
        const {id} = await params;
        const json = await req.json();
        const err = validateEquipmentInput({name: json?.name, procedureIds: json?.procedureIds});
        if (err) return fail(err, 400);
        const updated = await updateEquipment(id, {
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
    const {id} = await params;
    const deleted = await deleteEquipment(id);
    if (!deleted) return fail('Equipment not found.', 404);
    return ok<{ id: string }>({id}, 200);
}
