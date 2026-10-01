const values = {
  DEV: false,
  PROD: true,
  MODE: 'production',
  PKG_NAME: '',
  PKG_VERSION: '',
  VITE_APP_DISABLE_SENTRY: 'true',
  VITE_APP_DISABLE_PREVENT_UNLOAD: 'true',
  VITE_APP_ENABLE_TRACKING: 'false',
  VITE_APP_GIT_SHA: '5db42c3ddbbdc44d10120ab2f18e0864d083e268',
  VITE_APP_BACKEND_V2_GET_URL: '',
  VITE_APP_BACKEND_V2_POST_URL: '',
  VITE_APP_WS_SERVER_URL: '',
  VITE_APP_PORTAL_URL: '',
  VITE_APP_AI_BACKEND: '',
  VITE_APP_FIREBASE_CONFIG: '',
  VITE_APP_PLUS_LP: '',
  VITE_APP_PLUS_APP: '',
  VITE_APP_PLUS_EXPORT_PUBLIC_KEY: '',
  VITE_APP_LIBRARY_URL: '',
  VITE_APP_LIBRARY_BACKEND: '',
  VITE_APP_DEBUG_ENABLE_TEXT_CONTAINER_BOUNDING_BOX: 'false',
  VITE_WORKER_ID: '',
};

function definitions() {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [`import.meta.env.${name}`, JSON.stringify(value)]));
}

module.exports = { values, definitions };
