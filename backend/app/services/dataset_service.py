import os
from pathlib import Path
from typing import List
import rasterio
from ..core.config import RAW_DATA_DIR, PROCESSED_DATA_DIR
from ..models.schemas import DatasetInfo

def get_registered_datasets() -> List[DatasetInfo]:
    """
    Inspects data directories for known planetary datasets.
    Reads physical GeoTIFF files and metadata dynamically.
    """
    datasets = []
    
    # 1. CTX Orthomosaic
    ctx_image = RAW_DATA_DIR / "JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tif"
    ctx_info = None
    if ctx_image.exists():
        try:
            with rasterio.open(ctx_image) as src:
                ctx_info = {
                    "size": ctx_image.stat().st_size,
                    "crs": str(src.crs),
                    "res": float(src.res[0]),
                    "dims": f"{src.width}x{src.height}"
                }
        except Exception as e:
            pass

    datasets.append(
        DatasetInfo(
            id="ctx_image",
            name="MRO CTX Orthomosaic (6m/px)",
            type="orthomosaic",
            available=ctx_image.exists(),
            file_path=str(ctx_image) if ctx_image.exists() else None,
            file_size_bytes=ctx_info["size"] if ctx_info else None,
            crs=ctx_info["crs"] if ctx_info else None,
            resolution_m=ctx_info["res"] if ctx_info else None,
            notes=f"Authentic Mars Trek / USGS MRO CTX Mosaic ({ctx_info['dims']} px)" if ctx_info else "Not downloaded"
        )
    )

    # 2. CTX DEM / DTM
    dem_file = RAW_DATA_DIR / "JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tif"
    dem_info = None
    if dem_file.exists():
        try:
            with rasterio.open(dem_file) as src:
                dem_info = {
                    "size": dem_file.stat().st_size,
                    "crs": str(src.crs),
                    "res": float(src.res[0]),
                    "dims": f"{src.width}x{src.height}"
                }
        except Exception as e:
            pass

    datasets.append(
        DatasetInfo(
            id="ctx_dem",
            name="USGS Jezero CTX DTM (~20m/px)",
            type="elevation",
            available=dem_file.exists(),
            file_path=str(dem_file) if dem_file.exists() else None,
            file_size_bytes=dem_info["size"] if dem_info else None,
            crs=dem_info["crs"] if dem_info else None,
            resolution_m=dem_info["res"] if dem_info else None,
            notes=f"Authentic USGS Mars 2020 TRN CTX DTM ({dem_info['dims']} px)" if dem_info else "Pending acquisition"
        )
    )

    # 3. HiRISE Sample
    hirise_files = list(RAW_DATA_DIR.glob("*hirise*")) if RAW_DATA_DIR.exists() else []
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


