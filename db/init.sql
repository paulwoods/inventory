-- PostgreSQL schema for Inventory app

CREATE TABLE IF NOT EXISTS homes
(
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations
(
    id          TEXT PRIMARY KEY,
    home_id     TEXT NOT NULL REFERENCES homes (id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locations_home ON locations (home_id);

CREATE TABLE IF NOT EXISTS procedures
(
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    procedure  TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment
(
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment_procedures
(
    equipment_id TEXT NOT NULL REFERENCES equipment (id) ON DELETE CASCADE,
    procedure_id TEXT NOT NULL REFERENCES procedures (id) ON DELETE CASCADE,
    PRIMARY KEY (equipment_id, procedure_id)
);

CREATE TABLE IF NOT EXISTS items
(
    id           TEXT PRIMARY KEY,
    location_id  TEXT NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT,
    equipment_id TEXT REFERENCES equipment (id) ON DELETE SET NULL,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_items_location ON items (location_id);
CREATE INDEX IF NOT EXISTS idx_items_equipment ON items (equipment_id);

CREATE TABLE IF NOT EXISTS services
(
    id           TEXT PRIMARY KEY,
    item_id      TEXT    NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    procedure_id TEXT    NOT NULL REFERENCES procedures (id) ON DELETE RESTRICT,
    interval     INTEGER NOT NULL,
    created_at   TEXT    NOT NULL,
    updated_at   TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_services_item ON services (item_id);
CREATE INDEX IF NOT EXISTS idx_services_procedure ON services (procedure_id);

CREATE TABLE IF NOT EXISTS works
(
    id           TEXT PRIMARY KEY,
    service_id   TEXT NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    performed_at TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_works_service ON works (service_id);
