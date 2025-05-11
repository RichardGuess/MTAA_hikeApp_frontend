import { LatLng } from "react-native-maps";

export interface Hike {
  id: number;
  name: string | null;
  nickname: string | null;
  created_at: string | Date;
  start_point: string | LatLng | null;
  dest_point: string | LatLng | null;
  distance: number | null;
  geom: Geolocation | null;
  calories: number | null;
  user_id: number;  
}