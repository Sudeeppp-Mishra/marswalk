# NASA Planetary Data Sources

Astro-nah uses authentic NASA and USGS planetary datasets for the Jezero Crater delta region. Fictional terrain measurements and simulated synthetic values are strictly avoided.

## 1. MRO CTX Orthomosaic (Context Camera)
- **Instrument**: Context Camera (CTX), Mars Reconnaissance Orbiter
- **Source**: JPL Mars Trek (`JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0`)
- **Resolution**: ~6 meters / pixel
- **Product Type**: Orthorectified visible imagery mosaic
- **Purpose**: Base planetary surface visualization and regional exploration context
- **Note**: Orthomosaics provide surface albedo/imagery, NOT elevation.

## 2. CTX Jezero DEM (Digital Elevation Model)
- **Instrument**: CTX Stereo pairs processed by USGS Astrogeology
- **Resolution**: ~20 meters / pixel
- **Format**: GeoTIFF (32-bit floating point elevation relative to Mars datum)
- **Purpose**: Elevation modeling, slope angle derivation, and terrain hazard assessment
- **Status**: Candidate acquisition in progress for Phase 2–3.

## 3. MRO HiRISE Orthomosaic (Targeted Sample)
- **Instrument**: High Resolution Imaging Science Experiment (HiRISE), MRO
- **Product ID**: `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_lats0_lon0_first_dd.tif`
- **Resolution**: 25 cm / pixel
- **Format**: GeoTIFF
- **Purpose**: High-resolution local inspection of scientific interest sites
- **Memory Constraint Note**: Clipped to local window to accommodate 8 GB RAM limits.

## 4. USGS Planetary Geologic Mapping
- **Resource**: USGS-NASA Planetary Geologic Mapping Program
- **Purpose**: Geologic units identification (Western Delta, Séítah, Máaz formations)

