import { create } from 'zustand';

interface LocationState {
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  radius: number; // km
  error: string | null;
  activate: () => void;
  deactivate: () => void;
  setRadius: (r: number) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  lat: null,
  lng: null,
  isActive: false,
  radius: 10,
  error: null,
  activate: () => {
    if (!navigator.geolocation) {
      set({ error: 'Geolocation not supported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        set({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isActive: true,
          error: null,
        }),
      (err) => set({ error: err.message }),
    );
  },
  deactivate: () => set({ isActive: false, lat: null, lng: null }),
  setRadius: (radius) => set({ radius }),
}));
