import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import { useShipments } from '../../hooks/useShipments';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { ShipmentStatusBadge } from '../shipments/ShipmentStatusBadge';
import { formatDate } from '../../lib/utils';
import type { Shipment, ShipmentStatus } from '../../types/shipment.types';

const EGYPT_CENTER: [number, number] = [26.8206, 30.8025];

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  draft: '#94A3B8',
  pending: '#94A3B8',
  confirmed: '#3B82F6',
  picked_up: '#3B82F6',
  in_transit: '#0EA5E9',
  at_checkpoint: '#F59E0B',
  customs_hold: '#EF4444',
  customs_cleared: '#10B981',
  out_for_delivery: '#2563EB',
  delivered: '#10B981',
  delayed: '#F59E0B',
  cancelled: '#EF4444',
};

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const primaryPosition = (shipment: Shipment): { lat: number; lng: number } | null => {
  if (shipment.currentLatitude != null && shipment.currentLongitude != null) {
    return { lat: shipment.currentLatitude, lng: shipment.currentLongitude };
  }
  const origin = shipment.originPosition;
  if (origin?.latitude != null && origin.longitude != null) {
    return { lat: origin.latitude, lng: origin.longitude };
  }
  return null;
};

const tripDuration = (shipment: Shipment): string | null => {
  const days = shipment.route?.estimatedDays;
  if (days != null && days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  const dep = shipment.estimatedDepartureAt;
  const arr = shipment.estimatedArrivalAt;
  if (dep && arr) {
    const diffMs = new Date(arr).getTime() - new Date(dep).getTime();
    if (!Number.isNaN(diffMs) && diffMs > 0) {
      const diffDays = Math.ceil(diffMs / 86_400_000);
      return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }
  }
  return null;
};

const makeIcon = (color: string, selected: boolean): L.DivIcon => {
  const ring = selected
    ? `<span class="live-pin-ring" style="border-color:${color}"></span>`
    : '';
  return L.divIcon({
    className: 'live-pin',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `${ring}<span class="live-pin-dot" style="background:${color}"></span>`,
  });
};

const markerPopupHtml = (shipment: Shipment): string => {
  const color = STATUS_COLORS[shipment.status] ?? '#94A3B8';
  const eta = shipment.estimatedArrivalAt
    ? formatDate(shipment.estimatedArrivalAt)
    : '—';
  const duration = tripDuration(shipment);
  const pos = primaryPosition(shipment);
  return `
    <div class="live-popup">
      <div class="live-popup-ref">
        <span class="live-popup-dot" style="background:${color}"></span>
        <strong>${escapeHtml(shipment.referenceNumber)}</strong>
      </div>
      <div class="live-popup-route">${escapeHtml(shipment.originCity)} → ${escapeHtml(
        shipment.destinationCity,
      )}</div>
      <div class="live-popup-row"><span>ETA</span><strong>${escapeHtml(eta)}</strong></div>
      ${
        duration
          ? `<div class="live-popup-row"><span>Trip length</span><strong>${escapeHtml(
              duration,
            )}</strong></div>`
          : ''
      }
      ${
        pos
          ? `<div class="live-popup-row"><span>Position</span><strong>${pos.lat.toFixed(
              4,
            )}, ${pos.lng.toFixed(4)}</strong></div>`
          : ''
      }
    </div>
  `;
};

function ClusterLayer({
  shipments,
  selectedId,
  onSelect,
}: {
  shipments: Shipment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const group = L.markerClusterGroup({ maxClusterRadius: 45 });
    shipments.forEach((shipment) => {
      if (shipment.id === selectedId) return;
      const pos = primaryPosition(shipment);
      if (!pos) return;
      const marker = L.marker([pos.lat, pos.lng], {
        icon: makeIcon(STATUS_COLORS[shipment.status] ?? '#94A3B8', false),
        title: shipment.referenceNumber,
      });
      marker.bindPopup(markerPopupHtml(shipment));
      marker.on('click', () => onSelect(shipment.id));
      group.addLayer(marker);
    });
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [shipments, selectedId, map, onSelect]);

  return null;
}

function SelectedShipmentLayer({ shipment }: { shipment: Shipment | null }) {
  const pos = useMemo(() => {
    if (!shipment) return null;
    return primaryPosition(shipment);
  }, [shipment]);

  const originPoint = useMemo(() => {
    if (!shipment) return null;
    const origin = shipment.originPosition;
    if (origin == null) return null;
    if (origin.latitude == null || origin.longitude == null) return null;
    return {
      lat: origin.latitude,
      lng: origin.longitude,
      label: origin.city || origin.name || 'Origin',
    };
  }, [shipment]);

  const destinationPoint = useMemo(() => {
    if (!shipment) return null;
    const destination = shipment.destinationPosition;
    if (destination == null) return null;
    if (destination.latitude == null || destination.longitude == null) {
      return null;
    }
    return {
      lat: destination.latitude,
      lng: destination.longitude,
      label: destination.city || destination.name || 'Destination',
    };
  }, [shipment]);

  const pathPoints = useMemo(() => {
    const points: [number, number][] = [];
    if (originPoint) points.push([originPoint.lat, originPoint.lng]);
    if (pos) points.push([pos.lat, pos.lng]);
    if (destinationPoint) points.push([destinationPoint.lat, destinationPoint.lng]);
    return points;
  }, [originPoint, pos, destinationPoint]);

  if (!shipment) return null;

  return (
    <>
      {originPoint && (
        <CircleMarker
          center={[originPoint.lat, originPoint.lng]}
          radius={7}
          pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <strong>Origin</strong>
            <div>{escapeHtml(originPoint.label)}</div>
          </Popup>
        </CircleMarker>
      )}
      {destinationPoint && (
        <CircleMarker
          center={[destinationPoint.lat, destinationPoint.lng]}
          radius={7}
          pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <strong>Destination</strong>
            <div>{escapeHtml(destinationPoint.label)}</div>
          </Popup>
        </CircleMarker>
      )}
      {pathPoints.length > 1 && (
        <Polyline
          positions={pathPoints}
          pathOptions={{ color: '#0EA5E9', weight: 3, dashArray: '6 8', opacity: 0.9 }}
        />
      )}
      {pos && (
        <Marker
          position={[pos.lat, pos.lng]}
          icon={makeIcon(STATUS_COLORS[shipment.status] ?? '#0EA5E9', true)}
        >
          <Popup>{markerPopupHtml(shipment)}</Popup>
        </Marker>
      )}
    </>
  );
}

function FlyToSelected({ shipment }: { shipment: Shipment | null }) {
  const map = useMap();

  useEffect(() => {
    const pos = shipment ? primaryPosition(shipment) : null;
    if (!pos) return;
    map.flyTo([pos.lat, pos.lng], Math.max(map.getZoom(), 11), { duration: 0.8 });
  }, [shipment, map]);

  return null;
}

interface LiveMapProps {
  className?: string;
  mapHeightClassName?: string;
  pageLimit?: number;
}

export const LiveMap = ({
  className,
  mapHeightClassName = 'h-[62vh] min-h-[420px]',
  pageLimit = 10,
}: LiveMapProps) => {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useShipments({
    page,
    limit: pageLimit,
  });

  const shipments: Shipment[] = (data?.data ?? []).filter(
    (s) => s.status !== 'draft',
  );
  const meta = data?.meta;

  const positionedCount = shipments.filter((s) => primaryPosition(s)).length;

  const selectedShipment = useMemo(
    () => shipments.find((s) => s.id === selectedId) ?? null,
    [shipments, selectedId],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        Failed to load live shipments.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white dark:border-[#1E3A5F] dark:bg-[#0F2A44]">
          <div className="border-b border-[#E2E8F0] px-4 py-3 dark:border-[#1E3A5F]">
            <h2 className="text-sm font-semibold text-[#0A2E4A] dark:text-white">
              Shipments <span className="ml-1 text-xs font-normal text-[#94A3B8]">({positionedCount} on map)</span>
            </h2>
          </div>
          <div className="max-h-[50vh] flex-1 overflow-y-auto">
            {shipments.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#94A3B8]">No shipments yet.</p>
            ) : (
              <ul className="divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                {shipments.map((shipment) => {
                  const pos = primaryPosition(shipment);
                  const active = shipment.id === selectedId;
                  return (
                    <li key={shipment.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(active ? null : shipment.id)}
                        onMouseEnter={() => {
                          if (!selectedId && pos) {
                            setSelectedId(shipment.id);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#F1F5F9] dark:hover:bg-[#0B2238] ${
                          active ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-[#0A2E4A] dark:text-white">
                            {shipment.referenceNumber}
                          </span>
                          <ShipmentStatusBadge status={shipment.status} />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                          <span className="truncate">
                            {shipment.originCity} → {shipment.destinationCity}
                          </span>
                          {tripDuration(shipment) && (
                            <span className="shrink-0 rounded-md bg-[#F1F5F9] px-1.5 py-0.5 font-medium text-[#64748B] dark:bg-[#0B2238] dark:text-[#94A3B8]">
                              {tripDuration(shipment)}
                            </span>
                          )}
                          {shipment.estimatedArrivalAt && (
                            <span className="shrink-0">ETA {formatDate(shipment.estimatedArrivalAt)}</span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {meta && meta.totalItems > 0 && (
            <div className="border-t border-[#E2E8F0] px-4 py-3 dark:border-[#1E3A5F]">
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                totalItems={meta.totalItems}
                limit={pageLimit}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        <div
          className={`${mapHeightClassName} relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#EAF0F6] dark:border-[#1E3A5F]`}
        >
          <MapContainer
            center={EGYPT_CENTER}
            zoom={6}
            scrollWheelZoom
            className="h-full w-full"
            style={{ minHeight: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClusterLayer
              shipments={shipments}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <SelectedShipmentLayer shipment={selectedShipment} />
            <FlyToSelected shipment={selectedShipment} />
          </MapContainer>
          <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-xs shadow dark:bg-[#0F2A44]/90">
            <div className="flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-[#10B981] shadow" /> Origin
              <span className="ml-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#EF4444] shadow" /> Destination
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
