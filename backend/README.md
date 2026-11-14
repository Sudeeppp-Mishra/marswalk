# Astro-nah Surface Navigation Engine Backend

FastAPI geospatial processing and pathfinding backend for the Jezero Crater delta region.

## Capabilities
- Serves system health and dataset registry verification
- Inspects real planetary GeoTIFFs (MRO CTX Mosaic, CTX DEM, HiRISE)
- Calculates terrain slope gradients using metric cell resolution
- Executes A* traversal cost pathfinding over Mars DEM grids

## Setup & Running

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## API Documentation
Interactive OpenAPI (Swagger) documentation is available at:
`http://127.0.0.1:8000/docs`

