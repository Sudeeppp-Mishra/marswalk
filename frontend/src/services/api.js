// Normalize API base URL: handles trailing slashes, missing /api prefix, and environments
const getNormalizedBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) {
    return import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api';
  }
  let cleaned = envUrl.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/api') && cleaned !== '/api') {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
};

const BASE_URL = getNormalizedBaseUrl();

// Schematic fallback dataset for USGS Geology & Perseverance Observation Milestones
// Approximate boundaries based on USGS SIM 3464 and Mars 2020 public science releases
export const DEFAULT_GEOLOGY_DATA = {
  geological_units: [
    {
      id: "western_delta",
      name: "Western Delta Sedimentary Deposit",
      unit_symbol: "HNb",
      short_label: "Western Delta (HNb)",
      rock_type: "Sedimentary (Sandstones & Mudstones)",
      estimated_age: "Late Noachian (~3.7 Ga)",
      mineralogy: "Smectite clays, Fe/Mg-carbonates, hydrated silica",
      description: "Distal and proximal sedimentary fan deposits formed by river inflow from Neretva Vallis into Lake Jezero.",
      center: [18.438, 77.415],
      coordinates: [
        [18.415, 77.392],
        [18.438, 77.382],
        [18.462, 77.395],
        [18.468, 77.420],
        [18.455, 77.440],
        [18.435, 77.445],
        [18.420, 77.432],
        [18.410, 77.408]
      ],
      color: "#F59E0B"
    },
    {
      id: "seitah_formation",
      name: "Séítah Subsurface Formation",
      unit_symbol: "Ncf",
      short_label: "Séítah Olivine (Ncf)",
      rock_type: "Igneous (Olivine-Cumulate / Picrite)",
      estimated_age: "Early Noachian (~3.9 Ga)",
      mineralogy: "Coarse olivine (Fo~75-80), augite pyroxene, altered carbonates",
      description: "Stratiform layered igneous cumulate representing differentiated lava lake or subvolcanic sill on Jezero basin floor.",
      center: [18.425, 77.445],
      coordinates: [
        [18.415, 77.432],
        [18.430, 77.428],
        [18.438, 77.442],
        [18.435, 77.458],
        [18.422, 77.462],
        [18.412, 77.448]
      ],
      color: "#10B981"
    },
    {
      id: "maaz_formation",
      name: "Máaz Crater Floor Basaltic Unit",
      unit_symbol: "Hcf",
      short_label: "Máaz Basalt (Hcf)",
      rock_type: "Igneous (Basaltic / Pyroxene-rich)",
      estimated_age: "Early Hesperian (~3.6 Ga)",
      mineralogy: "Low-Ca and high-Ca pyroxenes, plagioclase, sulfate salt rinds",
      description: "Pervasive crater floor basalt capping Séítah, providing crucial radiometric dating benchmarks.",
      center: [18.448, 77.465],
      coordinates: [
        [18.435, 77.448],
        [18.462, 77.445],
        [18.468, 77.478],
        [18.442, 77.485],
        [18.428, 77.470]
      ],
      color: "#6366F1"
    },
    {
      id: "neretva_vallis",
      name: "Neretva Vallis Paleofluvial Channel",
      unit_symbol: "HNch",
      short_label: "Neretva Canyon (HNch)",
      rock_type: "Fluvial Incision / Boulder Conglomerates",
      estimated_age: "Late Noachian (~3.8 Ga)",
      mineralogy: "Transported polymict impact breccia and upstream clay clasts",
      description: "Major breached inlet valley through western crater rim that once discharged into Lake Jezero.",
      center: [18.482, 77.360],
      coordinates: [
        [18.468, 77.338],
        [18.488, 77.335],
        [18.502, 77.360],
        [18.488, 77.385],
        [18.465, 77.380],
        [18.455, 77.355]
      ],
      color: "#EC4899"
    }
  ],
  rover_observations: [
    {
      sol: 0,
      name: "Octavia E. Butler Landing (Approx. Sol 0)",
      campaign: "Landing & Commissioning",
      coords: [18.4447, 77.4508],
      elevation_m: -2567.2,
      instrument: "Navcam / Mastcam-Z",
      target_sample: "First touchdown imaging & flight field",
      significance: "Touchdown site inside Jezero Crater floor. Initiated Mars 2020 exploration campaign."
    },
    {
      sol: 180,
      name: "Bastide & Rochette (Approx. Sol 180–198)",
      campaign: "Crater Floor & Séítah Campaign",
      coords: [18.4285, 77.4419],
      elevation_m: -2562.4,
      instrument: "PIXL, SHERLOC, SuperCam",
      target_sample: "Montdenier & Montagnac cored rock samples",
      significance: "Confirmed igneous olivine-cumulate origin with signs of groundwater interaction."
    },
    {
      sol: 420,
      name: "Three Forks Delta Base (Approx. Sol 420)",
      campaign: "Delta Front Entry",
      coords: [18.4352, 77.4208],
      elevation_m: -2565.1,
      instrument: "Mastcam-Z & RIMFAX GPR",
      target_sample: "First sample depot location",
      significance: "Entryway to Jezero Delta fan scarp. Mars Sample Return surface backup cache."
    },
    {
      sol: 550,
      name: "Wildcat Ridge (Approx. Sol 550)",
      campaign: "Delta Front Campaign",
      coords: [18.4395, 77.4120],
      elevation_m: -2534.6,
      instrument: "SHERLOC, PIXL Raman, SuperCam",
      target_sample: "Swift Run & Hazeltop cored mudstones",
      significance: "Fine-grained clay mudstones rich in organic aromatics deposited in ancient quiet muds."
    },
    {
      sol: 750,
      name: "Tenby / Fan Crest (Approx. Sol 750)",
      campaign: "Delta Top Campaign",
      coords: [18.4412, 77.4081],
      elevation_m: -2518.3,
      instrument: "Mastcam-Z & SuperCam LIBS",
      target_sample: "Amalik coarse sandstone core",
      significance: "High-energy braided river channel conglomerate facies recording high-volume flooding."
    }
  ]
};

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
}

export async function getDatasets() {
  try {
    const response = await fetch(`${BASE_URL}/datasets`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return { datasets: [] };
  }
}

export async function getTerrainMetadata() {
  try {
    const response = await fetch(`${BASE_URL}/terrain/metadata`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function getTerrainAtPoint(lat, lng) {
  try {
    const response = await fetch(`${BASE_URL}/terrain/point?lat=${lat}&lng=${lng}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function getGeologyData() {
  try {
    const response = await fetch(`${BASE_URL}/science/geology`);
    if (response.ok) {
      const json = await response.json();
      if (json && json.geological_units && json.geological_units.length > 0) {
        return json;
      }
    }
  } catch (error) {
    console.warn('API geology fetch failed, using default client cache:', error);
  }
  return DEFAULT_GEOLOGY_DATA;
}

export function getOverlayUrl(type) {
  return `${BASE_URL}/terrain/overlay/${type}`;
}

export function getHiRISECropUrl(lat, lng, radius_m = 150, size = 512) {
  return `${BASE_URL}/terrain/hirise/crop?lat=${lat}&lng=${lng}&radius_m=${radius_m}&size=${size}`;
}

export async function getHiRISELandmarks() {
  try {
    const res = await fetch(`${BASE_URL}/terrain/hirise/landmarks`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch HiRISE landmarks:', err);
  }
  return { available: false, landmarks: [] };
}

export async function calculateRoute(start, destination, maxSlopeDeg = 20.0) {
  try {
    const response = await fetch(`${BASE_URL}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start: { lat: start.lat, lng: start.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        max_slope_deg: maxSlopeDeg
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to calculate route:', error);
    return { status: 'failed', error: error.message, route: [] };
  }
}
