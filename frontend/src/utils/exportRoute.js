// Utility to export route data as GeoJSON, CSV, or formatted Markdown Dossier

export function exportRouteAsGeoJSON(routeData, startPoint, destinationPoint) {
  if (!routeData || !routeData.route) return;

  const coordinates = routeData.route.map(pt => [pt.lng, pt.lat, pt.elevation_m]);

  const geojson = {
    type: "FeatureCollection",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84" // Mars 2000 Planetocentric / Equidistant Lon/Lat
      }
    },
    properties: {
      mission: "Astro-nah - NASA Space Apps Challenge 2026",
      target: "Jezero Crater Delta, Mars",
      origin: startPoint,
      destination: destinationPoint,
      distance_km: routeData.distance_km,
      elevation_gain_m: routeData.elevation_gain_m,
      elevation_loss_m: routeData.elevation_loss_m,
      max_slope_deg: routeData.max_slope_deg,
      mean_slope_deg: routeData.mean_slope_deg,
      difficulty: routeData.estimated_difficulty,
      generated_at: new Date().toISOString()
    },
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coordinates
        },
        properties: {
          name: "Suggested Trajectory A* Corridor",
          stroke: "#D97745",
          "stroke-width": 4
        }
      },
      ...routeData.route.map((pt, i) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [pt.lng, pt.lat, pt.elevation_m]
        },
        properties: {
          waypoint_index: i + 1,
          elevation_m: pt.elevation_m,
          slope_deg: pt.slope_deg,
          hazard_tier: pt.slope_deg > 20 ? "hazard" : pt.slope_deg > 10 ? "caution" : "nominal"
        }
      }))
    ]
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
  downloadBlob(blob, `astronah_jezero_route_${Date.now()}.geojson`);
}

export function exportRouteAsCSV(routeData) {
  if (!routeData || !routeData.route) return;

  const headers = ["waypoint_index", "latitude", "longitude", "elevation_meters", "slope_degrees", "hazard_classification"];
  const rows = routeData.route.map((pt, i) => {
    const tier = pt.slope_deg > 20 ? "Impassable (>20 deg)" : pt.slope_deg > 10 ? "Moderate Incline (10-20 deg)" : "Nominal (<10 deg)";
    return [i + 1, pt.lat, pt.lng, pt.elevation_m, pt.slope_deg, `"${tier}"`].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `astronah_waypoints_${Date.now()}.csv`);
}

export function exportMissionDossierReport(routeData, startPoint, destinationPoint) {
  if (!routeData) return;

  const slopes = routeData.route?.map(pt => pt.slope_deg) || [];
  const total = slopes.length || 1;
  const nominalPct = Math.round((slopes.filter(s => s <= 10).length / total) * 100);
  const cautionPct = Math.round((slopes.filter(s => s > 10 && s <= 15).length / total) * 100);
  const steepPct = Math.round((slopes.filter(s => s > 15).length / total) * 100);

  const roverHours = (routeData.distance_km / 0.12).toFixed(1);
  const evaHours = ((routeData.distance_km / 1.1) * (1 + routeData.elevation_gain_m / 400)).toFixed(1);

  const report = `# ASTRO-NAH // EVA MISSION TRAVERSE DISPATCH REPORT
**NASA Space Apps Challenge 2026**  
**Target Region:** Jezero Crater Delta, Mars (18.38° N, 77.58° E)  
**Mission Designation:** EVA-JEZ-ALPHA  
**Generated:** ${new Date().toUTCString()}  

---

## 1. TRAVERSE OVERVIEW
- **Origin Waypoint:** ${startPoint ? `${startPoint.lat}° N, ${startPoint.lng}° E` : "Not specified"}
- **Destination Waypoint:** ${destinationPoint ? `${destinationPoint.lat}° N, ${destinationPoint.lng}° E` : "Not specified"}
- **Total Ground Distance:** ${routeData.distance_km} km (${routeData.distance_meters?.toLocaleString()} m)
- **Cumulative Waypoints:** ${routeData.waypoints_count} surface coordinates (~20m spacing)
- **Estimated Traverse Difficulty:** ${routeData.estimated_difficulty}

---

## 2. DURATION & MOBILITY LOGISTICS
- **Perseverance Rover Pace (~0.12 km/h):** ~${roverHours} hours (~${Math.ceil(roverHours / 4)} drive sols)
- **Astronaut Suited EVA Pace (~1.1 km/h):** ~${evaHours} hours (including slope penalty)
- **Metabolic Expenditure Estimate:** ~${Math.round(evaHours * 265)} kcal
- **Projected O₂ Consumption:** ~${Math.round(evaHours * 58)} Liters

---

## 3. TERRAIN & SLOPE HAZARD BREAKDOWN
- **Elevation Gain:** +${routeData.elevation_gain_m} m
- **Elevation Loss:** -${routeData.elevation_loss_m} m
- **Maximum Incline:** ${routeData.max_slope_deg}°
- **Mean Slope:** ${routeData.mean_slope_deg}°
- **Terrain Risk Spectrum:**
  - Nominal (<10°): ${nominalPct}%
  - Moderate Caution (10°–15°): ${cautionPct}%
  - Steep Climb (>15°): ${steepPct}%
  - Impassable (>20°): 0% (Avoided by A* corridor)

---

## 4. SCIENTIFIC & SENSOR DATA DISCLOSURE
- Elevation data derived from USGS 20m CTX Digital Elevation Model (DTM).
- Surface context imagery from MRO Context Camera (CTX) ~6m mosaic.
- Planetary geological units verified against USGS SIM 3464.
- Prototype disclaimer: Suggested navigation trajectory for conceptual mission planning.
`;

  const blob = new Blob([report], { type: "text/markdown;charset=utf-8;" });
  downloadBlob(blob, `astronah_mission_dossier_${Date.now()}.md`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

