from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    project: str = "Astro-nah"
    target_region: str = "Jezero Crater Delta, Mars"
    version: str = "0.1.0"

class DatasetInfo(BaseModel):
    id: str
    name: str
    type: str
    available: bool
    file_path: Optional[str] = None
    file_size_bytes: Optional[int] = None
    crs: Optional[str] = None
    resolution_m: Optional[float] = None
    notes: Optional[str] = None

class DatasetsResponse(BaseModel):
    datasets: List[DatasetInfo]

class PointCoordinates(BaseModel):
    lat: float
    lng: float

class RouteRequest(BaseModel):
    start: PointCoordinates
    destination: PointCoordinates
    max_slope_deg: Optional[float] = Field(default=20.0, description="Maximum traversable slope threshold in degrees")

class RouteResponse(BaseModel):
    status: str
    route: List[Dict[str, float]]
    distance_meters: Optional[float] = None
    estimated_difficulty: str = "unknown"
    assumptions: List[str] = Field(default_factory=list)

