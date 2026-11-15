/**
 * Paleohydrology Engine for Jezero Crater Ancient Lake (~3.7 Ga)
 * 
 * Scientific context:
 * In the late Noachian / early Hesperian epoch (~3.7-3.8 Ga), Jezero Crater hosted
 * an open-basin paleolake fed by Neretva Vallis (western inlet) and Pliva Vallis (northern inlet),
 * with an eastern breach overflow sill into Isidis Planitia.
 * 
 * Published lake levels (Fassett & Head 2005; Goudge et al. 2015, 2018; Mangold et al. 2021 Science):
 * - Crater floor: ~ -2,580 m to -2,560 m datum elevation.
 * - Gilbert-type delta deposition highstand: ~ -2,395 m (approx. -2,400 ± 10 m).
 *   At this level, Neretva river inflow entered standing lake waters and deposited the Western Delta.
 * - Kodiak Butte foreset beds prove standing water depth of ~170-190 m above the basin floor.
 * - Eastern outlet spillway breach: ~ -2,350 m.
 */

export const JEZERO_ELEV_BOUNDS = {
  minElev: -2710.7,
  maxElev: -1515.5
};

export const PALEOLAKE_PRESETS = [
  {
    id: 'today',
    label: 'Today (Dry)',
    shortLabel: 'Dry (0m)',
    level: -2650,
    depth: 0,
    description: 'Present-day hyper-arid Mars: Jezero Crater basin floor is dry wind-blown regolith.',
    isDefault: true
  },
  {
    id: 'lowstand',
    label: 'Lowstand Basin Pool (-2,530 m)',
    shortLabel: 'Lowstand',
    level: -2530,
    depth: 37,
    description: 'Receding paleolake or early lowstand pool (~35 m deep) confined to the central crater depression.'
  },
  {
    id: 'highstand',
    label: 'Ancient Lake Highstand (~ -2,395 m)',
    shortLabel: 'Ancient Lake',
    level: -2395,
    depth: 172,
    badge: 'Canonical Delta Shoreline',
    description: 'Delta-forming highstand (approx. -2,400 ± 10 m; Fassett & Head 2005, Mangold et al. 2021 Science). River inflow deposited the Western Delta right at this shoreline.'
  },
  {
    id: 'spillway',
    label: 'Eastern Spillway Overflow (-2,350 m)',
    shortLabel: 'Spillway',
    level: -2350,
    depth: 217,
    description: 'Maximum lake filling breaching the eastern crater rim notch, discharging catastrophic floods into Isidis Planitia.'
  }
];

/**
 * Generates an optimized 512x512 RGBA canvas data URL overlay representing
 * the flood waters of the ancient lake at a specified water elevation.
 * 
 * Features depth-based bathymetric gradient and luminous shoreline crest.
 */
export function generatePaleolakeCanvasUrl(heightmapImg, waterLevel, minElev = JEZERO_ELEV_BOUNDS.minElev, maxElev = JEZERO_ELEV_BOUNDS.maxElev) {
  if (!heightmapImg || waterLevel <= -2600) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(heightmapImg, 0, 0);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  const totalPixels = 512 * 512;
  const range = maxElev - minElev;

  // Pre-calculate threshold pixel value (0..255) for instant lookup
  const thresholdPixel = ((waterLevel - minElev) / range) * 255.0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const pixelVal = data[idx]; // Grayscale heightmap R=G=B

    if (pixelVal <= thresholdPixel) {
      const cellElev = minElev + (pixelVal / 255.0) * range;
      const depthMeters = waterLevel - cellElev;

      if (depthMeters <= 3.5) {
        // Luminous Shoreline Crest (Pale Aquamarine / Frosted Surf)
        data[idx] = 125;     // R
        data[idx + 1] = 211; // G
        data[idx + 2] = 252; // B
        data[idx + 3] = 220; // Alpha
      } else if (depthMeters < 25) {
        // Shallow Shoreline / Delta Fan Shelf (Vibrant Turquoise)
        data[idx] = 6;
        data[idx + 1] = 182;
        data[idx + 2] = 212;
        data[idx + 3] = 155;
      } else if (depthMeters < 80) {
        // Intermediate Crater Basin (Rich Azure)
        data[idx] = 2;
        data[idx + 1] = 132;
        data[idx + 2] = 199;
        data[idx + 3] = 185;
      } else {
        // Deep Abyssal Crater Floor (Deep Oceanic Sapphire)
        data[idx] = 3;
        data[idx + 1] = 105;
        data[idx + 2] = 161;
        data[idx + 3] = 215;
      }
    } else {
      // Dry Land: Fully transparent
      data[idx + 3] = 0;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Analyzes how much of an active rover/astronaut traverse is submerged
 * under the simulated paleolake water level.
 */
export function analyzeRouteUnderLake(routeData, waterLevel) {
  if (!routeData?.route || routeData.route.length === 0 || waterLevel <= -2600) {
    return null;
  }

  const route = routeData.route;
  let submergedCount = 0;
  let maxDepth = 0;
  let firstSubmergedKm = null;
  let firstExitKm = null;
  const total = route.length;

  route.forEach((pt, idx) => {
    const ptElev = pt.elevation_m;
    if (ptElev != null && ptElev <= waterLevel) {
      submergedCount++;
      const depth = waterLevel - ptElev;
      if (depth > maxDepth) maxDepth = depth;
      if (firstSubmergedKm === null) {
        firstSubmergedKm = ((idx / Math.max(1, total - 1)) * routeData.distance_km).toFixed(2);
      }
    } else {
      if (firstSubmergedKm !== null && firstExitKm === null) {
        firstExitKm = ((idx / Math.max(1, total - 1)) * routeData.distance_km).toFixed(2);
      }
    }
  });

  const pct = Math.round((submergedCount / total) * 100);
  const submergedKm = parseFloat(((submergedCount / total) * routeData.distance_km).toFixed(2));

  return {
    submergedCount,
    total,
    pct,
    submergedKm,
    maxDepth: Math.round(maxDepth),
    firstSubmergedKm,
    firstExitKm,
    isSubmerged: submergedCount > 0,
    waterLevel
  };
}

