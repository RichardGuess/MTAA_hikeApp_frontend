import { create } from 'zustand';
import { Hike } from '../types/hike';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export interface GeoJSONRoute {
  type: string;
  coordinates: [number, number][];
}

// Format coordinates to string
export const formatCoordinates = (coords: LatLng | string | null): string => {
  if (!coords) return '';
  if (typeof coords === 'string') return coords;

  const { latitude, longitude } = coords;
  if (latitude === undefined || longitude === undefined) return '';
  
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

// Parse coordinates from string
export const parseCoordinates = (coordsStr: string | null): LatLng | null => {
  if (!coordsStr) return null;
  
  try {
    const [latStr, lngStr] = coordsStr.split(',');
    const lat = parseFloat(latStr.trim());
    const lng = parseFloat(lngStr.trim());
    
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  } catch (e) {
    console.error('Error parsing coordinates:', e);
  }
  
  return null;
};

interface HikeState {
  hikes: Hike[];
  currentHike: Hike | null;
  currentHikePolyline: GeoJSONRoute;
  // Actions
  setCurrentHikePolyline: (route: GeoJSONRoute) => void;
  clearHikePolyline: () => void;  
  setHikes: (hikes: Hike[]) => void;
  addHike: (hike: Hike) => void;
  updateHike: (updatedHike: Hike) => void;
  deleteHike: (id: number) => void;
  setCurrentHike: (hike: Hike | null) => void;
  initNewHike: () => void;
  updateCurrentHikeField: <K extends keyof Hike>(field: K, value: Hike[K]) => void;
}

export const useHikeStore = create<HikeState>((set) => ({
  hikes: [],
  currentHike: null,

  currentHikePolyline: { type: "LineString", coordinates: [] },

  setCurrentHikePolyline: (route) =>
    set(() => ({
      currentHikePolyline: route,
    })),

  clearHikePolyline: () =>
    set(() => ({
      currentHikePolyline: { type: "LineString", coordinates: [] },
    })),

  setHikes: (hikes) => set({ hikes }),
  
  addHike: (hike) => set((state) => ({
    hikes: [...state.hikes, hike],
    currentHike: null // Reset current hike after adding
  })),
  
  updateHike: (updatedHike) => set((state) => ({
    hikes: state.hikes.map((h) => (h.id === updatedHike.id ? updatedHike : h)),
    currentHike: state.currentHike?.id === updatedHike.id ? updatedHike : state.currentHike
  })),
  
  deleteHike: (id) => set((state) => ({
    hikes: state.hikes.filter((h) => h.id !== id),
    currentHike: state.currentHike?.id === id ? null : state.currentHike
  })),
  
  setCurrentHike: (hike) => set({ currentHike: hike }),
  
  initNewHike: () => set({
    currentHike: {
      id: Date.now(),
      name: 'New Hike',
      nickname: null,
      created_at: new Date(),
      start_point: null,
      dest_point: null,
      distance: null,
      calories: null,
      geom: null,
      user_id: 1 // Default user ID
    }
  }),
  
  updateCurrentHikeField: (field, value) => set((state) => {
    if (!state.currentHike) return state;
    
    return {
      currentHike: {
        ...state.currentHike,
        [field]: value
      }
    };
  })
}));