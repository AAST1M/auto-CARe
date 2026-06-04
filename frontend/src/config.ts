// In production (Vercel/Render), we use VITE_API_URL.
// If it's not set, we assume we are running locally on port 3000 pointing to backend 5001.
// If it's deployed as a monolith on Render, we can just use empty string to use relative paths.
export const API_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : import.meta.env.PROD ? '' : 'http://localhost:5001';
