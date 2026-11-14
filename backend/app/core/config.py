from pathlib import Path
from pydantic import BaseModel

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

