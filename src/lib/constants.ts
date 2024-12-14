// Force Heroku URL in production, allow override in development only
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_BASE_URL = isDevelopment 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://explainai-new-528ec8eb814a.herokuapp.com')
  : 'https://explainai-new-528ec8eb814a.herokuapp.com';

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '395094655648-tpf5gvtmk7h3c086gp6ubf2qgupf8uib.apps.googleusercontent.com';
