import os
from pathlib import Path
from typing import List
import rasterio
from ..core.config import DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, find_file
from ..models.schemas import DatasetInfo

def get_registered_datasets() -> List[DatasetInfo]:
    """
    Inspects data directories for known planetary datasets.
    Searches both data/ and data/raw/ to support user dropping files anywhere in data.
    """
    datasets = []
    
    # 1. CTX Orthomosaic (6m)
    ctx_image = find_file("*ctx*ortho*.tif") or find_file("*CTX*ortho*.tif") or find_file("*ctx*.tif")
    ctx_info = None
    if ctx_image and ctx_image.exists():
        try:
            with rasterio.open(ctx_image) as src:
                ctx_info = {
                    "size": ctx_image.stat().st_size,
                    "crs": str(src.crs),
                    "res": float(src.res[0]),
                    "dims": f"{src.width}x{src.height}"
                }
        except Exception:
            pass

    datasets.append(
        DatasetInfo(
            id="ctx_image",
            name="MRO CTX Orthomosaic (6m/px)",
            type="orthomosaic",
            available=ctx_image is not None and ctx_image.exists(),
            file_path=str(ctx_image) if ctx_image else None,
            file_size_bytes=ctx_info["size"] if ctx_info else (ctx_image.stat().st_size if ctx_image else None),
            crs=ctx_info["crs"] if ctx_info else None,
            resolution_m=ctx_info["res"] if ctx_info else 6.0,
            notes=f"MRO CTX Mosaic ({ctx_info['dims']} px) in {ctx_image.parent.name}/" if ctx_info else ("Found on disk" if ctx_image else "Not found")
        )
    )

    # 2. CTX DEM / DTM (20m)
    dem_file = find_file("*DTM*.tif") or find_file("*dtm*.tif") or find_file("*DEM*.tif") or find_file("*dem*.tif")
    dem_info = None
    if dem_file and dem_file.exists():
        try:
            with rasterio.open(dem_file) as src:
                dem_info = {
                    "size": dem_file.stat().st_size,
                    "crs": str(src.crs),
                    "res": float(src.res[0]),
                    "dims": f"{src.width}x{src.height}"
                }
        except Exception:
            pass

    datasets.append(
        DatasetInfo(
            id="ctx_dem",
            name="USGS Jezero CTX DTM (~20m/px)",
            type="elevation",
            available=dem_file is not None and dem_file.exists(),
            file_path=str(dem_file) if dem_file else None,
            file_size_bytes=dem_info["size"] if dem_info else (dem_file.stat().st_size if dem_file else None),
            crs=dem_info["crs"] if dem_info else None,
            resolution_m=dem_info["res"] if dem_info else 20.0,
            notes=f"USGS Mars 2020 TRN CTX DTM mosaic ({dem_info['dims']} px) in {dem_file.parent.name}/" if dem_info else "Local 20m DTM"
        )
    )

    # 3. HiRISE Orthomosaic (25cm)
    hirise_file = find_file("*hirise*.tif") or find_file("*HIRISE*.tif") or find_file("*hirise*.jp2")
    hirise_info = None
    if hirise_file and hirise_file.exists():
        try:
            with rasterio.open(hirise_file) as src:
                hirise_info = {
                    "size": hirise_file.stat().st_size,
                    "crs": str(src.crs),
                    "res": float(src.res[0]),
                    "dims": f"{src.width}x{src.height}"
                }
        except Exception:
            pass

    datasets.append(
        DatasetInfo(
            id="hirise_sample",
            name="MRO HiRISE Orthomosaic (25cm/px)",
            type="orthomosaic",
            available=hirise_file is not None and hirise_file.exists(),
            file_path=str(hirise_file) if hirise_file else None,
            file_size_bytes=hirise_info["size"] if hirise_info else (hirise_file.stat().st_size if hirise_file else None),
            crs=hirise_info["crs"] if hirise_info else None,
            resolution_m=0.25,
            notes=f"Authentic MRO HiRISE 25cm Ultra-HD ({hirise_info['dims']} px, {hirise_file.stat().st_size / (1024**3):.1f} GB) in {hirise_file.parent.name}/" if hirise_info else "WMTS web stream active (Local TIF roadmap)"
        )
    )

    return datasets
