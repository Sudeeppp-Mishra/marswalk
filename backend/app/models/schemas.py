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

class TerrainPointResponse(BaseModel):
    valid: bool
    lat: float
    lng: float
    elevation_m: Optional[float] = None
    slope_deg: Optional[float] = None
    risk_tier: Optional[str] = None
    crs: str = "ESRI:103885 (Equidistant Cylindrical Mars)"

class TerrainMetadataResponse(BaseModel):
    available: bool
    bounds: Dict[str, float]
    resolution_m: float
    min_elevation_m: float
    max_elevation_m: float
    mean_elevation_m: float


class RouteRequest(BaseModel):
    start: PointCoordinates
    destination: PointCoordinates
    max_slope_deg: Optional[float] = Field(default=20.0, description="Maximum traversable slope threshold in degrees")

class RouteResponse(BaseModel):
    status: str
    error: Optional[str] = None
    route: List[Dict[str, Any]]
    distance_meters: Optional[float] = None
    distance_km: Optional[float] = None
    estimated_difficulty: str = "unknown"
    elevation_gain_m: Optional[float] = None
    elevation_loss_m: Optional[float] = None
    mean_slope_deg: Optional[float] = None
    max_slope_deg: Optional[float] = None
    under_15_deg_pct: Optional[float] = None
    estimated_traverse_time_hours: Optional[float] = None
    direct_distance_km: Optional[float] = None
    direct_max_slope_deg: Optional[float] = None
    shortest_route: Optional[List[Dict[str, Any]]] = None
    shortest_distance_km: Optional[float] = None
    shortest_max_slope_deg: Optional[float] = None
    hazard_warning: Optional[str] = None
    assumptions: List[str] = Field(default_factory=list)

