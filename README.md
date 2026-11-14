# Astro-nah 🚀

> **Martian Surface Exploration and Navigation Platform**  
> *NASA Space Apps Challenge 2026*  
> Target Region: **Jezero Crater Delta, Mars** ($18.38^\circ\text{ N}, 77.58^\circ\text{ E}$)

Astro-nah is an interactive surface exploration and navigation platform designed to transform authentic NASA and USGS planetary datasets into an intelligent, cost-aware navigation experience for astronauts exploring the Martian surface.

---

## 🌟 Key Capabilities

- **Interactive Multi-Layer Jezero Crater Map**:
  - **MRO Context Camera (CTX) Mosaic (6m/px)**: Authentic visible surface imagery via JPL Mars Trek.
  - **HiRISE Controlled Mosaic (25cm/px)**: Ultra-high-resolution sub-meter boulder and delta layer inspection.
  - **Topographic Elevation DEM (20m/px)**: Hypsometric color overlay from authentic USGS CTX DTM.
  - **Slope Hazard Map**: Derived metric gradient classification (0–10° green/safe, 10–20° caution, >20° impassable hazard).
  - **Viking MDIM21 Global Base (232m/px)**: Global Martian context tiles.
- **Real-Time Terrain Telemetry**: Live cursor tracking sampling exact elevation in meters and slope in degrees directly from the 20m DTM.
- **A\* Surface Navigation Engine**:
  - Point-and-click Origin & Destination waypoint placement.
  - Multi-factor cost optimization balancing horizontal distance, terrain slope penalties, and uphill climb resistance.
  - Automatically avoids impassable terrain (slopes $> 20^\circ$).
  - Mission Presets: *Landing Site to Kodiak Butte* and *Delta Scarp Traverse*.
- **USGS Geological Formations**:
  - Western Delta Deposit (`HNb`), Séítah Formation (`Ncf`), Máaz Basaltic Floor (`Hcf`), and Neretva Vallis (`HNch`).
- **Mars 2020 Perseverance Rover Ground-Truth**:
  - Observation stops from Sol 0 through Sol 750 (correlating cored rock samples with PIXL, SHERLOC, and Mastcam-Z data).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet, React-Leaflet, Lucide React
- **Backend**: Python 3.15, FastAPI, Uvicorn, Pydantic v2
- **Geospatial Processing**: Rasterio, NumPy, Pillow, Matplotlib, SciPy
- **Coordinate Reference System**: `ESRI:103885` (Mars 2000 Equidistant Cylindrical, $R = 3,396,190\text{ m}$)
- **Pathfinding**: Grid-based 8-connected A* search with metric Euclidean heuristic

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### 2. Backend Setup
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API Health Endpoint: `http://127.0.0.1:8000/api/health`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📂 Project Directory Structure

```text
marswalk/
├── frontend/             # React 18 + Vite + Tailwind interface
│   ├── src/
│   │   ├── components/
│   │   │   ├── Common/   # Header, StatusPanel, BottomBar
│   │   │   ├── Map/      # MarsMap.jsx (Leaflet + Multi-Layer HUD)
│   │   │   └── Sidebar/  # Navigation.jsx
│   │   ├── services/     # API client (Health, Datasets, Terrain, Route)
│   │   ├── styles/       # Tailwind & custom Leaflet dark styling
│   │   └── App.jsx       # Layout orchestrator and module views
│   ├── package.json
│   └── vite.config.js
├── backend/              # FastAPI geospatial engine
│   ├── app/
│   │   ├── api/          # REST endpoints (/health, /datasets, /terrain, /route, /science)
│   │   ├── core/         # Mars radii and dataset configuration
│   │   ├── services/     # Dataset registry & USGS geology definitions
│   │   ├── processing/   # Slope calculation & overlay precomputation
│   │   ├── algorithms/   # A* pathfinding engine
│   │   ├── models/       # Pydantic v2 schemas
│   │   └── main.py       # FastAPI application
│   ├── requirements.txt
│   └── README.md
├── data/
│   ├── raw/              # Authentic NASA / USGS GeoTIFFs (gitignored)
│   ├── processed/        # Precomputed elevation & slope PNG overlays
│   └── metadata/
├── docs/
│   ├── DATA_SOURCES.md
│   ├── DATA_PROCESSING.md
│   ├── ARCHITECTURE.md
│   ├── SCIENTIFIC_LIMITATIONS.md
│   └── AI_USAGE.md
└── README.md
```

---

## 📜 Scientific Compliance & Limitations
Astro-nah is a scientific prototype and research demonstration for the NASA Space Apps Challenge 2026. It is not an officially certified astronaut life-support or safety clearance system. See [SCIENTIFIC_LIMITATIONS.md](docs/SCIENTIFIC_LIMITATIONS.md) for detailed disclosures on orbital sensor resolution and terrain uncertainty.
