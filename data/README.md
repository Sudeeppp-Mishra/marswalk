# Data Directory Structure — Astro-nah

This directory houses planetary datasets from NASA, USGS, and JPL Mars Trek for the Jezero Crater delta region.

```
data/
├── raw/         <- Original GeoTIFF / orthomosaic downloads (CTX, DEM, HiRISE)
├── processed/   <- Clipped tiles, slope maps, and precomputed cost grids
└── metadata/    <- Product metadata, CRS documentation, and bounding coordinates
```

## Challenge Resource Compliance
Datasets used in Astro-nah adhere strictly to the NASA Space Apps Challenge 2026 Resource List:
- **JPL Mars Trek**: Planetary GIS data discovery and regional CTX imagery
- **USGS Planetary Geologic Mapping Program**: Jezero Crater delta geological context
- **Mars Perseverance Raw Images Gallery**: Rover surface context and observation points

> **Note**: Raw raster datasets (*.tif, *.jp2, *.img) are excluded from version control via `.gitignore` to prevent repository bloat and maintain compliance with memory constraints on 8 GB RAM development machines.

