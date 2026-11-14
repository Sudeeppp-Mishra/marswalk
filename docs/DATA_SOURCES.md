# Authentic NASA & USGS Planetary Data Sources

Astro-nah uses authentic NASA, USGS, and JPL planetary datasets for the Jezero Crater delta region. Fictional terrain measurements and synthetic values are strictly prohibited.

---

## 1. MRO CTX Orthomosaic (Context Camera)
- **Product ID**: `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tif`
- **Instrument**: Context Camera (CTX), Mars Reconnaissance Orbiter
- **Source**: NASA JPL Mars Trek / USGS Mars 2020 TRN Pipeline
- **Resolution**: **6.0 meters / pixel** ($5,322 \times 5,040$ pixels, ~35 MB)
- **CRS**: `ESRI:103885` (Mars 2000 Equidistant Cylindrical)
- **Coverage**: Longitude 77.1604° E to 77.6991° E, Latitude 18.2110° N to 18.7212° N
- **Usage**: Base planetary imagery in Leaflet via Mars Trek OGC WMTS REST tile service.

---

## 2. USGS Jezero CTX Digital Terrain Model (DTM)
- **Product ID**: `JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tif`
- **Instrument**: CTX Stereo pairs processed by USGS Astrogeology (Fergason et al.)
- **Resolution**: **20.0 meters / pixel** ($1,596 \times 1,512$ pixels, ~9.2 MB)
- **Data Type**: 32-bit floating point elevation relative to Mars MOLA areoid datum
- **Elevation Range**: $-2,710.70\text{ m}$ to $-1,515.54\text{ m}$ (Mean: $-2,356.87\text{ m}$)
- **Usage**: Derives metric slope grids, hazard classification overlays, real-time elevation point sampling, and A* traversal costs.

---

## 3. MRO HiRISE Controlled Orthomosaic (Ultra-HD Layer)
- **Product ID**: `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd`
- **Instrument**: High Resolution Imaging Science Experiment (HiRISE), MRO
- **Resolution**: **25 cm / pixel**
- **Coverage**: Longitude 77.2229° E to 77.5840° E, Latitude 18.3068° N to 18.6693° N
- **Usage**: High-resolution zoom-in layer streamed via WMTS tiles for sub-meter boulder and sedimentary layering inspection without consuming local memory.

---

## 4. USGS Planetary Geologic Mapping Program
- **Reference**: Sun & Stack (2020) / USGS Scientific Investigations Map 3464
- **Units Represented**:
  - **Western Delta Deposit (HNb)**: Sedimentary sandstones and clays
  - **Séítah Formation (Ncf)**: Olivine-cumulate igneous basement
  - **Máaz Formation (Hcf)**: Basaltic crater floor unit
  - **Neretva Vallis (HNch)**: Fluvial breach valley
- **Usage**: Geologic polygons and astrobiological context on the interactive map.

---

## 5. Mars 2020 Perseverance Rover Observations
- **Source**: NASA Planetary Data System (PDS) & Mars 2020 Raw Image Gallery
- **Waypoints**: Sol 0 (Landing), Sol 180 (Séítah), Sol 420 (Three Forks), Sol 550 (Wildcat Ridge), Sol 750 (Tenby)
- **Usage**: Ground-truth observation stops correlated with rock samples and rover instruments (PIXL, SHERLOC, Mastcam-Z).
