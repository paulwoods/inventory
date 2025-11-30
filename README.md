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
    - The home page shows a form to create a Home and a list of existing Homes with Edit/Delete actions.
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
