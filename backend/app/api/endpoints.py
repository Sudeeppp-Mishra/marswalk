from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import FileResponse
import logging
from ..models.schemas import (
    HealthResponse, 
    DatasetsResponse, 
    RouteRequest, 
    RouteResponse,
    TerrainPointResponse,
    TerrainMetadataResponse
)
from ..services.dataset_service import get_registered_datasets
from ..services.geology_service import get_geology_data
from ..services.hirise_service import get_hirise_crop_png, get_hirise_landmarks, get_hirise_file_path
from ..processing.terrain_processor import terrain_engine, JEZERO_BOUNDS_DEG
from ..core.config import PROJECT_NAME, TARGET_REGION, PROJECT_VERSION, PROCESSED_DATA_DIR

logger = logging.getLogger(__name__)
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
        logger.warning(f"Terrain point query failed at ({lat}, {lng}): {e}")
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

@router.get("/science/geology")
async def get_planetary_geology():
    """
    Returns authentic USGS geological units and Perseverance observation stops.
    Based on USGS Jezero Geologic Mapping Program (SIM 3464).
    """
    return get_geology_data()

@router.get("/terrain/overlay/{overlay_type}")
async def get_terrain_overlay(overlay_type: str):
    """Serves the generated elevation, slope hazard, or local CTX visualization overlay."""
    if overlay_type == "elevation":
        overlay_path = PROCESSED_DATA_DIR / "jezero_elevation_overlay.png"
    elif overlay_type == "slope":
        overlay_path = PROCESSED_DATA_DIR / "jezero_slope_overlay.png"
    elif overlay_type == "ctx":
        overlay_path = PROCESSED_DATA_DIR / "jezero_ctx_local_overlay.png"
        if not overlay_path.exists():
            terrain_engine.generate_ctx_overlay()
    else:
        raise HTTPException(status_code=404, detail="Invalid overlay type. Use 'ctx', 'elevation', or 'slope'.")

    if not overlay_path.exists():
        try:
            terrain_engine.generate_visualization_overlays()
        except Exception as e:
            logger.warning(f"Overlay generation failed: {e}")

    if not overlay_path.exists():
        raise HTTPException(status_code=404, detail=f"Overlay '{overlay_type}' not available.")

    return FileResponse(overlay_path, media_type="image/png")


@router.get("/terrain/hirise/crop")
async def get_hirise_crop(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude in degrees"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude in degrees"),
    radius_m: float = Query(150.0, ge=20.0, le=1000.0, description="Inspection aperture radius in ground meters"),
    size: int = Query(512, ge=128, le=1024, description="Output pixel resolution")
):
    """
    Serves authentic 25cm/pixel ultra-HD ground crops from the local 9.1GB HiRISE GeoTIFF.
    Performs memory-safe sub-window extraction with percentile contrast stretching.
    """
    crop_bytes = get_hirise_crop_png(lat=lat, lng=lng, radius_m=radius_m, output_size=size)
    if not crop_bytes:
        raise HTTPException(status_code=404, detail="Coordinates outside HiRISE coverage or file unavailable.")

    return Response(content=crop_bytes, media_type="image/png")


@router.get("/terrain/hirise/landmarks")
async def get_hirise_landmarks_endpoint():
    """Returns curated Jezero Crater scientific landmarks for 25cm ultra-HD inspection."""
    hirise_path = get_hirise_file_path()
    return {
        "available": hirise_path is not None and hirise_path.exists(),
        "file_name": hirise_path.name if hirise_path else None,
        "landmarks": get_hirise_landmarks()
    }


@router.post("/route", response_model=RouteResponse)
async def calculate_route(request: RouteRequest):
    """
    Suggested path calculation endpoint (A* Engine).
    Runs cost-aware pathfinding over authentic 20m CTX DTM & slope grid.
    """
    max_slope = request.max_slope_deg if request.max_slope_deg is not None else 20.0
    result = terrain_engine.calculate_route(
        start_lat=request.start.lat,
        start_lng=request.start.lng,
        dest_lat=request.destination.lat,
        dest_lng=request.destination.lng,
        max_slope_deg=max_slope,
        water_level=request.water_level,
        avoid_water=request.avoid_water or False
    )

    return RouteResponse(
        status=result.get("status", "failed"),
        error=result.get("error"),
        route=result.get("route", []),
        distance_meters=result.get("distance_meters"),
        distance_km=result.get("distance_km"),
        estimated_difficulty=result.get("estimated_difficulty", "unknown"),
        elevation_gain_m=result.get("elevation_gain_m"),
        elevation_loss_m=result.get("elevation_loss_m"),
        mean_slope_deg=result.get("mean_slope_deg"),
        max_slope_deg=result.get("max_slope_deg"),
        under_15_deg_pct=result.get("under_15_deg_pct"),
        estimated_traverse_time_hours=result.get("estimated_traverse_time_hours"),
        direct_distance_km=result.get("direct_distance_km"),
        direct_max_slope_deg=result.get("direct_max_slope_deg"),
        hazard_warning=result.get("hazard_warning"),
        assumptions=result.get("assumptions", [])
    )

