from fastapi import APIRouter
from ..models.schemas import HealthResponse, DatasetsResponse, RouteRequest, RouteResponse
from ..services.dataset_service import get_registered_datasets
from ..core.config import PROJECT_NAME, TARGET_REGION, PROJECT_VERSION

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

