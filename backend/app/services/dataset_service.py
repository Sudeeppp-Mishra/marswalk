import os
from pathlib import Path
from typing import List
from ..core.config import RAW_DATA_DIR, PROCESSED_DATA_DIR
from ..models.schemas import DatasetInfo

def get_registered_datasets() -> List[DatasetInfo]:
    """
    Inspects data directories for known planetary datasets.
    Never fabricates existence: strictly checks physical files on disk.
    """
    datasets = []
    
    # Check for MRO CTX Mosaic
    ctx_patterns = ["*ctx*", "*CTX*"]
    ctx_files = []
    if RAW_DATA_DIR.exists():
        for pat in ctx_patterns:
            ctx_files.extend(list(RAW_DATA_DIR.glob(pat)))
    
    ctx_image = None
    for f in ctx_files:
        if "dem" not in f.name.lower() and "dtm" not in f.name.lower():
            ctx_image = f
            break

    datasets.append(
        DatasetInfo(
            id="ctx_image",
            name="MRO CTX Orthomosaic (6m/px)",
            type="orthomosaic",
            available=ctx_image is not None and ctx_image.exists(),
            file_path=str(ctx_image) if ctx_image else None,
            file_size_bytes=ctx_image.stat().st_size if ctx_image else None,
            notes="Identified Mars Trek product: JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0"
        )
    )

    # Check for CTX DEM / DTM
    dem_file = None
    for f in ctx_files:
        if "dem" in f.name.lower() or "dtm" in f.name.lower():
            dem_file = f
            break
            
    datasets.append(
        DatasetInfo(
            id="ctx_dem",
            name="CTX Digital Elevation Model (~20m/px)",
            type="elevation",
            available=dem_file is not None and dem_file.exists(),
            file_path=str(dem_file) if dem_file else None,
            file_size_bytes=dem_file.stat().st_size if dem_file else None,
            notes="USGS Jezero CTX DEM (~20m/pixel) required for slope and hazard generation"
        )
    )

    # Check for HiRISE Ortho
    hirise_files = []
    if RAW_DATA_DIR.exists():
        hirise_files.extend(list(RAW_DATA_DIR.glob("*hirise*")))
        hirise_files.extend(list(RAW_DATA_DIR.glob("*HIRISE*")))
    
    hirise_file = hirise_files[0] if hirise_files else None

    datasets.append(
        DatasetInfo(
            id="hirise_sample",
            name="MRO HiRISE Orthomosaic (25cm/px)",
            type="orthomosaic",
            available=hirise_file is not None and hirise_file.exists(),
            file_path=str(hirise_file) if hirise_file else None,
            file_size_bytes=hirise_file.stat().st_size if hirise_file else None,
            notes="High resolution product: JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_lats0_lon0_first_dd.tif"
        )
    )

    return datasets

