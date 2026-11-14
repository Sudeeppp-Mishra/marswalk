# Scientific Assumptions & Limitations

Astro-nah is a scientific prototype and research demonstration developed for the NASA Space Apps Challenge 2026. It is not a certified astronaut safety or mobility clearance system.

## 1. Orbital Resolution vs Ground Truth
- CTX (~6m/pixel) and CTX DEM (~20m/pixel) do not resolve sub-pixel surface hazards such as metric boulders, sand traps, or fine-scale regolith instability.
- Even 25 cm/pixel HiRISE imagery cannot detect subsurface hazards or low-bearing-strength dust pockets.

## 2. Slope Calculation
- Slope gradients are derived from DEM cell differences:
  $$\text{Slope} = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right)$$
- Micro-topography under the 20m pixel baseline may have steeper or shallower local faces than the averaged cell gradient.

## 3. Coordinate Systems & Geoids
- Mars planetary coordinates utilize the IAU 2000 Mars sphere/ellipsoid (equatorial radius $R_e \approx 3,396,190\text{ m}$).
- Elevations are reported relative to the Mars MOLA areoid datum (zero elevation reference surface).
- Direct application of Earth EPSG:4326 without proper Mars sphere parameters would distort distance metrics.

## 4. Path Traversal Feasibility
- Routes suggested by the A* engine are mathematical minimum-cost paths based on slope and distance. They do not constitute guaranteed navigable paths for human crew or rovers.

