# Astro-nah 🚀

> **Martian Surface Exploration and Navigation Platform**  
> *NASA Space Apps Challenge 2026*  
> Target Region: **Jezero Crater Delta, Mars** (18.38° N, 77.58° E)

Astro-nah is an interactive surface exploration and navigation prototype designed to transform authentic NASA and USGS planetary datasets into an intelligent navigation experience for astronauts exploring the Martian surface.

---

## 🛰️ Core Features

- **Interactive Jezero Crater Map**: Regional Context Camera (CTX) base imagery with waypoint selection.
- **Topographic & Slope Modeling**: Derived slope analysis from authentic Mars Digital Elevation Models (DEMs).
- **Hazard Classification**: Slope-informed difficulty zones (low risk, moderate incline, impassable slopes > 20°).
- **A* Surface Pathfinding**: Multi-factor cost-based route planning optimizing distance, slope resistance, and hazard avoidance.
- **Scientific Context Integration**: Geologic formations (Western Delta, Séítah, Máaz) from USGS planetary geologic maps.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet, React-Leaflet, Lucide React
- **Backend**: Python 3, FastAPI, Uvicorn, Pydantic v2
- **Geospatial (Phase 2+)**: Rasterio, NumPy, GeoPandas, Shapely
- **Pathfinding**: A* grid search algorithm

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend health check: `http://127.0.0.1:8000/api/health`  
Interactive API docs: `http://127.0.0.1:8000/docs`

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
├── frontend/             # React + Vite + Tailwind interface
│   ├── src/
│   │   ├── components/   # Map, Navigation, StatusPanel, BottomBar
│   │   ├── services/     # Backend API integration
│   │   ├── styles/       # Tailwind & custom Leaflet styling
│   │   └── App.jsx       # Main layout & module router
│   ├── package.json
│   └── vite.config.js
├── backend/              # FastAPI geospatial engine
│   ├── app/
│   │   ├── api/          # REST endpoints (/api/health, /api/datasets, /api/route)
│   │   ├── core/         # Settings & Mars constants
│   │   ├── services/     # Dataset registry & verification
│   │   ├── models/       # Pydantic schemas
│   │   └── main.py       # FastAPI application
│   ├── requirements.txt
│   └── README.md
├── data/
│   ├── raw/              # NASA / USGS GeoTIFFs (gitignored)
│   ├── processed/        # Clipped tiles and cost grids
│   └── metadata/         # CRS and dataset bounding boxes
├── docs/                 # System architecture, limitations, & AI usage logs
└── README.md
```

---

## 📜 Scientific Compliance & Limitations
Astro-nah is a scientific prototype for research and competition demonstration. It does not certify astronaut safety or rover mechanical clearance. See [SCIENTIFIC_LIMITATIONS.md](file:///Users/sudeepdemishra/Documents/Git-GitHub/marswalk/docs/SCIENTIFIC_LIMITATIONS.md) for detailed disclosures on orbital sensor resolution and terrain uncertainty.

