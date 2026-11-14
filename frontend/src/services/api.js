/**
 * Astro-nah API Service
 * Handles communication with the FastAPI backend.
 * Uses environment variable or direct local URL (with CORS enabled).
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
