// This file must be imported before any cesium/resium imports
if (typeof window !== 'undefined') {
    (window as Window & { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = '/cesium';
}