Inventory — Next.js App

An inventory and maintenance tracker built with Next.js App Router and TypeScript. It manages:

- Homes and their Locations
- Items stored at a Location
- Equipment definitions
- Procedures (Markdown)
- Services scheduled for Items, and Work logs when a Service is performed

Tech stack

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- File-based JSON persistence under `data/`

Getting Started

- Install dependencies: `npm install`
- Run dev server: `npm run dev` (open http://localhost:3000)
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`

Project Structure

Top-level directories and what they are responsible for:

- app/
    - Next.js App Router routes (UI pages) and API route handlers.
    - `app/page.tsx`: landing page/dashboard.
    - `app/layout.tsx`: root layout and global styles hookup.
    - UI routes like `app/homes/[homeId]/...` render server components for browsing and managing entities.
    - API routes under `app/api/**` implement CRUD over JSON storage (see API sections below).

- components/
    - Reusable React components for forms and entity lists (e.g., `HomesList`, `LocationsList`, `ItemsList`,
      `Equipment*`, `Procedures*`, `Service*`).
    - Pure UI/UX and client interaction. They rely on server actions/API endpoints to read/write data.

- lib/
    - Application library code shared across routes and components.
    - `lib/types.ts`: central TypeScript types for entities and validation helpers for request payloads.
    - `lib/storage/`: data-access layer reading/writing JSON files with simple write-queue protection and cascade
      deletes.
        - `homes.ts`, `locations.ts`, `items.ts`: hierarchical storage helpers.
        - `equipment.ts`, `procedures.ts`: global entities with relationships.
        - `services.ts`, `work.ts`: scheduling entities and logs related to Items/Procedures.
    - `lib/utils/api.ts`: response helpers to standardize API JSON shapes.

- data/
    - JSON files used for persistence (auto-created on demand): `homes.json`, `locations.json`, `items.json`,
      `equipment.json`, `procedures.json`, `services.json`, `work.json`.
    - Suitable for local development and demos. Not intended for concurrent multi-user production use.

- public/
    - Static assets served as-is (favicons, images, etc.).

- Config files
    - `next.config.ts`: Next.js configuration.
    - `tsconfig.json`: TypeScript configuration and path aliases (e.g., `@/lib/...`).
    - `eslint.config.mjs`: ESLint configuration.
    - `package.json`: scripts and dependencies.

Conventions

- API responses use a consistent envelope: `{ ok: true, data }` or `{ ok: false, error }` (see `lib/utils/api.ts` and
  `ApiResponse<T>` in `lib/types.ts`).
- Validation of inputs is centralized in `lib/types.ts` via `validate*Input` functions used by API routes.
- Storage modules implement simple atomic writes and best-effort cascades to maintain referential integrity across JSON
  files.

Homes CRUD

- Entity: Home
    - name: required, max 100 chars
    - description: optional, max 1000 chars

- Storage: simple JSON file at data/homes.json (created automatically)

- API Endpoints
    - GET /api/homes — list all homes
    - POST /api/homes — create
        - body: { "name": string, "description"?: string }
    - GET /api/homes/:id — fetch one
    - PUT /api/homes/:id — update
        - body: { "name": string, "description"?: string }
    - DELETE /api/homes/:id — delete

- UI
    - The home page shows a list of existing Homes with Edit/Delete actions and a Create button that opens a dialog with
      the creation form.
    - Inline validation enforces the field limits; server-side validation mirrors them.

Locations CRUD (per Home)

- Entity: Location
    - name: required, max 100 chars
    - description: optional, max 1000 chars
    - belongs to a Home (via `homeId`)

- Storage: simple JSON file at data/locations.json (auto-created)

- API Endpoints (nested under a Home)
    - GET /api/homes/:homeId/locations — list all locations for a Home
    - POST /api/homes/:homeId/locations — create
        - body: { "name": string, "description"?: string }
    - GET /api/homes/:homeId/locations/:id — fetch one
    - PUT /api/homes/:homeId/locations/:id — update
        - body: { "name": string, "description"?: string }
    - DELETE /api/homes/:homeId/locations/:id — delete

- UI
    - From the Homes list, click a Home name or the Open button to go to /homes/:homeId.
    - The Home page shows a Locations manager to create, edit, delete, and refresh Locations belonging to that Home.
    - Deleting a Home cascades and removes its Locations from storage.

Items CRUD (per Location)

- Entity: Item
    - name: required, max 100 chars
    - description: optional, max 1000 chars
    - belongs to a Location (via `locationId`)

- Storage: simple JSON file at data/items.json (auto-created)

- API Endpoints (nested under a Home and Location)
    - GET /api/homes/:homeId/locations/:locationId/items — list all items for a Location
    - POST /api/homes/:homeId/locations/:locationId/items — create
        - body: { "name": string, "description"?: string }
    - GET /api/homes/:homeId/locations/:locationId/items/:id — fetch one
    - PUT /api/homes/:homeId/locations/:locationId/items/:id — update
        - body: { "name": string, "description"?: string }
    - DELETE /api/homes/:homeId/locations/:locationId/items/:id — delete

- UI
    - From a Home’s Locations page, click a Location name or Open to go to /homes/:homeId/locations/:locationId.
    - The Location page shows an Items manager to create, edit, delete, and refresh Items belonging to that Location.
    - Deleting a Location cascades and removes its Items from storage.

Procedure CRUD (Global)

- Entity: Procedure
    - name: required, max 100 chars
    - procedure: required, max 4000 chars (Markdown content)

- Storage: simple JSON file at data/procedures.json (auto-created)

- API Endpoints
    - GET /api/procedure — list all maintenance procedures
    - POST /api/procedure — create
        - body: { "name": string, "procedure": string }
    - GET /api/procedure/:id — fetch one
    - PUT /api/procedure/:id — update
        - body: { "name": string, "procedure": string }
    - DELETE /api/procedure/:id — delete

- UI
    - Navigate to /maintenance to manage global maintenance procedures.
    - Create is done in a dialog; Edit is inline; Delete with confirmation.
    - Procedures are rendered as Markdown (using react-markdown).

Equipment CRUD (Global)

- Entity: Equipment
    - name: required, max 100 chars
    - procedureIds: array of zero-or-many `Procedure.id` values

- Storage: simple JSON file at data/equipment.json (auto-created)

- API Endpoints
    - GET /api/equipment — list all equipment
    - POST /api/equipment — create
        - body: { "name": string, "procedureIds": string[] }
    - GET /api/equipment/:id — fetch one
    - PUT /api/equipment/:id — update
        - body: { "name"?: string, "procedureIds"?: string[] }
    - DELETE /api/equipment/:id — delete

Services and Work (per Item)

- Entity: Service
    - itemId: required; parent Item
    - procedureId: required; links to a Procedure defining the steps
    - interval: required; number of days between services

- Entity: Work
    - serviceId: required; parent Service
    - performedAt: ISO timestamp when the service was performed (defaults to now if omitted)

- Storage: JSON files at data/services.json and data/work.json (auto-created)

- API Endpoints
    - GET /api/homes/:homeId/locations/:locationId/items/:itemId/services — list services for an Item
    - POST /api/homes/:homeId/locations/:locationId/items/:itemId/services — create service
        - body: { "procedureId": string, "interval": number }
    - GET /api/services/:id — fetch one service
    - PUT /api/services/:id — update
        - body: { "procedureId"?: string, "interval"?: number }
    - DELETE /api/services/:id — delete (cascades to remove related Work)
    - GET /api/services/:id/work — list Work entries for a Service
    - POST /api/services/:id/work — create Work entry
        - body: { "performedAt"?: string }

Running and Development Notes

- Path aliases: `@/*` resolves from project root (see `tsconfig.json`). Common import roots: `@/lib/*`,
  `@/components/*`.
- Server runtime: API routes use the Node.js runtime and operate on local JSON files under `data/`.
- Data reset: Delete files in `data/` to reset state; they will be recreated on next write.
- Persistence caution: JSON file storage is for local/dev use; it is not safe for concurrent multi-user production.

Key Files

- app/page.tsx — Home page
- app/layout.tsx — Root layout with global styles
- app/globals.css — Global CSS
- next.config.ts — Next.js configuration
- tsconfig.json — TypeScript configuration
- eslint.config.mjs — ESLint flat config for Next.js

License

This project is provided as-is for demonstration and local use. Add your preferred license if distributing.
