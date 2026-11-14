import numpy as np
import rasterio
from pathlib import Path
from PIL import Image
import matplotlib.cm as cm
from ..core.config import RAW_DATA_DIR, PROCESSED_DATA_DIR, MARS_RADIUS_EQUATORIAL_M

DTM_FILENAME = "JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tif"
ORTHO_FILENAME = "JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tif"

# Jezero Delta Bounding Box in Degrees
JEZERO_BOUNDS_DEG = {
    "south": 18.2110274,
    "north": 18.7211945,
    "west": 77.1604655,
    "east": 77.6991776,
}

class TerrainProcessor:
    def __init__(self):
        self.dtm_path = RAW_DATA_DIR / DTM_FILENAME
        self.ortho_path = RAW_DATA_DIR / ORTHO_FILENAME
        self._dtm_dataset = None
        self._elevation = None
        self._slope = None
        self._nodata = None
        self._transform = None
        self._res = (20.0, 20.0)

    def load_dtm(self):
        """Loads the CTX DTM raster safely and computes slope."""
        if not self.dtm_path.exists():
            raise FileNotFoundError(f"DTM file not found at {self.dtm_path}")

        with rasterio.open(self.dtm_path) as src:
            self._dtm_dataset = src
            self._transform = src.transform
            self._res = src.res
            self._nodata = src.nodata
            self._elevation = src.read(1)

        # Replace NoData with NaN for scientific calculations
        if self._nodata is not None:
            self._elevation = np.where(self._elevation == self._nodata, np.nan, self._elevation)

        self._calculate_slope()
        return True

    def _calculate_slope(self):
        """
        Calculates terrain slope in degrees using central differences and metric pixel spacing.
        Formula: Slope = arctan(sqrt((dz/dx)^2 + (dz/dy)^2)) * 180 / pi
        """
        dx, dy = self._res[0], self._res[1]
        
        # Compute gradients along x and y
        dz_dy, dz_dx = np.gradient(self._elevation, dy, dx)
        
        # Gradient magnitude
        grad_mag = np.sqrt(dz_dx**2 + dz_dy**2)
        
        # Convert to degrees
        self._slope = np.degrees(np.arctan(grad_mag))

    def get_point_elevation_and_slope(self, lat: float, lng: float):
        """
        Samples elevation (meters) and slope (degrees) for a given Mars coordinate.
        Converts lat/lon (degrees) to the dataset's Equidistant Cylindrical CRS (meters).
        """
        if self._elevation is None:
            self.load_dtm()

        # Project lat/lon to Equidistant Cylindrical (ESRI:103885)
        # x = R * lon_rad, y = R * lat_rad
        r = MARS_RADIUS_EQUATORIAL_M
        x = r * np.radians(lng)
        y = r * np.radians(lat)

        # Invert affine transform to get row and col
        inv_transform = ~self._transform
        col, row = inv_transform * (x, y)
        col, row = int(round(col)), int(round(row))

        h, w = self._elevation.shape
        if 0 <= row < h and 0 <= col < w:
            elev = float(self._elevation[row, col])
            slope = float(self._slope[row, col])
            if np.isnan(elev):
                return {"valid": False, "elevation_m": None, "slope_deg": None}
            return {
                "valid": True,
                "elevation_m": round(elev, 2),
                "slope_deg": round(slope, 2),
                "risk_tier": "Low" if slope <= 10 else ("Moderate" if slope <= 20 else "High/Impassable")
            }
        return {"valid": False, "elevation_m": None, "slope_deg": None}

    def generate_visualization_overlays(self):
        """
        Generates colorized PNG overlays for elevation and slope to display in Leaflet.
        Saves to data/processed/.
        """
        if self._elevation is None:
            self.load_dtm()

        PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Elevation Color Overlay (Turbo colormap)
        valid_elev = self._elevation[~np.isnan(self._elevation)]
        vmin, vmax = np.percentile(valid_elev, 1), np.percentile(valid_elev, 99)
        norm_elev = np.clip((self._elevation - vmin) / (vmax - vmin), 0, 1)
        
        elev_rgba = cm.turbo(norm_elev)
        elev_rgba[np.isnan(self._elevation)] = [0, 0, 0, 0] # transparent
        elev_rgba[:, :, 3] = np.where(np.isnan(self._elevation), 0, 0.75) # 75% opacity
        
        elev_img = Image.fromarray((elev_rgba * 255).astype(np.uint8))
        elev_out = PROCESSED_DATA_DIR / "jezero_elevation_overlay.png"
        elev_img.save(elev_out, "PNG", optimize=True)

        # 2. Slope Hazard Color Overlay (Viridis / RdYlGn inverted)
        # 0-10 deg: Green (safe), 10-20 deg: Yellow (caution), >20 deg: Red (hazard)
        norm_slope = np.clip(self._slope / 30.0, 0, 1) # 0 to 30 deg scale
        slope_rgba = cm.magma(norm_slope)
        slope_rgba[np.isnan(self._slope)] = [0, 0, 0, 0]
        slope_rgba[:, :, 3] = np.where(np.isnan(self._slope), 0, 0.75)
        
        slope_img = Image.fromarray((slope_rgba * 255).astype(np.uint8))
        slope_out = PROCESSED_DATA_DIR / "jezero_slope_overlay.png"
        slope_img.save(slope_out, "PNG", optimize=True)

        return {
            "elevation_overlay": str(elev_out),
            "slope_overlay": str(slope_out),
            "bounds": JEZERO_BOUNDS_DEG
        }

terrain_engine = TerrainProcessor()

