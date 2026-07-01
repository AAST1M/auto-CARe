import { Router } from 'express';

const router = Router();

// ── GET: IP-based geolocation (proxied from backend to avoid browser CORS) ──
router.get('/geoip', async (req, res) => {
  // Get caller IP — supports reverse proxy headers
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '';

  const apis = [
    {
      url: `https://ip-api.com/json/${ip}?fields=lat,lon,city,regionName,status`,
      parse: (d: any) =>
        d.status === 'success'
          ? { lat: d.lat, lng: d.lon, name: `${d.city}, ${d.regionName}` }
          : null,
    },
    {
      url: `https://freeipapi.com/api/json/${ip}`,
      parse: (d: any) =>
        d.latitude
          ? { lat: d.latitude, lng: d.longitude, name: `${d.cityName}, ${d.regionName}` }
          : null,
    },
    {
      url: `https://ipapi.co/${ip}/json/`,
      parse: (d: any) =>
        d.latitude
          ? { lat: d.latitude, lng: d.longitude, name: `${d.city}, ${d.region}` }
          : null,
    },
  ];

  for (const api of apis) {
    try {
      const response = await fetch(api.url, {
        headers: { 'User-Agent': 'AutoCareAI/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const result = api.parse(data);
        if (result?.lat && result?.lng) {
          return res.json(result);
        }
      }
    } catch (e) {
      console.warn(`GeoIP API failed: ${api.url}`);
    }
  }

  // Fallback to Cairo
  res.json({ lat: 30.0444, lng: 31.2357, name: 'Cairo, Egypt', fallback: true });
});

export default router;
