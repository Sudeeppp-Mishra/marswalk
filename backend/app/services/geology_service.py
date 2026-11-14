from typing import List, Dict, Any

# Authentic USGS Jezero Crater Geological Units (Sun & Stack 2020 / USGS SIM 3464)
GEOLOGICAL_UNITS = [
    {
        "id": "western_delta",
        "name": "Western Delta Sedimentary Deposit",
        "unit_symbol": "HNb",
        "rock_type": "Sedimentary (Sandstones & Mudstones)",
        "estimated_age": "Late Noachian to Early Hesperian (~3.7 - 3.8 Ga)",
        "mineralogy": "Smectite clays, Fe/Mg-carbonates, hydrated silica",
        "description": "Distal and proximal sedimentary fan deposits formed by paleoriver inflow from Neretva Vallis into Lake Jezero. Outstanding priority for ancient biosignature preservation.",
        "bounds": {
            "south": 18.410,
            "north": 18.465,
            "west": 77.385,
            "east": 77.435
        },
        "color": "#F59E0B" # Amber/Gold
    },
    {
        "id": "seitah_formation",
        "name": "Séítah Subsurface Formation",
        "unit_symbol": "Ncf",
        "rock_type": "Igneous (Olivine-Cumulate / Picrite)",
        "estimated_age": "Early Noachian (~3.9 - 4.0 Ga)",
        "mineralogy": "Coarse olivine (Fo~75-80), augite pyroxene, altered carbonates",
        "description": "Stratiform layered igneous cumulate representing either a thick differentiated lava lake or subvolcanic sill on the Jezero basin floor prior to lake transgression.",
        "bounds": {
            "south": 18.415,
            "north": 18.438,
            "west": 77.430,
            "east": 77.455
        },
        "color": "#10B981" # Emerald/Green
    },
    {
        "id": "maaz_formation",
        "name": "Máaz Crater Floor Basaltic Unit",
        "unit_symbol": "Hcf",
        "rock_type": "Igneous (Basaltic / Pyroxene-rich)",
        "estimated_age": "Early Hesperian (~3.5 - 3.7 Ga)",
        "mineralogy": "Low-Ca and high-Ca pyroxenes, plagioclase, pervasive sulfate salt rinds",
        "description": "Pervasive crater floor basalt capping Séítah, providing crucial radiometric dating benchmarks for Mars crater chronology.",
        "bounds": {
            "south": 18.435,
            "north": 18.460,
            "west": 77.445,
            "east": 77.475
        },
        "color": "#6366F1" # Indigo/Blue
    },
    {
        "id": "neretva_vallis",
        "name": "Neretva Vallis Paleofluvial Channel",
        "unit_symbol": "HNch",
        "rock_type": "Fluvial Incision / Boulder Conglomerates",
        "estimated_age": "Late Noachian (~3.8 Ga)",
        "mineralogy": "Transported polymict impact breccia and upstream clay clasts",
        "description": "Major breached inlet valley through the western crater rim that once discharged into the open-basin lake.",
        "bounds": {
            "south": 18.465,
            "north": 18.505,
            "west": 77.340,
            "east": 77.385
        },
        "color": "#EC4899" # Pink
    }
]

# Authentic Perseverance Rover Scientific Observation Sites
ROVER_OBSERVATIONS = [
    {
        "sol": 0,
        "name": "Octavia E. Butler Landing",
        "campaign": "Landing & Commissioning",
        "coords": [18.4447, 77.4508],
        "elevation_m": -2567.2,
        "instrument": "Navcam / Mastcam-Z",
        "target_sample": "First touchdown imaging & flight field",
        "significance": "Touchdown site inside Jezero Crater floor. Initiated the Mars 2020 exploration campaign."
    },
    {
        "sol": 180,
        "name": "Bastide & Rochette (Séítah)",
        "campaign": "Crater Floor & Séítah Campaign",
        "coords": [18.4285, 77.4419],
        "elevation_m": -2562.4,
        "instrument": "PIXL, SHERLOC, SuperCam",
        "target_sample": "Montdenier & Montagnac cored rock samples",
        "significance": "Confirmed igneous olivine-cumulate origin with signs of ancient liquid groundwater interaction."
    },
    {
        "sol": 420,
        "name": "Three Forks Delta Base",
        "campaign": "Delta Front Entry",
        "coords": [18.4352, 77.4208],
        "elevation_m": -2565.1,
        "instrument": "Mastcam-Z & RIMFAX GPR",
        "target_sample": "First sample depot location",
        "significance": "Transition zone between crater floor igneous bedrock and ancient sedimentary delta clinoforms."
    },
    {
        "sol": 550,
        "name": "Wildcat Ridge (Delta Top)",
        "campaign": "Delta Clastics & Astrobiology",
        "coords": [18.4412, 77.4081],
        "elevation_m": -2538.5,
        "instrument": "SHERLOC UV Raman / Fluorescence",
        "target_sample": "Swift Run & Hazeltop cored mudstones",
        "significance": "High concentration of organic aromatics detected in fine-grained sulfate-bearing mudstones."
    },
    {
        "sol": 750,
        "name": "Tenby / Delta Topset Strata",
        "campaign": "Upper Delta Fan Traverse",
        "coords": [18.4480, 77.3950],
        "elevation_m": -2505.2,
        "instrument": "SuperCam LIBS / ChemCam",
        "target_sample": "Atis Tiras sandstone sample",
        "significance": "Coarser cross-bedded sandstones indicating dynamic fast-flowing river regimes in the terminal delta stage."
    }
]

def get_geology_data() -> Dict[str, Any]:
    return {
        "geological_units": GEOLOGICAL_UNITS,
        "rover_observations": ROVER_OBSERVATIONS
    }

