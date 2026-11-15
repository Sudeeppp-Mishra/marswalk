from typing import List, Dict, Any

# Schematic units after USGS SIM 3464 (approximate boundaries)
# Polygonal coverage following the Jezero Delta morphology (Sun & Stack 2020)
GEOLOGICAL_UNITS = [
    {
        "id": "western_delta",
        "name": "Western Delta Sedimentary Deposit",
        "unit_symbol": "HNb",
        "short_label": "Western Delta (HNb)",
        "rock_type": "Sedimentary (Sandstones & Mudstones)",
        "estimated_age": "Late Noachian (~3.7 Ga)",
        "mineralogy": "Smectite clays, Fe/Mg-carbonates, hydrated silica",
        "description": "Distal and proximal sedimentary fan deposits formed by river inflow from Neretva Vallis into Lake Jezero. Outstanding priority for ancient biosignature preservation.",
        "center": [18.438, 77.415],
        "coordinates": [
            [18.415, 77.392],
            [18.438, 77.382],
            [18.462, 77.395],
            [18.468, 77.420],
            [18.455, 77.440],
            [18.435, 77.445],
            [18.420, 77.432],
            [18.410, 77.408]
        ],
        "color": "#F59E0B" # Amber/Gold
    },
    {
        "id": "seitah_formation",
        "name": "Séítah Subsurface Formation",
        "unit_symbol": "Ncf",
        "short_label": "Séítah Olivine (Ncf)",
        "rock_type": "Igneous (Olivine-Cumulate / Picrite)",
        "estimated_age": "Early Noachian (~3.9 Ga)",
        "mineralogy": "Coarse olivine (Fo~75-80), augite pyroxene, altered carbonates",
        "description": "Stratiform layered igneous cumulate representing differentiated lava lake or subvolcanic sill on the Jezero basin floor prior to lake transgression.",
        "center": [18.425, 77.445],
        "coordinates": [
            [18.415, 77.432],
            [18.430, 77.428],
            [18.438, 77.442],
            [18.435, 77.458],
            [18.422, 77.462],
            [18.412, 77.448]
        ],
        "color": "#10B981" # Emerald/Green
    },
    {
        "id": "maaz_formation",
        "name": "Máaz Crater Floor Basaltic Unit",
        "unit_symbol": "Hcf",
        "short_label": "Máaz Basalt (Hcf)",
        "rock_type": "Igneous (Basaltic / Pyroxene-rich)",
        "estimated_age": "Early Hesperian (~3.6 Ga)",
        "mineralogy": "Low-Ca and high-Ca pyroxenes, plagioclase, sulfate salt rinds",
        "description": "Pervasive crater floor basalt capping Séítah, providing crucial radiometric dating benchmarks for Mars crater chronology.",
        "center": [18.448, 77.465],
        "coordinates": [
            [18.435, 77.448],
            [18.462, 77.445],
            [18.468, 77.478],
            [18.442, 77.485],
            [18.428, 77.470]
        ],
        "color": "#6366F1" # Indigo/Blue
    },
    {
        "id": "neretva_vallis",
        "name": "Neretva Vallis Paleofluvial Channel",
        "unit_symbol": "HNch",
        "short_label": "Neretva Canyon (HNch)",
        "rock_type": "Fluvial Incision / Boulder Conglomerates",
        "estimated_age": "Late Noachian (~3.8 Ga)",
        "mineralogy": "Transported polymict impact breccia and upstream clay clasts",
        "description": "Major breached inlet valley through western crater rim that once discharged into Lake Jezero.",
        "center": [18.482, 77.360],
        "coordinates": [
            [18.468, 77.338],
            [18.488, 77.335],
            [18.502, 77.360],
            [18.488, 77.385],
            [18.465, 77.380],
            [18.455, 77.355]
        ],
        "color": "#EC4899" # Pink
    }
]

# Perseverance Rover Scientific Observation Milestones (Approximate sols & coordinates from NASA Mars 2020 mission releases)
ROVER_OBSERVATIONS = [
    {
        "sol": 0,
        "name": "Octavia E. Butler Landing (Approx. Sol 0)",
        "campaign": "Landing & Commissioning",
        "coords": [18.4447, 77.4508],
        "elevation_m": -2567.2,
        "instrument": "Navcam / Mastcam-Z",
        "target_sample": "First touchdown imaging & flight field",
        "significance": "Touchdown site inside Jezero Crater floor. Initiated Mars 2020 surface exploration."
    },
    {
        "sol": 180,
        "name": "Bastide & Rochette (Approx. Sol 180–198)",
        "campaign": "Crater Floor & Séítah Campaign",
        "coords": [18.4285, 77.4419],
        "elevation_m": -2562.4,
        "instrument": "PIXL, SHERLOC, SuperCam",
        "target_sample": "Montdenier & Montagnac cored rock samples",
        "significance": "Confirmed igneous olivine-cumulate origin with signs of ancient liquid groundwater interaction."
    },
    {
        "sol": 420,
        "name": "Three Forks Delta Base (Approx. Sol 420)",
        "campaign": "Delta Front Entry",
        "coords": [18.4352, 77.4208],
        "elevation_m": -2565.1,
        "instrument": "Mastcam-Z & RIMFAX GPR",
        "target_sample": "First sample depot location",
        "significance": "Entryway to Jezero Delta fan scarp. Mars Sample Return surface backup cache."
    },
    {
        "sol": 550,
        "name": "Wildcat Ridge (Approx. Sol 550)",
        "campaign": "Delta Front Campaign",
        "coords": [18.4395, 77.4120],
        "elevation_m": -2534.6,
        "instrument": "SHERLOC, PIXL Raman, SuperCam",
        "target_sample": "Swift Run & Hazeltop cored mudstones",
        "significance": "Fine-grained clay mudstones rich in organic aromatics deposited in ancient quiet lacustrine muds."
    },
    {
        "sol": 750,
        "name": "Tenby / Fan Crest (Approx. Sol 750)",
        "campaign": "Delta Top Campaign",
        "coords": [18.4412, 77.4081],
        "elevation_m": -2518.3,
        "instrument": "Mastcam-Z & SuperCam LIBS",
        "target_sample": "Amalik coarse sandstone core",
        "significance": "High-energy braided river channel conglomerate facies recording high-volume Mars flooding."
    }
]

def get_geology_data() -> Dict[str, Any]:
    """Returns verified geological formations and Perseverance rover milestones."""
    return {
        "geological_units": GEOLOGICAL_UNITS,
        "rover_observations": ROVER_OBSERVATIONS,
        "citation": "USGS Scientific Investigations Map 3464 & NASA Mars 2020 Perseverance Science Team"
    }
