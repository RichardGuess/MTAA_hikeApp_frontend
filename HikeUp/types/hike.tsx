export interface Hike {
  id: number;
  name: string | null;
  nickname: string | null;
  created_at: string | Date;
  start_point: number | null;
  dest_point: number | null;
  distance: number | null;
  geom: Geolocation | null;
  calories: number | null;
  user_id: number;  
}