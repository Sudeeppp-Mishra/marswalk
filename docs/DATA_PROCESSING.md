# Data Processing Workflow & Mathematical Formulations

This document describes the geospatial processing pipeline used in Astro-nah to convert raw NASA/USGS planetary rasters into actionable navigation metrics and traversability models.

---

## 1. Coordinate Reference Systems (CRS) & Datums

Mars geospatial datasets differ from terrestrial standards:
- **Ellipsoid**: Mars 2000 IAU sphere ($R_e = 3,396,190\text{ m}$).
- **Vertical Datum**: Mars Orbiter Laser Altimeter (MOLA) areoid (zero-elevation geopotential reference).
- **Projected CRS**: `ESRI:103885` — Mars 2000 Equidistant Cylindrical (Equirectangular) with standard parallel at $0^\circ$ and central meridian at $0^\circ$.
- **Ground Coordinates Transformation**:
  $$x = R_e \times \lambda_{\text{rad}}, \quad y = R_e \times \phi_{\text{rad}}$$
  $$\lambda_{\text{deg}} = \frac{x}{R_e} \times \frac{180}{\pi}, \quad \phi_{\text{deg}} = \frac{y}{R_e} \times \frac{180}{\pi}$$

---

## 2. Slope Calculation Formula

Slope gradients are computed from the 20 m/pixel Digital Terrain Model (DTM) using central finite differences:

$$\frac{\partial z}{\partial x} \approx \frac{z(r, c+1) - z(r, c-1)}{2 \cdot \Delta x}, \quad \Delta x = 20.0\text{ m}$$

$$\frac{\partial z}{\partial y} \approx \frac{z(r+1, c) - z(r-1, c)}{2 \cdot \Delta y}, \quad \Delta y = 20.0\text{ m}$$

The directional gradient magnitude is:
$$\|\nabla z\| = \sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}$$

The physical slope angle $\theta$ (in degrees) is derived as:
$$\theta = \arctan\left(\|\nabla z\|\right) \times \frac{180}{\pi}$$

---

## 3. Traversability Cost Function

The A* pathfinding algorithm evaluates the transition cost between adjacent grid cells $n_1 \rightarrow n_2$:

$$\Delta \text{Cost}(n_1, n_2) = d_{\text{step}} \times \left(1.0 + \text{Penalty}_{\text{slope}}(\theta_2)\right) + w_{\text{climb}} \times \max(0, z_2 - z_1)$$

Where:
- $d_{\text{step}} = 20.0\text{ m}$ (orthogonal) or $20.0\sqrt{2} \approx 28.28\text{ m}$ (diagonal).
- $\text{Penalty}_{\text{slope}}(\theta)$:
  - $\theta \le 10^\circ$: $0.05 \times \theta$ (nominal baseline resistance)
  - $10^\circ < \theta \le 20^\circ$: $0.5 + 0.15 \times (\theta - 10)^2$ (steep nonlinear penalty)
  - $\theta > 20^\circ$: $\infty$ (impassable cell, pruned from priority queue)
- $w_{\text{climb}} = 2.0$: Energy expenditure multiplier for positive elevation climb.

---

## 4. Hardware Optimization for 8 GB RAM Development

- **Raster Windowing**: Large rasters are never loaded as raw uncompressed float buffers in browser memory.
- **Precomputed Overlays**: Colorized overlays are generated offline in `data/processed/` using optimized 8-bit RGBA PNGs.
- **Tiled Streaming**: 6m CTX and 25cm HiRISE imagery are streamed via OGC WMTS REST tile pyramids (256x256 px) directly from NASA JPL Mars Trek.

