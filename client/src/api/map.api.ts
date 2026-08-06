import api from './client';

export interface MapRoute {
  /** Route geometry as [lat, lng] pairs */
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

export const mapApi = {
  getRoute: async (
    from: [number, number],
    to: [number, number],
    signal?: AbortSignal,
  ): Promise<MapRoute> => {
    const res = await api.get<{ data: MapRoute }>('/api/map/route', {
      params: {
        from: `${from[0]},${from[1]}`,
        to: `${to[0]},${to[1]}`,
      },
      signal,
    });
    return res.data.data;
  },
};
