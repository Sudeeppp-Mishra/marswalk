# Technical Architecture — Astro-nah

```text
                  ASTRO-NAH
                      |
          +-----------+-----------+
          |                       |
       FRONTEND                BACKEND
          |                       |
    React + Vite              FastAPI
          |                       |
    React-Leaflet                 |
          |                Geospatial Engine
    Interactive Map               |
          |             +---------+---------+
          |             |         |         |
    Route Display     Rasterio  NumPy    Shapely
          |             |         |         |
          |             +---------+---------+
          |                       |
          |                 Terrain Analysis
          |                       |
          |                 A* Pathfinding
          |                       |
          +---------- REST API ---+
                      |
                GeoJSON / JSON
```

## Frontend Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS with custom Mars dark palette (`#101114`, `#191b20`, `#D97745`)
- **Mapping**: Leaflet + React-Leaflet
- **Icons**: Lucide React
- **Dev Proxy**: `/api` routed to `http://127.0.0.1:8000`

## Backend Stack
- **Framework**: FastAPI + Uvicorn
- **Geospatial Processing**: Rasterio, NumPy, GeoPandas (Phase 2+)
- **Pathfinding**: Grid-based A* cost optimization
- **Data Validation**: Pydantic v2 schemas

