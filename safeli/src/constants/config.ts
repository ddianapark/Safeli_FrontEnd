// Toggle here to force mock auth and avoid real network calls.
// Set to `true` during frontend development if the Safeli API isn't available.
export const USE_MOCK_AUTH = true;

// ─── API base URL ─────────────────────────────────────────────────────────────
// Si usás Expo con variables de entorno (app.config.ts / .env), reemplazá por:
//   process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000'
//
// 10.0.2.2  → emulador Android (apunta al localhost de tu máquina)
// localhost  → web / iOS simulator
export const BASE_URL = 'http://localhost:3000';
 