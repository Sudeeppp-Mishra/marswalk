# Astro-nah 🚀

> **Martian Surface Exploration and Autonomous Navigation Platform**  
> *NASA Space Apps Challenge 2026*  
> Primary Mission Target: **Jezero Crater Delta, Mars** ($18.38^\circ\text{N}, 77.58^\circ\text{E}$)  
> 🌐 **Live Deployment:** [https://astro-marswalk.vercel.app](https://astro-marswalk.vercel.app)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-astro--marswalk.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://astro-marswalk.vercel.app)
[![NASA Space Apps](https://img.shields.io/badge/NASA%20Space%20Apps-2026-D97745?style=for-the-badge)](https://www.spaceappschallenge.org/)
[![Target](https://img.shields.io/badge/Target-Jezero%20Crater%20Delta-38BDF8?style=for-the-badge)](https://mars.nasa.gov/mars2020/)

Astro-nah is a full-stack planetary surface exploration and navigation platform designed for the NASA Space Apps Challenge 2026. It transforms authentic NASA and USGS orbital datasets into an intelligent, slope-cost-aware navigation system for robotic rovers and future astronaut Extravehicular Activities (EVA) within Jezero Crater.

---

## 🌟 Core Features & Scientific Highlights

### 1. Multi-Layer High-Resolution Jezero Crater Cartography
- **MRO Context Camera (CTX) Visible Mosaic (6m/px)**: Authentic visible optical imagery served through NASA/JPL/USGS Mars Trek WMTS.
- **Topographic Elevation DEM (20m/px)**: Hypsometric color-ramped elevation model derived directly from the authentic USGS Jezero TRN CTX DTM mosaic (`-2,800 m` to `-2,100 m` relative to Mars datum).
- **Slope Hazard Map**: Continuous slope gradient classified by rover mobility limits:
  - **Nominal ($< 10^\circ$)**: Green — Safe for continuous autonomous driving.
  - **Caution ($10^\circ - 20^\circ$)**: Amber — Increased wheel slip; requires high-torque traversal.
  - **Severe ($> 20^\circ$)**: Crimson — Exceeds Mars 2020 Perseverance stability envelope; classified as impassable.
- **Global Martian Base**: Viking MDIM2.1 (232m/px) for planetary context.

### 2. HiRISE 25cm Ultra-HD Micro-Terrain Inspection Lens
- Extracts sub-meter optical windows directly from the authentic **9.1 GB MRO HiRISE 25cm GeoTIFF** (`85,600 × 85,952 px`).
- **Memory-Safe Windowed Reading**: Uses Rasterio bounds-windowing with 2%–98% percentile scientific contrast stretching without loading the full 9.1GB raster into RAM.
- **6 Curated Jezero Scientific Landmarks**:
  1. **Kodiak Butte Delta Remnant**: Stratigraphic Gilbert-type foreset/topset beds proving ancient lake depth.
  2. **Wildcat Ridge Clastic Outcrop**: Fine-grained mudstones where SHERLOC detected organic aromatics.
  3. **Belva Impact Crater Rim**: Natural 1km trench exposing 3D cross-sections of conglomerate megabreccia.
  4. **Three Forks Sample Cache Depot**: Boulder-free surface repository where 10 sample tubes were cached.
  5. **Neretva Vallis Inflow Gorge**: Fluvial breach canyon carved by catastrophic river flooding.
  6. **South Séítah Olivine Cumulate**: Coarse layered igneous cumulate bedrock.

### 3. Slope-Aware A* Surface Navigation Engine
- **8-Connected Grid Search**: Powered by NumPy arrays with Euclidean metric heuristic.
- **Cost Function**: Balances horizontal distance, exponential steep-slope resistance penalties, and uphill elevation changes.
- **Comprehensive Route Telemetry**:
  - Distance ($km$) and traverse time estimates.
  - Paired elevation metrics: Cumulative Ascent ($+m$) and Descent ($-m$).
  - Mean route slope and maximum slope encountered.
  - **A* vs. Direct Line Comparison**: Quantifies why intelligent pathfinding avoids impassable cliffs.
  - Mars 2020 Rover Clearance Verdict (e.g., *"Safe for Perseverance: Max slope under 20° limit"*).

### 4. Interactive Elevation Profile & Scrubbing
- Dynamic SVG elevation profile rendered at the bottom of the map.
- Crosshair scrubber synchronized between the map reticle and profile graph.
- Slope-colored route polyline on the map (Green $\le 8^\circ$, Amber $8^\circ–15^\circ$, Red $> 15^\circ$).

### 5. Level-of-Detail (LOD) Science & Milestones
- **USGS SIM 3464 Geological Formations**: Polygonal coverage of Neretva Canyon (`HNch`), Western Delta (`HNb`), Séítah Unit (`Ncf`), and Máaz Floor (`Hcf`) with full petrologic and age data.
- **Mars 2020 Perseverance Timeline**: Sols 0, 180, 420, 550, and 750 milestone markers. At regional zoom, rendered as compact glowing radar dots; at close zoom, expanded with staggered non-overlapping badges.
- **Floating Geology Legend**: Collapsible scientific legend that dynamically adjusts position when routes are active.

### 6. Mission Dispatch Dossier & Print-Ready Brief
- Generates an official aerospace mission dossier modal with complete coordinate lists, elevation deltas, slope gradients, and scientific disclosures.
- Includes `@media print` stylesheets for clean single-page PDF generation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Leaflet, React-Leaflet, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **Geospatial Processing** | Rasterio, NumPy, Pillow (PIL), Matplotlib, SciPy |
| **Coordinate Reference** | IAU Mars 2000 Equidistant Cylindrical ($R = 3,396,190\text{ m}$) |
| **Datasets** | USGS Astrogeology SIM 3464, MRO CTX Mosaic & TRN DTM, MRO HiRISE 25cm, Mars 2020 Mission Releases |

---

## 🚀 Running the Project

### 🌐 Live Web Application
Access the production deployment immediately without any local setup:  
👉 **[https://astro-marswalk.vercel.app](https://astro-marswalk.vercel.app)**

---

### Local Development Setup

#### Prerequisites
- Node.js 18+ and npm
- Python 3.10+

### 1. Backend Server
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health: `http://127.0.0.1:8000/api/health`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📂 Project Structure

```text
marswalk/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Common/        # Header, StatusPanel, BottomBar
│   │   │   ├── Map/           # MarsMap, HiRISEInspectorModal, MissionDossierModal,
│   │   │   │                  # RouteElevationProfileBar, GeologyLegendBar, MapLegendBar
│   │   │   └── Sidebar/       # Navigation tabs
│   │   ├── services/          # API client (Health, Datasets, Terrain, Route, HiRISE)
│   │   ├── utils/             # Audio SFX, GeoJSON / CSV exports
│   │   ├── styles/            # Tailwind CSS & print formatting
│   │   └── App.jsx            # Main app orchestrator & tab routing
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── algorithms/        # Slope-penalized A* pathfinder
│   │   ├── api/               # FastAPI route endpoints
│   │   ├── core/              # Mars CRS constants & path locators
│   │   ├── models/            # Pydantic schemas (RouteResponse, TerrainPoint, etc.)
│   │   ├── processing/        # 20m DTM elevation & slope engine
│   │   ├── services/          # HiRISE window extractor, USGS geology, datasets
│   │   └── main.py            # FastAPI entrypoint & CORS config
│   └── requirements.txt
├── data/                      # Scientific datasets (9.1GB HiRISE GeoTIFF & 20m DTM)
└── README.md
```

---

## 📜 Scientific Compliance & Honest Disclosures
- **Geological Boundaries**: Geological units are schematic representations derived after USGS Scientific Investigations Map 3464 (Sun & Stack, 2020).
- **Perseverance Rover Milestones**: Sol numbers, coordinates, and sample correlations are based on NASA Mars 2020 public science releases and mission updates.
- **Safety Envelope**: Astro-nah is a scientific challenge submission and prototype demonstration for the NASA Space Apps Challenge 2026. Sub-pixel micro-hazards (<20m in CTX DTM, <25cm in HiRISE) and dust mantling introduce local hazards requiring in-situ hazard avoidance cameras.
