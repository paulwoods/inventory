Inventory — Next.js App

This folder contains a fresh Next.js (App Router, TypeScript) project scaffold.

Getting Started

- Install dependencies: npm install
- Run dev server: npm run dev (open http://localhost:3000)
- Build: npm run build
- Start: npm run start

Key Files

- app/page.tsx — Home page
- app/layout.tsx — Root layout with global styles
- app/globals.css — Global CSS
- next.config.ts — Next.js configuration
- tsconfig.json — TypeScript configuration
- eslint.config.mjs — ESLint flat config for Next.js

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
