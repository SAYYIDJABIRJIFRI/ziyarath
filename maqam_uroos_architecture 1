# Maqam & Uroos — Database Architecture & Linking Analysis

## Overview

The Ziyarath project uses a **dual-layer data architecture**: static seed data in TypeScript files (for local dev) with a Cloudflare D1 SQL backend for production. The two main entities — **Maqam** (sacred shrine) and **Uroos** (annual commemoration event) — are linked via a foreign key relationship.

---

## 📊 Entity Relationship

```mermaid
erDiagram
    MAQAM ||--o{ UROOS : "hosts (via maqam_id)"
    MAQAM ||--o{ PAGE_ALLOTMENT : "assigned to admin"
    UROOS ||--o{ PAGE_ALLOTMENT : "assigned to admin"
    SYSTEM_ROLE ||--o{ PAGE_ALLOTMENT : "assigns"
    
    MAQAM {
        text id PK
        text name
        text malayalam_name
        text location
        text city
        text country
        text region "kerala | india | middle-east | worldwide"
        text category "sahaba | sufi | scholar | shaheed | prophet"
        text era
        text description
        text significance
        text cover_image
        json visiting_hours
        json facilities
        json how_to_reach
        json contact_info
        text history
        text architecture
        text status "published | draft | archived"
    }
    
    UROOS {
        text id PK
        text title
        text malayalam_title
        text maqam_id FK "nullable → links to maqam"
        int is_standalone "1=standalone, 0=connected"
        text resting_person
        int hijri_month "1-12"
        text hijri_month_name
        int hijri_day
        text gregorian_date
        text recurrence
        text venue_name
        text city
        text state
        text country
        text description
        text history
        text significance
        json program_schedule
        text nercha_offerings
        json how_to_reach
        text organizer_name
        text organizer_contact
        text cover_image
        text status "published | draft | archived"
    }
```

---

## 🔗 Linking System: Maqam ↔ Uroos

### How Linking Works

| Field | Type | Description |
|-------|------|-------------|
| `uroos.maqam_id` | `TEXT (FK)` | References `maqams.id`. If set, the uroos is "connected" to that maqam. |
| `uroos.is_standalone` | `INTEGER` | `1` = standalone event, `0` = hosted at a maqam precinct. |

**Foreign Key:** `FOREIGN KEY (maqam_id) REFERENCES maqams(id) ON DELETE SET NULL`

### Bidirectional Fetching

| Direction | Function | Logic |
|-----------|----------|-------|
| Maqam → Uroos | `getMaqamById(id)` | Fetches maqam, then filters all uroos where `maqam_id === id` → returns `connectedUroos[]` |
| Uroos → Maqam | `getUroosById(id)` | Fetches uroos, then if `maqamId` is set, fetches the connected maqam → returns `connectedMaqam` |

### Currently Linked Entries (5 linked, 22 standalone)

| Uroos ID | Linked Maqam ID | Maqam Exists? |
|----------|-----------------|---------------|
| `mampuram-uroos` | `mampuram` | ✅ Yes |
| `madavoor-uroos` | `madavoor` | ⚠️ **NO** — Missing maqam entry |
| `beemapally-uroos` | `beemapally` | ✅ Yes |
| `ajmer-khwaja-muinuddin-uroos` | `ajmer` | ✅ Yes |
| `kondotty-nercha` | `kondotty` | ✅ Yes |

> [!WARNING]
> **Broken Link:** The uroos `madavoor-uroos` references `maqamId: "madavoor"`, but there is no maqam with `id: "madavoor"` in [`maqams.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/data/maqams.ts). This means the "Connected Maqam" card will not render on that uroos detail page.

---

## 📁 Data Layer Files

| File | Purpose | Entries |
|------|---------|---------|
| [`maqams.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/data/maqams.ts) | Static seed data for 9 maqams | `MAQAMS: Maqam[]` |
| [`uroos.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/data/uroos.ts) | Calendar data — hijri month/day entries with `pageId` links | `UROOS_MONTHS: UroosMonth[]` |
| [`uroos-pages.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/data/uroos-pages.ts) | Full dedicated page data for 27 uroos events | `ALL_DEDICATED_UROOS: DbUroos[]` |
| [`content.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/types/content.ts) | TypeScript types: `DbMaqam`, `DbUroos`, `PageAllotment`, `SystemUser` |

## 📡 Server Functions Layer

| Function | Method | Source |
|----------|--------|--------|
| `listMaqamsPublicFn` | GET | [`content.functions.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/lib/content.functions.ts) |
| `getMaqamPublicDetailFn` | GET | [`content.functions.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/lib/content.functions.ts) |
| `listUroosPublicFn` | GET | [`content.functions.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/lib/content.functions.ts) |
| `getUroosPublicDetailFn` | GET | [`content.functions.ts`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/lib/content.functions.ts) |

## 🗺️ Route Architecture

| Route | File | Description |
|-------|------|-------------|
| `/maqam` | [`maqam.tsx`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/routes/maqam.tsx) | Maqam directory listing with search/filter |
| `/maqam/$id` | [`maqam_.$id.tsx`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/routes/maqam_.$id.tsx) | Maqam detail page (shows connected uroos) |
| `/uroos` | [`uroos.tsx`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/routes/uroos.tsx) | Uroos calendar + featured/grid/timeline views |
| `/uroos/$id` | [`uroos_.$id.tsx`](file:///c:/Users/hp/Downloads/ziyarath/ziyarath-main/src/routes/uroos_.$id.tsx) | Uroos detail page (shows connected maqam link) |

---

## 🔄 Data Flow Diagram

```mermaid
flowchart TB
    subgraph "Static Seed Data"
        A["maqams.ts\n9 Maqams"] 
        B["uroos-pages.ts\n27 Uroos"]
        C["uroos.ts\nCalendar Data"]
    end
    
    subgraph "Server Layer"
        D["content-db.server.ts\nlistMaqams / listUroos\ngetMaqamById / getUroosById"]
        E["D1 Database\n(Production)"]
        F["In-Memory Store\n(Dev Fallback)"]
    end
    
    subgraph "API Layer"
        G["content.functions.ts\nServer Functions"]
    end
    
    subgraph "Public Routes"
        H["/maqam → Directory"]
        I["/maqam/:id → Detail"]
        J["/uroos → Calendar"]
        K["/uroos/:id → Detail"]
    end
    
    A --> F
    B --> F
    A --> E
    B --> E
    F --> D
    E --> D
    D --> G
    G --> H
    G --> I
    G --> J
    G --> K
    C --> J
```

---

## ⚠️ Issues Found

1. **Missing Maqam:** `madavoor` referenced by `madavoor-uroos` doesn't exist in `maqams.ts`
2. **Calendar → Page Linking:** The `uroos.ts` calendar uses `pageId` to link to `uroos-pages.ts` entries by ID. All 27 calendar entries have matching page entries.
3. **Region field discrepancy:** Maqam uses 4 regions (`kerala | india | middle-east | worldwide`), Uroos uses 3 regions (`kerala | india | worldwide`). Middle-east uroos entries don't exist.
