/**
 * Astro-nah API Service
 * Handles communication with the FastAPI backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to connect to backend:', error);
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
    console.error('Failed to fetch datasets:', error);
    return { datasets: [] };
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
    return { valid: false, lat, lng };
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

export function getOverlayUrl(type) {
  return `${BASE_URL}/terrain/overlay/${type}`;
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
