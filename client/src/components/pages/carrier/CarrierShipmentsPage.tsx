import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { EmptyState } from '../../ui/EmptyState';
import { ShipmentStatusBadge } from '../../shipments/ShipmentStatusBadge';
import { MapPicker } from '../../ui/MapPicker';
import { useAuthStore } from '../../../store/auth.store';
import {
  useShipments,
  useAcceptShipment,
  useUpdateShipmentStatus,
  useUpdateShipment,
} from '../../../hooks/useShipments';
import { shipmentsApi } from '../../../api/shipments.api';
import { routesApi } from '../../../api/routes.api';
import { cn } from '../../../lib/utils';
import { STATUS_TRANSITIONS } from '../../../constants/shipments';
import toast from 'react-hot-toast';
import {
  FaShip,
  FaHandPaper,
  FaTruck,
  FaMapMarkerAlt,
  FaRoute,
  FaClipboardCheck,
  FaCheckCircle,
  FaChevronDown,
  FaHistory,
  FaLocationArrow,
  FaBoxes,
  FaUser,
  FaIdBadge,
} from 'react-icons/fa';
import type { Shipment, ShipmentStatus } from '../../../types/shipment.types';
import type { Route } from '../../../types/route.types';

type ActiveTab = 'my' | 'available';

export const CarrierShipmentsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<ActiveTab>('my');
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [statusOpenId, setStatusOpenId] = useState<string | null>(null);
  const [statusDropdownDir, setStatusDropdownDir] = useState<'down' | 'up'>('down');

  // Data fetching
  const { data: shipmentsData, isLoading: shipmentsLoading } = useShipments();
  const { mutate: acceptShipment, isPending: isAccepting } = useAcceptShipment();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateShipmentStatus();

  const { data: routesData } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await routesApi.getAll();
      return res.data.data;
    },
  });

  const routes: Route[] = routesData || [];

  // Separate shipments into My Shipments and Available
  const allShipments: Shipment[] = shipmentsData?.data || [];
  const myShipments = allShipments.filter(
    (s) => s.carrierOrganization?.organization_id === user?.organizationId,
  );
  const availableShipments = allShipments.filter(
    (s) => !s.carrierOrganization && s.status !== 'cancelled',
  );

  // Check if carrier has an active shipment (one carrier = one shipment at a time)
  const hasActiveShipment = myShipments.some(
    (s) => s.status !== 'delivered' && s.status !== 'cancelled',
  );

    const getValidTransitions = (status: string): ShipmentStatus[] => {
    const transitions = (STATUS_TRANSITIONS[status] as ShipmentStatus[]) || [];
    // Carriers cannot restore cancelled shipments
    if (status === 'cancelled') {
      return [];
    }
    return transitions;
  };

  const handleAccept = (shipment: Shipment) => {
    if (hasActiveShipment) {
      toast.error(
        'You already have an active shipment. Complete or cancel it before accepting a new one.',
      );
      return;
    }
    if (window.confirm(`Accept shipment "${shipment.referenceNumber}"?`)) {
      acceptShipment(shipment.id);
    }
  };

  const handleStatusChange = (shipment: Shipment, newStatus: ShipmentStatus) => {
    updateStatus({ id: shipment.id, data: { status: newStatus } });
    setStatusOpenId(null);
  };

  const handleStatusToggle = (shipmentId: string, el: HTMLDivElement | null) => {
    if (statusOpenId === shipmentId) {
      setStatusOpenId(null);
      return;
    }
    if (el) {
      const rect = el.getBoundingClientRect();
      const dropdownHeight = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      setStatusDropdownDir(spaceBelow >= dropdownHeight ? 'down' : 'up');
    }
    setStatusOpenId(shipmentId);
  };

  const selectedShipmentData = selectedShipment
    ? allShipments.find((s) => s.id === selectedShipment)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Shipments</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          {user?.organizationName} — Carrier
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E2E8F0] dark:border-[#1A3D5A]">
        <TabButton
          active={activeTab === 'my'}
          onClick={() => {
            setActiveTab('my');
            setSelectedShipment(null);
          }}
          icon={FaTruck}
          label="My Shipments"
          count={myShipments.length}
        />
        <TabButton
          active={activeTab === 'available'}
          onClick={() => {
            setActiveTab('available');
            setSelectedShipment(null);
          }}
          icon={FaHandPaper}
          label="Available"
          count={availableShipments.length}
        />
      </div>

      {activeTab === 'my' ? (
        <MyShipmentsTab
          shipments={myShipments}
          isLoading={shipmentsLoading}
          selectedShipment={selectedShipment}
          onSelectShipment={setSelectedShipment}
          selectedShipmentData={selectedShipmentData}
          statusOpenId={statusOpenId}
          onStatusToggle={handleStatusToggle}
          onStatusChange={handleStatusChange}
          getValidTransitions={getValidTransitions}
          isUpdatingStatus={isUpdatingStatus}
          routes={routes}
          statusDropdownDir={statusDropdownDir}
        />
      ) : (
        <AvailableShipmentsTab
          shipments={availableShipments}
          isLoading={shipmentsLoading}
          onAccept={handleAccept}
          isAccepting={isAccepting}
          hasActiveShipment={hasActiveShipment}
        />
      )}
    </div>
  );
};

/* ── Tab Button ──────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200',
        active
          ? 'border-[#2D9B6E] text-[#2D9B6E]'
          : 'border-transparent text-[#94A3B8] hover:text-[#1A2A3A] dark:hover:text-white hover:border-[#94A3B8]',
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            active
              ? 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#1F7A52]/40 dark:text-[#D1FAE5]'
              : 'bg-[#E8F0F8] text-[#94A3B8] dark:bg-[#1A3D5A] dark:text-[#94A3B8]',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ── My Shipments Tab ────────────────────────────────────── */

function MyShipmentsTab({
  shipments,
  isLoading,
  selectedShipment,
  onSelectShipment,
  selectedShipmentData,
  statusOpenId,
  onStatusToggle,
  onStatusChange,
  getValidTransitions,
  isUpdatingStatus,
  routes,
  statusDropdownDir,
}: {
  shipments: Shipment[];
  isLoading: boolean;
  selectedShipment: string | null;
  onSelectShipment: (id: string | null) => void;
  selectedShipmentData: Shipment | null | undefined;
  statusOpenId: string | null;
  onStatusToggle: (id: string, el: HTMLDivElement | null) => void;
  onStatusChange: (s: Shipment, status: ShipmentStatus) => void;
  getValidTransitions: (status: string) => ShipmentStatus[];
  isUpdatingStatus: boolean;
  routes: Route[];
  statusDropdownDir: 'down' | 'up';
}) {
  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <EmptyState
        icon={FaTruck}
        title="No Assigned Shipments"
        description="You haven't accepted any shipments yet. Check the Available tab to find shipments you can claim."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Shipment list - left sidebar */}
      <div className="xl:col-span-1 space-y-3">
        <h2 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider px-1">
          Your Shipments
        </h2>
        {shipments.map((shipment) => {
          const isCurrentUser = shipment.carrierUser?.id === useAuthStore.getState().user?.id;
          return (
            <button
              key={shipment.id}
              onClick={() =>
                onSelectShipment(selectedShipment === shipment.id ? null : shipment.id)
              }
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all duration-200',
                selectedShipment === shipment.id
                  ? 'border-[#2D9B6E] bg-[#D1FAE5]/20 dark:bg-[#1F7A52]/20 shadow-md'
                  : 'border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#94A3B8] dark:hover:border-[#94A3B8] bg-white dark:bg-transparent',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-[#0A2E4A] dark:text-white">
                  {shipment.referenceNumber}
                </span>
                <ShipmentStatusBadge status={shipment.status} />
              </div>
              <p className="text-xs text-[#94A3B8] line-clamp-1">
                {shipment.description || 'No description'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-[#94A3B8]">
                <FaMapMarkerAlt className="w-3 h-3" />
                <span>
                  {shipment.originCity} → {shipment.destinationCity}
                </span>
              </div>
              {shipment.carrierUser && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1A3D5A]/60">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    isCurrentUser ? 'bg-[#D1FAE5] text-[#2D9B6E]' : 'bg-[#E8F0F8] dark:bg-[#1A3D5A] text-[#94A3B8]',
                  )}>
                    <FaUser className="w-2.5 h-2.5" />
                  </div>
                  <span className={cn(
                    'text-xs truncate max-w-[180px]',
                    isCurrentUser ? 'text-[#2D9B6E] font-medium' : 'text-[#94A3B8]',
                  )}>
                    {shipment.carrierUser.firstName} {shipment.carrierUser.lastName}
                    {isCurrentUser && ' (You)'}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail panel - right side */}
      <div className="xl:col-span-2">
        {selectedShipmentData ? (
          <ShipmentDetailPanel
            shipment={selectedShipmentData}
            statusOpenId={statusOpenId}
            onStatusToggle={onStatusToggle}
            onStatusChange={onStatusChange}
            getValidTransitions={getValidTransitions}
            isUpdatingStatus={isUpdatingStatus}
            routes={routes}
            statusDropdownDir={statusDropdownDir}
          />
        ) : (
          <Card variant="bordered" className="p-12 text-center">
            <FaTruck className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" />
            <h3 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-2">
              Select a Shipment
            </h3>
            <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
              Click on a shipment from the list to view its details, update status, track location,
              manage route and checkpoints, and view event history.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── Shipment Detail Panel ───────────────────────────────── */

function ShipmentDetailPanel({
  shipment,
  statusOpenId,
  onStatusToggle,
  onStatusChange,
  getValidTransitions,
  isUpdatingStatus,
  routes,
  statusDropdownDir,
}: {
  shipment: Shipment;
  statusOpenId: string | null;
  onStatusToggle: (id: string, el: HTMLDivElement | null) => void;
  onStatusChange: (s: Shipment, status: ShipmentStatus) => void;
  getValidTransitions: (status: string) => ShipmentStatus[];
  isUpdatingStatus: boolean;
  routes: Route[];
  statusDropdownDir: 'down' | 'up';
}) {
  const { mutate: updateStatus } = useUpdateShipmentStatus();
  const { mutate: updateShipment } = useUpdateShipment();

  const [latitude, setLatitude] = useState(shipment.currentLatitude?.toString() || '');
  const [longitude, setLongitude] = useState(shipment.currentLongitude?.toString() || '');
  const [localRouteId, setLocalRouteId] = useState(shipment.route?.route_id || '');

  // Sync state when the selected shipment changes
  useEffect(() => {
    setLatitude(shipment.currentLatitude?.toString() || '');
    setLongitude(shipment.currentLongitude?.toString() || '');
    setLocalRouteId(shipment.route?.route_id || '');
  }, [shipment.id]);

  // Find the route and its checkpoints
  const currentRoute = routes.find(
    (r) => r.id === (shipment.route?.route_id || localRouteId),
  );
  const checkpoints = currentRoute?.checkpoints || [];
  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  // Handle location update
  const handleLocationUpdate = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid latitude and longitude values');
      return;
    }
    updateStatus({
      id: shipment.id,
      data: {
        status: shipment.status,
        latitude: lat,
        longitude: lng,
      },
    });
  };

  // Handle route assignment
  const handleRouteAssign = () => {
    if (!localRouteId) {
      toast.error('Please select a route');
      return;
    }
    updateShipment(
      { id: shipment.id, data: { routeId: localRouteId } },
      { onSuccess: () => toast.success('Route assigned successfully') },
    );
  };

  // Handle checkpoint progress
  const handleCheckpointReached = (checkpointId: string) => {
    updateStatus({
      id: shipment.id,
      data: {
        status: 'at_checkpoint',
        checkpointId,
      },
    });
  };

  // Event history
  const { data: shipmentDetail } = useQuery({
    queryKey: ['shipment-detail', shipment.id],
    queryFn: async () => {
      const res = await shipmentsApi.getById(shipment.id);
      return res.data;
    },
    enabled: true,
  });

  const events = (shipmentDetail as any)?.events || [];

  // Determine which checkpoint is current by looking at events
  const currentCheckpointSeq = (() => {
    const checkpointEvents = events
      .filter((e: any) => e.type === 'status_change' && e.checkpointId)
      .sort(
        (a: any, b: any) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );

    if (checkpointEvents.length > 0) {
      const lastCpId = checkpointEvents[0].checkpointId;
      const match = sortedCheckpoints.find(
        (rc) => rc.checkpoint.id === lastCpId,
      );
      return match ? match.sequenceOrder : 0;
    }
    return 0;
  })();

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Card variant="bordered" className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white">
                {shipment.referenceNumber}
              </h2>
              <ShipmentStatusBadge status={shipment.status} />
            </div>
            <p className="text-sm text-[#94A3B8]">
              {shipment.description || 'No description'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Update Dropdown */}
            {getValidTransitions(shipment.status).length > 0 && (
              <StatusDropdown
                isOpen={statusOpenId === `detail-${shipment.id}`}
                onToggle={(el) => onStatusToggle(`detail-${shipment.id}`, el)}
                onSelect={(s) => onStatusChange(shipment, s)}
                transitions={getValidTransitions(shipment.status)}
                isUpdating={isUpdatingStatus}
                direction={statusDropdownDir}
              />
            )}
          </div>
        </div>

        {/* Quick summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
          <div>
            <p className="text-xs text-[#94A3B8]">Origin</p>
            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
              {shipment.originCity}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8]">Destination</p>
            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
              {shipment.destinationCity}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8]">Weight</p>
            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
              {shipment.weightKg ? `${shipment.weightKg} kg` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8]">Shipper</p>
            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
              {shipment.shipperOrganization?.organization_name || '—'}
            </p>
          </div>
        </div>

        {/* Assigned Driver */}
        {shipment.carrierUser && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
            <div className="w-10 h-10 rounded-full bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center flex-shrink-0">
              <FaUser className="w-5 h-5 text-[#2D9B6E]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#0A2E4A] dark:text-white truncate">
                  {shipment.carrierUser.firstName} {shipment.carrierUser.lastName}
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#D1FAE5] dark:bg-[#1F7A52]/30 text-[#065F46] dark:text-[#D1FAE5]">
                  <FaIdBadge className="w-2.5 h-2.5" />
                  Assigned Driver
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
                {shipment.carrierUser.email}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Location Update */}
      <Card variant="bordered" className="p-5">
        <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
          <FaLocationArrow className="w-4 h-4 text-[#1E40AF]" />
          Current Location
        </h3>

        {shipment.status === 'cancelled' ? (
          <div className="p-4 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FECACA] dark:border-[#7F1D1D]/30 text-center">
            <p className="text-sm text-[#991B1B] dark:text-[#FCA5A5]">
              Shipment is cancelled. Location updates are disabled.
            </p>
          </div>
        ) : (
          <>
            {/* Geolocation-only Map Picker */}
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLatitudeChange={setLatitude}
              onLongitudeChange={setLongitude}
              geolocationOnly
            />

            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                onClick={handleLocationUpdate}
                disabled={isUpdatingStatus}
              >
                <FaLocationArrow className="w-3 h-3 mr-1.5" />
                Update Location
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Route Assignment */}
      <Card variant="bordered" className="p-5">
        <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
          <FaRoute className="w-4 h-4 text-[#92400E]" />
          Route
        </h3>
        {shipment.status === 'cancelled' ? (
          <div className="p-4 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FECACA] dark:border-[#7F1D1D]/30 text-center">
            <p className="text-sm text-[#991B1B] dark:text-[#FCA5A5]">
              Shipment is cancelled. Route assignment is disabled.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <select
                value={localRouteId}
                onChange={(e) => setLocalRouteId(e.target.value)}
                className="w-full rounded-md border border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] px-3 py-2 text-sm text-[#1A2A3A] dark:text-white focus:border-[#0A2E4A] dark:focus:border-[#2D9B6E] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E]"
              >
                <option value="">Select a route...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.code}) — {route.originCity} → {route.destinationCity}
                  </option>
                ))}
              </select>
              {shipment.route && (
                <p className="text-xs text-[#2D9B6E] mt-1">
                  Currently: {shipment.route.route_name} ({shipment.route.route_code})
                </p>
              )}
            </div>
            <Button size="sm" onClick={handleRouteAssign} disabled={!localRouteId}>
              Assign Route
            </Button>
          </div>
        )}
      </Card>

      {/* Checkpoint Progress */}
      {shipment.status === 'cancelled' ? (
        <Card variant="bordered" className="p-5">
          <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
            <FaClipboardCheck className="w-4 h-4 text-[#2D9B6E]" />
            Checkpoint Progress
          </h3>
          <div className="p-4 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FECACA] dark:border-[#7F1D1D]/30 text-center">
            <p className="text-sm text-[#991B1B] dark:text-[#FCA5A5]">
              Shipment is cancelled. Checkpoint tracking is disabled.
            </p>
          </div>
        </Card>
      ) : sortedCheckpoints.length > 0 && (
        <Card variant="bordered" className="p-5">
          <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <FaClipboardCheck className="w-4 h-4 text-[#2D9B6E]" />
            Checkpoint Progress
          </h3>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E2E8F0] dark:bg-[#1A3D5A]" />

            <div className="space-y-5">
              {sortedCheckpoints.map((rc) => {
                const isReached = rc.sequenceOrder <= currentCheckpointSeq;
                const isCurrent = rc.sequenceOrder === currentCheckpointSeq + 1;
                return (
                  <div key={rc.id} className="relative flex items-start gap-4 pl-0">
                    {/* Circle indicator */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 flex-shrink-0 border-2 transition-all',
                        isReached
                          ? 'bg-[#2D9B6E] border-[#2D9B6E] text-white'
                          : isCurrent
                            ? 'bg-white dark:bg-[#1A3D5A] border-[#2D9B6E] text-[#2D9B6E]'
                            : 'bg-white dark:bg-[#1A3D5A] border-[#E2E8F0] dark:border-[#1A3D5A] text-[#94A3B8]',
                      )}
                    >
                      {isReached ? <FaCheckCircle className="w-4 h-4" /> : rc.sequenceOrder}
                    </div>

                    {/* Checkpoint info */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isReached
                                ? 'text-[#2D9B6E]'
                                : 'text-[#1A2A3A] dark:text-white',
                            )}
                          >
                            {rc.checkpoint.name}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            {rc.checkpoint.city} · {rc.checkpoint.type}
                          </p>
                        </div>
                        {!isReached && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCheckpointReached(rc.checkpoint.id)
                            }
                            disabled={!isCurrent}
                            className={cn(
                              'text-xs',
                              !isCurrent && 'opacity-40 cursor-not-allowed',
                            )}
                          >
                            Mark Reached
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Status Update - disabled for cancelled */}
      {shipment.status === 'cancelled' && (
        <Card variant="bordered" className="p-5">
          <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
            <FaHistory className="w-4 h-4" />
            Status
          </h3>
          <div className="p-4 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FECACA] dark:border-[#7F1D1D]/30 text-center">
            <p className="text-sm text-[#991B1B] dark:text-[#FCA5A5]">
              This shipment has been cancelled. You cannot change its status.
              Contact your admin to restore it.
            </p>
          </div>
        </Card>
      )}

      {/* Event History */}
      <Card variant="bordered" className="p-5">
        <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <FaHistory className="w-4 h-4 text-[#94A3B8]" />
          Event History
        </h3>
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 10).map((event: any) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1A3D5A]/50"
              >
                <div className="w-2 h-2 mt-1.5 rounded-full bg-[#2D9B6E] flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#0A2E4A] dark:text-white capitalize">
                      {event.type.replace(/_/g, ' ')}
                    </span>
                    <ShipmentStatusBadge status={event.status} />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {event.description || ''}
                    {event.occurredAt && (
                      <> · {new Date(event.occurredAt).toLocaleString()}</>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <FaHistory className="mx-auto w-8 h-8 text-[#94A3B8] mb-2" />
            <p className="text-sm text-[#94A3B8]">No events recorded yet</p>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Available Shipments Tab ─────────────────────────────── */

function AvailableShipmentsTab({
  shipments,
  isLoading,
  onAccept,
  isAccepting,
  hasActiveShipment,
}: {
  shipments: Shipment[];
  isLoading: boolean;
  onAccept: (s: Shipment) => void;
  isAccepting: boolean;
  hasActiveShipment: boolean;
}) {
  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <EmptyState
        icon={FaHandPaper}
        title="No Available Shipments"
        description="There are no unassigned shipments available to claim at the moment."
      />
    );
  }

  return (
    <div className="space-y-4">
      {hasActiveShipment && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FEF3C7] dark:bg-[#92400E]/20 border border-[#FDE68A] dark:border-[#92400E]/30">
          <FaBoxes className="w-5 h-5 text-[#92400E] dark:text-[#FBBF24]" />
          <div>
            <p className="text-sm font-medium text-[#92400E] dark:text-[#FBBF24]">
              One Shipment at a Time
            </p>
            <p className="text-xs text-[#92400E]/80 dark:text-[#FBBF24]/70">
              You already have an active shipment. Complete or cancel it before claiming a new
              one.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shipments.map((shipment) => (
          <Card
            key={shipment.id}
            variant="bordered"
            className="group hover:shadow-lg transition-all duration-200"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-[#0A2E4A] dark:text-white">
                  {shipment.referenceNumber}
                </span>
                <ShipmentStatusBadge status={shipment.status} />
              </div>

              <p className="text-xs text-[#94A3B8] line-clamp-2 mb-3 min-h-[2rem]">
                {shipment.description || 'No description'}
              </p>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <FaMapMarkerAlt className="w-3 h-3 text-[#2D9B6E]" />
                  <span className="font-medium text-[#1A2A3A] dark:text-white">
                    {shipment.originCity}
                  </span>
                  <span>→</span>
                  <span className="font-medium text-[#1A2A3A] dark:text-white">
                    {shipment.destinationCity}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <FaShip className="w-3 h-3 text-[#1E40AF]" />
                  <span>{shipment.shipperOrganization?.organization_name || 'Unknown'}</span>
                </div>
                {shipment.weightKg && (
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <FaBoxes className="w-3 h-3" />
                    <span>{shipment.weightKg} kg</span>
                  </div>
                )}
              </div>

              <Button
                fullWidth
                onClick={() => onAccept(shipment)}
                disabled={isAccepting || hasActiveShipment}
                className={cn(
                  'flex items-center justify-center gap-2',
                  hasActiveShipment && 'opacity-50 cursor-not-allowed',
                )}
              >
                <FaHandPaper className="w-4 h-4" />
                {isAccepting
                  ? 'Claiming...'
                  : hasActiveShipment
                    ? 'Already Active'
                    : 'Claim Shipment'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Status Dropdown ─────────────────────────────────────── */

function StatusDropdown({
  isOpen,
  onToggle,
  onSelect,
  transitions,
  isUpdating,
  direction = 'down',
}: {
  isOpen: boolean;
  onToggle: (el: HTMLDivElement | null) => void;
  onSelect: (status: ShipmentStatus) => void;
  transitions: ShipmentStatus[];
  isUpdating: boolean;
  direction?: 'down' | 'up';
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => onToggle(ref.current)}
        disabled={isUpdating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#2D9B6E] bg-[#D1FAE5] dark:bg-[#1F7A52]/30 hover:bg-[#A7F3D0] dark:hover:bg-[#1F7A52]/50 transition-colors"
      >
        <FaChevronDown
          className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')}
        />
        Update Status
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onToggle(ref.current)} />
          <div
            className={cn(
              'absolute right-0 z-50 w-48 bg-white dark:bg-[#1A3D5A] rounded-lg shadow-xl border border-[#E2E8F0] dark:border-[#1A3D5A] py-1',
              direction === 'up' ? 'bottom-full mb-1' : 'mt-1',
            )}
          >
            <div className="px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0] dark:border-[#1A3D5A]">
              Change to:
            </div>
            {transitions.map((s) => (
              <button
                key={s}
                onClick={() => onSelect(s)}
                className="w-full text-left px-3 py-2 text-sm text-[#1A2A3A] dark:text-[#E2E8F0] hover:bg-[#E8F0F8] dark:hover:bg-[#0A2E4A] transition-colors capitalize"
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
