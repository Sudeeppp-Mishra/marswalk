import os
from pathlib import Path

# Fix matplotlib cache dir warning
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

# Base directory paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
METADATA_DIR = DATA_DIR / "metadata"

PROJECT_NAME = "Astro-nah"
PROJECT_VERSION = "0.1.0"
TARGET_REGION = "Jezero Crater Delta, Mars"
MARS_RADIUS_EQUATORIAL_M = 3396190.0
MARS_RADIUS_POLAR_M = 3376200.0

def find_file(pattern: str) -> Path | None:
    """
    Searches both data/ and data/raw/ for a file matching pattern.
    Supports user dropping files in data/ or data/raw/.
    """
    search_dirs = [DATA_DIR, RAW_DATA_DIR]
    for d in search_dirs:
        if d.exists():
            matches = list(d.glob(pattern))
            if matches:
                # Return newest or largest match
                return matches[0]
    return None
