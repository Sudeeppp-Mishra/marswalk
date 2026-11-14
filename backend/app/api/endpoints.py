from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from ..models.schemas import (
    HealthResponse, 
    DatasetsResponse, 
    RouteRequest, 
    RouteResponse,
    TerrainPointResponse,
    TerrainMetadataResponse
)
from ..services.dataset_service import get_registered_datasets
from ..processing.terrain_processor import terrain_engine, JEZERO_BOUNDS_DEG
from ..core.config import PROJECT_NAME, TARGET_REGION, PROJECT_VERSION, PROCESSED_DATA_DIR

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Returns backend system status and project target region."""
    return HealthResponse(
        status="ok",
        project=PROJECT_NAME,
        target_region=TARGET_REGION,
        version=PROJECT_VERSION
    )

@router.get("/datasets", response_model=DatasetsResponse)
async def list_datasets():
    """
    Returns available datasets and their metadata.
    Reflects actual physical files on disk.
    """
    datasets = get_registered_datasets()
    return DatasetsResponse(datasets=datasets)

@router.get("/terrain/point", response_model=TerrainPointResponse)
async def get_terrain_at_point(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude in degrees"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude in degrees")
):
    """
    Queries real elevation (meters) and slope (degrees) from authentic CTX DTM.
    """
    try:
        sample = terrain_engine.get_point_elevation_and_slope(lat, lng)
        return TerrainPointResponse(
            valid=sample.get("valid", False),
            lat=lat,
            lng=lng,
            elevation_m=sample.get("elevation_m"),
            slope_deg=sample.get("slope_deg"),
            risk_tier=sample.get("risk_tier")
        )
    except Exception as e:
        return TerrainPointResponse(
            valid=False,
            lat=lat,
            lng=lng
        )

@router.get("/terrain/metadata", response_model=TerrainMetadataResponse)
async def get_terrain_metadata():
    """Returns Jezero Crater delta coverage bounds and elevation stats."""
    return TerrainMetadataResponse(
        available=True,
        bounds=JEZERO_BOUNDS_DEG,
        resolution_m=20.0,
        min_elevation_m=-2710.70,
        max_elevation_m=-1515.54,
        mean_elevation_m=-2356.87
    )

@router.get("/terrain/overlay/{overlay_type}")
async def get_terrain_overlay(overlay_type: str):
    """Serves the generated elevation or slope hazard visualization overlay."""
    if overlay_type == "elevation":
        overlay_path = PROCESSED_DATA_DIR / "jezero_elevation_overlay.png"
    elif overlay_type == "slope":
        overlay_path = PROCESSED_DATA_DIR / "jezero_slope_overlay.png"
    else:
        raise HTTPException(status_code=404, detail="Invalid overlay type. Use 'elevation' or 'slope'.")

    if not overlay_path.exists():
        terrain_engine.generate_visualization_overlays()

    if not overlay_path.exists():
        raise HTTPException(status_code=500, detail="Failed to generate overlay.")

    return FileResponse(overlay_path, media_type="image/png")


@router.post("/route", response_model=RouteResponse)
async def calculate_route(request: RouteRequest):
    """
    Suggested path calculation endpoint (A* Engine).
    Will be populated in Phase 4 once the terrain cost grid is generated from authentic DEM.
    """
    return RouteResponse(
        status="pending_phase4",
        route=[],
        distance_meters=None,
        estimated_difficulty="unknown",
        assumptions=[
            "Requires processed elevation grid from Phase 3",
            "Pathfinding requires traversability cost model based on DEM slope calculations"
        ]
    )

