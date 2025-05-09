import { create } from 'zustand';
import { Hike } from './types/hike';

// Define the type for location coordinates
export type LatLng = {
  latitude: number;
  longitude: number;
};

// Format coordinates to string
export const formatCoordinates = (coords: LatLng | null): string => {
  if (!coords) return '';
  return `${coords.latitude},${coords.longitude}`;
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
  
  // Actions
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