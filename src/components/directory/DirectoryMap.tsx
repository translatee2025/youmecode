import { useEffect, useRef, useState } from 'react';
import { useLocationStore } from '@/stores/locationStore';

interface Props {
  venues: any[];
  onBoundsChange?: (venueIds: string[]) => void;
}

export default function DirectoryMap({ venues, onBoundsChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { lat, lng, isActive, radius } = useLocationStore();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN;
    if (!token) return;

    let cancelled = false;

    import('mapbox-gl').then((mapboxgl) => {
      if (cancelled || !containerRef.current) return;
      (mapboxgl as any).accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [lng ?? 0, lat ?? 30],
        zoom: 12,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapRef.current = map;

      map.on('load', () => setMapLoaded(true));

      map.on('moveend', () => {
        if (!onBoundsChange) return;
        const bounds = map.getBounds();
        const visible = venues.filter(
          (v) =>
            v.location_lat &&
            v.location_lng &&
            bounds.contains([v.location_lng, v.location_lat]),
        );
        onBoundsChange(visible.map((v: any) => v.id));
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when venues change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const mapboxgl = (window as any).mapboxgl ?? null;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validVenues = venues.filter((v) => v.location_lat && v.location_lng);

    import('mapbox-gl').then((mb) => {
      validVenues.forEach((v) => {
        const el = document.createElement('div');
        el.className = 'directory-marker';
        el.style.cssText =
          'width:14px;height:14px;border-radius:50%;background:var(--color-primary,#fff);border:2px solid rgba(0,0,0,0.3);cursor:pointer;';

        const popup = new mb.Popup({ offset: 25, closeButton: false }).setHTML(
          `<div style="padding:6px;max-width:180px;font-size:12px;color:#000">
            <strong>${v.name}</strong>
            ${v.city ? `<br/><span style="color:#666">${v.city}</span>` : ''}
          </div>`,
        );

        const marker = new mb.Marker(el)
          .setLngLat([v.location_lng, v.location_lat])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });

      // Fit bounds
      if (validVenues.length > 0 && !isActive) {
        const lngs = validVenues.map((v: any) => v.location_lng);
        const lats = validVenues.map((v: any) => v.location_lat);
        mapRef.current.fitBounds(
          [
            [Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01],
            [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01],
          ],
          { padding: 40, maxZoom: 15 },
        );
      }
    });
  }, [venues, mapLoaded]);

  // User location
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !isActive || !lat || !lng) return;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 13 });
  }, [isActive, lat, lng, mapLoaded]);

  const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN;
  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Map requires a Mapbox token. Add VITE_MAPBOX_TOKEN to environment.
      </div>
    );
  }

  return <div ref={containerRef} className="flex-1 min-h-[400px] rounded-xl overflow-hidden" />;
}
