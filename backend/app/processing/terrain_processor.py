import os
import numpy as np
import rasterio
from pathlib import Path
from PIL import Image
import matplotlib.cm as cm
from ..core.config import DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, MARS_RADIUS_EQUATORIAL_M, find_file
from ..algorithms.astar import AStarPlanner

# Jezero Delta Bounding Box in Degrees
JEZERO_BOUNDS_DEG = {
    "south": 18.2110274,
    "north": 18.7211945,
    "west": 77.1604655,
    "east": 77.6991776,
}

class TerrainProcessor:
    def __init__(self):
        self._dtm_dataset = None
        self._elevation = None
        self._slope = None
        self._nodata = None
        self._transform = None
        self._res = (20.0, 20.0)

    def _resolve_dtm_path(self) -> Path:
        p = find_file("*DTM*.tif") or find_file("*dtm*.tif") or find_file("*DEM*.tif") or find_file("*dem*.tif")
        if not p or not p.exists():
            raise FileNotFoundError("DTM elevation file not found in data/ or data/raw/")
        return p

    def _resolve_ctx_path(self) -> Path | None:
        return find_file("*ctx*ortho*.tif") or find_file("*CTX*ortho*.tif") or find_file("*ctx*.tif")

    def _resolve_hirise_path(self) -> Path | None:
        return find_file("*hirise*.tif") or find_file("*HIRISE*.tif") or find_file("*hirise*.jp2")

    def load_dtm(self):
        """Loads the CTX DTM raster safely and computes slope."""
        dtm_path = self._resolve_dtm_path()

        with rasterio.open(dtm_path) as src:
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

        r = MARS_RADIUS_EQUATORIAL_M
        x = r * np.radians(lng)
        y = r * np.radians(lat)

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

    def generate_ctx_overlay(self) -> Path | None:
        """
        Generates an optimized local 8-bit grayscale PNG overlay directly from
        the user's downloaded CTX GeoTIFF file.
        """
        ctx_file = self._resolve_ctx_path()
        if not ctx_file or not ctx_file.exists():
            return None

        out_path = PROCESSED_DATA_DIR / "jezero_ctx_local_overlay.png"
        if out_path.exists():
            return out_path

        PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
        with rasterio.open(ctx_file) as src:
            # Resample to ~1700x1600 for instant, smooth browser rendering
            out_shape = (src.height // 3, src.width // 3)
            data = src.read(1, out_shape=out_shape, resampling=rasterio.enums.Resampling.bilinear)
            
            # Contrast stretching for clear crater/ridge visibility
            valid = data[data > 0]
            if len(valid) > 0:
                p2, p98 = np.percentile(valid, 2), np.percentile(valid, 98)
                stretched = np.clip((data.astype(np.float32) - p2) / max(1.0, (p98 - p2)) * 255.0, 0, 255).astype(np.uint8)
            else:
                stretched = data

            img = Image.fromarray(stretched)
            img.save(out_path, "PNG", optimize=True)

        return out_path

    def generate_visualization_overlays(self):
        """
        Generates colorized PNG overlays for elevation and slope to display in Leaflet.
        Saves to data/processed/.
        """
        if self._elevation is None:
            self.load_dtm()

        PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Elevation Color Overlay (Turbo colormap)
        elev_out = PROCESSED_DATA_DIR / "jezero_elevation_overlay.png"
        if not elev_out.exists():
            valid_elev = self._elevation[~np.isnan(self._elevation)]
            vmin, vmax = np.percentile(valid_elev, 1), np.percentile(valid_elev, 99)
            norm_elev = np.clip((self._elevation - vmin) / (vmax - vmin), 0, 1)
            
            elev_rgba = cm.turbo(norm_elev)
            elev_rgba[np.isnan(self._elevation)] = [0, 0, 0, 0]
            elev_rgba[:, :, 3] = np.where(np.isnan(self._elevation), 0, 0.75)
            
            elev_img = Image.fromarray((elev_rgba * 255).astype(np.uint8))
            elev_img.save(elev_out, "PNG", optimize=True)

        # 2. Slope Hazard Color Overlay (Magma)
        slope_out = PROCESSED_DATA_DIR / "jezero_slope_overlay.png"
        if not slope_out.exists():
            norm_slope = np.clip(self._slope / 30.0, 0, 1)
            slope_rgba = cm.magma(norm_slope)
            slope_rgba[np.isnan(self._slope)] = [0, 0, 0, 0]
            slope_rgba[:, :, 3] = np.where(np.isnan(self._slope), 0, 0.75)
            
            slope_img = Image.fromarray((slope_rgba * 255).astype(np.uint8))
            slope_img.save(slope_out, "PNG", optimize=True)

        # 3. Local CTX overlay
        self.generate_ctx_overlay()

        return {
            "elevation_overlay": str(elev_out),
            "slope_overlay": str(slope_out),
            "bounds": JEZERO_BOUNDS_DEG
        }

    def calculate_route(
        self,
        start_lat: float,
        start_lng: float,
        dest_lat: float,
        dest_lng: float,
        max_slope_deg: float = 20.0
    ) -> dict:
        """
        Calculates suggested path between start and destination coordinates.
        Returns GeoJSON-compatible coordinates sequence and terrain statistics.
        """
        if self._elevation is None:
            self.load_dtm()

        r = MARS_RADIUS_EQUATORIAL_M
        inv_transform = ~self._transform

        # Convert start coords to grid (row, col)
        start_x = r * np.radians(start_lng)
        start_y = r * np.radians(start_lat)
        sc, sr = inv_transform * (start_x, start_y)
        start_rc = (int(round(sr)), int(round(sc)))

        # Convert dest coords to grid (row, col)
        dest_x = r * np.radians(dest_lng)
        dest_y = r * np.radians(dest_lat)
        dc, dr = inv_transform * (dest_x, dest_y)
        dest_rc = (int(round(dr)), int(round(dc)))

        # Initialize A* planner
        planner = AStarPlanner(
            elevation_grid=self._elevation,
            slope_grid=self._slope,
            res_meters=self._res[0],
            max_slope_deg=max_slope_deg
        )

        result = planner.find_path(start_rc, dest_rc)
        if "error" in result:
            return {
                "status": "failed",
                "error": result["error"],
                "route": [],
                "distance_meters": None,
                "assumptions": [
                    f"Slope threshold: {max_slope_deg}°",
                    "Path blocked by steep terrain hazards (> 20°) or coordinates outside DTM"
                ]
            }

        path_rc = result.pop("path_rc")
        coordinates = []

        for row, col in path_rc:
            x, y = self._transform * (col, row)
            lon = float(np.degrees(x / r))
            lat = float(np.degrees(y / r))
            elev = float(self._elevation[row, col])
            slope = float(self._slope[row, col])

            coordinates.append({
                "lat": round(lat, 5),
                "lng": round(lon, 5),
                "elevation_m": round(elev, 1),
                "slope_deg": round(slope, 1)
            })

        return {
            "status": "success",
            "route": coordinates,
            "metrics": result,
            "distance_meters": result["distance_meters"],
            "distance_km": result["distance_km"],
            "estimated_difficulty": result["estimated_difficulty"],
            "elevation_gain_m": result["elevation_gain_m"],
            "elevation_loss_m": result["elevation_loss_m"],
            "max_slope_deg": result["max_slope_deg"],
            "assumptions": result["assumptions"]
        }

terrain_engine = TerrainProcessor()
