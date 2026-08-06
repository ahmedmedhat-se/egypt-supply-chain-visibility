import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './Button';
import { useGeolocation } from '../../hooks/useGeolocation';
import { FaMapMarkerAlt, FaCrosshairs } from 'react-icons/fa';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPickerProps {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  geolocationOnly?: boolean;
  defaultZoom?: number;
  zoomOnLocate?: number;
}

const pulsingIcon = L.divIcon({
  className: '',
  html: '<div class="pulsing-marker"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function LocationMarker({
  lat,
  lng,
  onMove,
}: {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={[lat, lng]} icon={pulsingIcon} draggable eventHandlers={{ dragend: (e) => {
    const marker = e.target;
    const pos = marker.getLatLng();
    onMove(pos.lat, pos.lng);
  }}} />;
}

function FlyToCenter({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom?: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom ?? map.getZoom());
  }, [lat, lng, zoom, map]);
  return null;
}

export function MapPicker({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  geolocationOnly = false,
  defaultZoom,
  zoomOnLocate = 14,
}: MapPickerProps) {
  // Default: center of Egypt
  const lat = parseFloat(latitude) || 26.8206; 
  const lng = parseFloat(longitude) || 30.8025;
  const [centerLat, setCenterLat] = useState(lat);
  const [centerLng, setCenterLng] = useState(lng);
  const [flyZoom, setFlyZoom] = useState<number | null>(null);

  // Pre-filled coordinates get a closer starting zoom so the area is visible
  const hasPreFilled = !!(latitude && longitude && parseFloat(latitude));
  const initialZoom = defaultZoom ?? (hasPreFilled ? 10 : 6);

  const { latitude: geoLat, longitude: geoLng, loading: geoLoading, getCurrentPosition } = useGeolocation();

  const handleMove = (newLat: number, newLng: number) => {
    onLatitudeChange(newLat.toFixed(6));
    onLongitudeChange(newLng.toFixed(6));
  };

  const handleLocate = async () => {
    await getCurrentPosition();
  };

  // When geolocation resolves, update the marker position and zoom in
  useEffect(() => {
    if (geoLat !== null && geoLng !== null) {
      onLatitudeChange(geoLat.toFixed(6));
      onLongitudeChange(geoLng.toFixed(6));
      setCenterLat(geoLat);
      setCenterLng(geoLng);
      setFlyZoom(zoomOnLocate);
    }
  }, [geoLat, geoLng, onLatitudeChange, onLongitudeChange, zoomOnLocate]);

  // Sync center when coordinates change externally
  useEffect(() => {
    setCenterLat(lat);
    setCenterLng(lng);
    setFlyZoom(null);
  }, [latitude, longitude]);

  const currentLat = parseFloat(latitude) || lat;
  const currentLng = parseFloat(longitude) || lng;

  const hasLastPosition =
    geolocationOnly && !!(latitude && longitude && parseFloat(latitude) && parseFloat(longitude));

  return (
    <div className="space-y-3">
      {/* Map */}
      {/* z-0 + isolate keep Leaflet's internal panes inside this container so
          modal dropdowns/popovers render above the map, not underneath it. */}
      <div className="relative z-0 isolate rounded-lg overflow-hidden border border-[#E2E8F0] dark:border-[#1A3D5A]">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={initialZoom}
          className="h-64 w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToCenter lat={centerLat} lng={centerLng} zoom={flyZoom} />
          {!geolocationOnly && (
            <LocationMarker lat={currentLat} lng={currentLng} onMove={handleMove} />
          )}
          {geolocationOnly && hasLastPosition && (
            <Marker position={[currentLat, currentLng]} icon={pulsingIcon} />
          )}
        </MapContainer>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleLocate}
          isLoading={geoLoading}
          className="flex items-center gap-1.5"
        >
          <FaCrosshairs className="w-3.5 h-3.5" />
          {geoLoading ? 'Locating...' : 'Use My Location'}
        </Button>
        {!geolocationOnly && (
          <p className="text-xs text-[#94A3B8]">
            <FaMapMarkerAlt className="w-3 h-3 inline mr-1" />
            Click the map or drag the marker to set coordinates
          </p>
        )}
        {geolocationOnly && (
          <p className="text-xs text-[#94A3B8]">
            <FaMapMarkerAlt className="w-3 h-3 inline mr-1" />
            Only your actual GPS location is used to prevent cheating
          </p>
        )}
      </div>

      {/* Coordinate display */}
      <div className="flex items-center gap-3 text-xs text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#1A3D5A]/50 rounded-lg p-2">
        <span className="font-mono">
          Lat: {currentLat.toFixed(6)}
        </span>
        <span className="text-[#E2E8F0]">|</span>
        <span className="font-mono">
          Lng: {currentLng.toFixed(6)}
        </span>
      </div>
    </div>
  );
}
