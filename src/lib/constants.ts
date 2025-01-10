// Force Heroku URL in production, allow override in development only
const NODE_ENV = "development";
const isDevelopment = NODE_ENV === 'development';
console.log('Environment:', process.env.NODE_ENV);
console.log('API URL from env:', process.env.NEXT_PUBLIC_API_URL);
console.log('Google Client ID from env:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export const API_BASE_URL = isDevelopment 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://explainai-new-528ec8eb814a.herokuapp.com')
  : 'https://explainai-new-528ec8eb814a.herokuapp.com';

console.log('Using API_BASE_URL:', API_BASE_URL);

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '395094655648-tpf5gvtmk7h3c086gp6ubf2qgupf8uib.apps.googleusercontent.com';
console.log('Using GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);

export const EXAMPLE_DOCUMENT_IDS = [
  "2ee4de4e-2813-47d5-bbea-1863a5d86242",
  "03db4281-0ccf-4ad7-9b54-a17698e28b7a",  
  "e5dd251a-3838-48e6-b1ab-cab830b0e892",
  "65b1bc8d-94ec-4c48-8cdd-dd75c03c8097",
  "3ca86b77-c1f3-42d2-b9f0-4e88246d5c61"
]