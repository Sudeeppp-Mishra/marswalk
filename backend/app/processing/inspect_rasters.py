import rasterio
import numpy as np
from pathlib import Path
from ..core.config import RAW_DATA_DIR

def inspect_dataset(file_path: Path):
    print(f"\n=======================================================")
    print(f"FILE: {file_path.name}")
    print(f"=======================================================")
    with rasterio.open(file_path) as src:
        print(f"Driver:       {src.driver}")
        print(f"Width x Height: {src.width} x {src.height} pixels")
        print(f"Bands:        {src.count}")
        print(f"Data Types:   {src.dtypes}")
        print(f"NoData Value: {src.nodata}")
        print(f"CRS:          {src.crs}")
        print(f"Resolution:   {src.res}")
        print(f"Bounds:       {src.bounds}")
        print(f"Transform:\n{src.transform}")

        # Read first band overview/stats safely without exhausting RAM
        # Sample or read downsampled / full if small
        data = src.read(1)
        valid_mask = data != src.nodata if src.nodata is not None else np.isfinite(data)
        valid_data = data[valid_mask]
        if len(valid_data) > 0:
            print(f"Valid Pixels: {len(valid_data):,} / {data.size:,} ({len(valid_data)/data.size*100:.1f}%)")
            print(f"Min Value:    {float(np.min(valid_data)):.2f}")
            print(f"Max Value:    {float(np.max(valid_data)):.2f}")
            print(f"Mean Value:   {float(np.mean(valid_data)):.2f}")
            print(f"Std Dev:      {float(np.std(valid_data)):.2f}")
        else:
            print("No valid pixels found!")

if __name__ == "__main__":
    dtm_path = RAW_DATA_DIR / "JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tif"
    ortho_path = RAW_DATA_DIR / "JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tif"
    
    if dtm_path.exists():
        inspect_dataset(dtm_path)
    if ortho_path.exists():
        inspect_dataset(ortho_path)

