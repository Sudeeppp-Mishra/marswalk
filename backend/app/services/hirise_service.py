import io
import math
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from PIL import Image

from ..core.config import find_file, MARS_RADIUS_EQUATORIAL_M

logger = logging.getLogger(__name__)

# Jezero Crater High-Priority Scientific Landmarks for 25cm HiRISE Inspection
JEZERO_LANDMARKS = [
    {
        "id": "kodiak_butte",
        "name": "Kodiak Butte Delta Remnant",
        "coords": [18.4231, 77.4125],
        "elevation_m": -2480.0,
        "feature_type": "Stratigraphic Remnant Mesa",
        "significance": "Isolated flat-topped butte south of the delta. Exhibits classic Gilbert-type delta bottomset, foreset, and topset beds that definitively established the ancient lake level.",
        "scientific_importance": "Critical proof of ancient Lake Jezero depth (~250m) and sustained fluvial inflow."
    },
    {
        "id": "wildcat_ridge",
        "name": "Wildcat Ridge Clastic Outcrop",
        "coords": [18.4395, 77.4120],
        "elevation_m": -2534.6,
        "feature_type": "Sedimentary Mudstone Facies",
        "significance": "Fine-grained clay-rich sedimentary rock formed in quiet muddy waters at the delta front. Ideal for preserving signs of ancient microbial life.",
        "scientific_importance": "SHERLOC UV Raman spectroscopy detected aromatic organic molecules in the 'Swift Run' core sample."
    },
    {
        "id": "belva_crater",
        "name": "Belva Impact Crater Rim",
        "coords": [18.4550, 77.3820],
        "elevation_m": -2410.0,
        "feature_type": "Post-Delta Impact Crater (~1 km dia)",
        "significance": "Impact crater excavated directly into the sedimentary fan, providing a natural geological trench exposing delta stratigraphy in 3D cross-section.",
        "scientific_importance": "Large steeply tilted conglomerate megabreccia blocks deposited by high-energy flood surges."
    },
    {
        "id": "three_forks_depot",
        "name": "Three Forks Sample Cache Depot",
        "coords": [18.4352, 77.4208],
        "elevation_m": -2565.1,
        "feature_type": "Mars Sample Return (MSR) Surface Cache",
        "significance": "Flat, boulder-free sandy delta apron chosen by NASA as the backup repository where 10 titanium sample tubes were safely deposited onto the surface.",
        "scientific_importance": "First sample depot ever assembled on another planet for future robotic retrieval."
    },
    {
        "id": "neretva_canyon",
        "name": "Neretva Vallis Inflow Gorge",
        "coords": [18.4720, 77.3350],
        "elevation_m": -2350.0,
        "feature_type": "Paleofluvial Breach Valley",
        "significance": "Deep canyon carved through the western rim of Jezero Crater by ancient river systems that filled Lake Jezero.",
        "scientific_importance": "Polymict boulder beds recording catastrophic breach discharges and upstream Martian highlands provenance."
    },
    {
        "id": "seitah_outcrop",
        "name": "South Séítah Olivine Cumulate",
        "coords": [18.4285, 77.4419],
        "elevation_m": -2562.4,
        "feature_type": "Layered Igneous Intrusive Basement",
        "significance": "Coarse-grained olivine-cumulate bedrock exposed between active ripple dunes, representing differentiated lava lake or subvolcanic sill.",
        "scientific_importance": "Provides vital radiometric dating benchmarks for early Mars crater chronology."
    }
]

def get_hirise_file_path() -> Optional[Path]:
    """Finds the authentic local HiRISE GeoTIFF if present in data/."""
    return find_file("*hirise*.tif") or find_file("*HIRISE*.tif")

def get_hirise_crop_png(lat: float, lng: float, radius_m: float = 150.0, output_size: int = 512) -> Optional[bytes]:
    """
    Extracts an ultra-crisp sub-meter inspection crop from the authentic 9.1GB HiRISE GeoTIFF.
    Performs memory-efficient windowed reading and percentile contrast enhancement.
    """
    hirise_path = get_hirise_file_path()
    if not hirise_path or not hirise_path.exists():
        return None

    try:
        with rasterio.open(hirise_path) as src:
            # Convert radius in meters to approximate degrees on Mars
            deg_per_meter = 1.0 / (MARS_RADIUS_EQUATORIAL_M * (math.pi / 180.0))
            delta_deg = radius_m * deg_per_meter

            b = src.bounds
            target_lat = lat
            target_lng = lng

            # If coordinate is outside HiRISE bounding box, fallback to primary delta center (Kodiak Butte)
            if not (b.bottom + delta_deg <= lat <= b.top - delta_deg and b.left + delta_deg <= lng <= b.right - delta_deg):
                target_lat, target_lng = 18.4231, 77.4125

            min_lon = target_lng - delta_deg
            max_lon = target_lng + delta_deg
            min_lat = target_lat - delta_deg
            max_lat = target_lat + delta_deg

            window = from_bounds(min_lon, min_lat, max_lon, max_lat, src.transform)
            data = src.read(1, window=window)

            # If read data has no valid pixels (e.g. black space on diagonal edge of orbital swath), fallback to Kodiak Butte
            if data.size == 0 or np.count_nonzero(data) < 100:
                kodiak_lat, kodiak_lng = 18.4231, 77.4125
                window = from_bounds(kodiak_lng - delta_deg, kodiak_lat - delta_deg, kodiak_lng + delta_deg, kodiak_lat + delta_deg, src.transform)
                data = src.read(1, window=window)

            if data.size == 0 or np.all(data == 0):
                return None

            # Scientific contrast enhancement (2% to 98% percentile stretch)
            valid_pixels = data[data > 0]
            if valid_pixels.size > 0:
                p2, p98 = np.percentile(valid_pixels, (2, 98))
                stretched = np.clip((data.astype(np.float32) - p2) / max(1.0, p98 - p2) * 255.0, 0, 255).astype(np.uint8)
            else:
                stretched = data.astype(np.uint8)

            img = Image.fromarray(stretched)
            img = img.resize((output_size, output_size), Image.Resampling.LANCZOS)

            buf = io.BytesIO()
            img.save(buf, format="PNG", optimize=True)
            return buf.getvalue()

    except Exception as e:
        logger.warning(f"HiRISE window extraction failed: {e}")
        return None

def get_hirise_landmarks() -> List[Dict[str, Any]]:
    """Returns curated Jezero Crater scientific landmarks for 25cm ultra-HD inspection."""
    return JEZERO_LANDMARKS

