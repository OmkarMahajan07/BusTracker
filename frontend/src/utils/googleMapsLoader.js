/**
 * googleMapsLoader.js
 * ───────────────────
 * A shared, singleton Google Maps script loader.
 *
 * Problem this solves:
 *   - Both Driver.jsx and BusDashboard.jsx tried to inject the Maps script
 *     with *different* callback names (initDriverMap vs initBusMap).
 *   - When navigating between pages in the same session the script was already
 *     loaded, the new callback was never called → "This page didn't load
 *     Google Maps correctly."
 *
 * Usage:
 *   import { loadGoogleMaps } from '../utils/googleMapsLoader';
 *   await loadGoogleMaps(apiKey);   // resolves when window.google.maps is ready
 */

const SCRIPT_ID  = 'google-maps-script';
const CB_NAME    = '__googleMapsReady';

let _promise = null; // singleton promise — reused across components

export function loadGoogleMaps(apiKey) {
  // Already loaded
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Already loading — return the same promise
  if (_promise) return _promise;

  _promise = new Promise((resolve, reject) => {
    // Register the global callback BEFORE injecting the script tag
    window[CB_NAME] = () => {
      resolve();
      delete window[CB_NAME];
    };

    if (document.getElementById(SCRIPT_ID)) {
      // Script tag exists but hasn't resolved yet — just wait for the callback
      return;
    }

    const script = document.createElement('script');
    script.id    = SCRIPT_ID;
    script.src   = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${CB_NAME}&v=weekly&libraries=marker,places`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => {
      _promise = null; // allow retry on next call
      reject(new Error('Failed to load Google Maps API'));
    };
    document.head.appendChild(script);
  });

  return _promise;
}
