# AI Usage & NASA Space Apps Compliance Disclosure

In compliance with NASA Space Apps Challenge 2026 regulations regarding AI assistance and transparency:

- **AI Assistant**: Antigravity (Powered by Google DeepMind Gemini models)
- **Primary Developer**: Solo participant / Computer Engineering student
- **Development Environment**: macOS Apple Silicon M2, 8 GB Unified Memory

---

## Tasks Assisted by AI

1. **Architecture & Project Layout**:
   - Scaffolding the decoupled React (Vite) + FastAPI (Uvicorn) structure.
   - Configuring Tailwind CSS custom palette adhering to the dark Mars design guidelines (`#101114`, `#191b20`, `#D97745`).

2. **Geospatial Engineering & Mathematical Implementation**:
   - Writing the raster inspection utility (`inspect_rasters.py`) using `rasterio` to parse `ESRI:103885` Equidistant Cylindrical CRS parameters.
   - Formulating central-difference metric gradient equations for physical slope calculation:
     $$\text{Slope} = \arctan\left(\sqrt{(\partial z / \partial x)^2 + (\partial z / \partial y)^2}\right) \times \frac{180}{\pi}$$
   - Implementing the 8-connected A* pathfinding algorithm (`astar.py`) with slope penalties, uphill resistance weighting, and impassability thresholds (> 20°).

3. **Authentic Data Integration**:
   - Connecting to the NASA JPL Mars Trek OGC WMTS REST tile services for 6m CTX, 25cm HiRISE, and 232m Viking global base imagery.
   - Encoding authentic USGS Jezero geologic unit boundaries and Perseverance observation stops (Sols 0, 180, 420, 550, 750).

4. **Documentation**:
   - Drafting technical documentation, scientific limitations disclosures, and system architecture specifications.

---

## Human Review & Scientific Validation

- **No Synthetic Data**: All terrain elevations ($-2,710.70\text{ m}$ to $-1,515.54\text{ m}$), coordinates, and slope metrics were directly sampled from authentic USGS and NASA MRO products without fabrication.
- **Code & Logic Review**: Pathfinding cost weights, coordinate projection transforms, and React component state lifecycles were reviewed, tested, and validated by the primary developer.
- **Branding Compliance**: No NASA logos, flags, or mission identifiers are used as project branding or endorsement trademarks.
