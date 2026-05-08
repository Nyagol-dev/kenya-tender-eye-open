export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  appName: import.meta.env.VITE_APP_NAME ?? 'Kenya e-Procurement',
} as const;
