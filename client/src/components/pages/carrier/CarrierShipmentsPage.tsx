import { useState, useRef } from 'react';
import { Pagination } from '../../ui/Pagination';
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
} from '../../../hooks/useShipments';
import { shipmentsApi } from '../../../api/shipments.api';
import { RoutePickerModal } from '../../shipments/RoutePickerModal';
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
  FaWarehouse,
} from 'react-icons/fa';
import type { Shipment, ShipmentEvent, ShipmentStatus } from '../../../types/shipment.types';

type ActiveTab = 'my' | 'org' | 'available';

export const CarrierShipmentsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<ActiveTab>('my');
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [routeModalId, setRouteModalId] = useState<string | null>(null);
  const [statusOpenId, setStatusOpenId] = useState<string | null>(null);
  const [statusDropdownDir, setStatusDropdownDir] = useState<'down' | 'up'>('down');

  // Pagination state — one page per tab so switching tabs keeps each list's place
  const [myPage, setMyPage] = useState(1);
  const [orgPage, setOrgPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);
  const PAGE_SIZE = 10;

  // Data fetching — server-side scope filtering + pagination.
  //  - "mine":      shipments where the caller is the assigned carrier driver
  //  - "assigned":  every shipment claimed by the caller's organization
  //  - "available": shipments no carrier org has claimed yet (marketplace)
  // Always enabled — powers both the tab and the per-user active check.
  const { data: myData, isLoading: myLoading } = useShipments({
    scope: 'mine',
    page: myPage,
    limit: PAGE_SIZE,
  });
  // Lazy — inactive tabs only fetch when first viewed.
  const { data: orgData, isLoading: orgLoading } = useShipments({
    scope: 'assigned',
    page: orgPage,
    limit: PAGE_SIZE,
    enabled: activeTab === 'org',
  });
  const { data: availableData, isLoading: availableLoading } = useShipments({
    scope: 'available',
    page: availablePage,
    limit: PAGE_SIZE,
    enabled: activeTab === 'available',
  });
  const { mutate: acceptShipment, isPending: isAccepting } = useAcceptShipment();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateShipmentStatus();

  // Separate shipments per tab (server-scoped)
  const myShipments: Shipment[] = myData?.data || [];
  const orgShipments: Shipment[] = orgData?.data || [];
  const availableShipments: Shipment[] = availableData?.data || [];
  const myMeta = myData?.meta;
  const orgMeta = orgData?.meta;
  const availableMeta = availableData?.meta;
  const shipmentsLoading = myLoading || orgLoading || availableLoading;
  const allShipments = [...myShipments, ...orgShipments, ...availableShipments];

  // Check if THIS carrier has an active shipment (one carrier = one shipment at
  // a time). Scoped to the current user — org-mates' shipments must not block a
  // driver who has no active work.
  const currentUserId = user?.id;
  const hasActiveShipment = myShipments.some(
    (s) =>
      s.carrierUser?.id === currentUserId &&
      s.status !== 'delivered' &&
      s.status !== 'cancelled',
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
      acceptShipment(shipment.id, {
        onSuccess: () => {
          // Jump straight into route assignment for the freshly claimed shipment.
          // Reset to page 1 so the newly claimed shipment (most recent first)
          // is visible on the "My Shipments" tab.
          setActiveTab('my');
          setMyPage(1);
          setSelectedShipment(shipment.id);
          setRouteModalId(shipment.id);
        },
      });
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

  const routeModalShipment = routeModalId
    ? allShipments.find((s) => s.id === routeModalId)
    : null;

  return (
    <div className="space-y-6">
      {/* Route Assignment Modal (searchable + paginated) */}
      <RoutePickerModal
        shipment={routeModalShipment ?? null}
        isOpen={!!routeModalShipment}
        onClose={() => setRouteModalId(null)}
      />
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
          count={myMeta?.totalItems ?? myShipments.length}
        />
        <TabButton
          active={activeTab === 'org'}
          onClick={() => {
            setActiveTab('org');
            setSelectedShipment(null);
          }}
          icon={FaWarehouse}
          label="Org Shipments"
          count={orgMeta?.totalItems ?? orgShipments.length}
        />
        <TabButton
          active={activeTab === 'available'}
          onClick={() => {
            setActiveTab('available');
            setSelectedShipment(null);
          }}
          icon={FaHandPaper}
          label="Available"
          count={availableMeta?.totalItems ?? availableShipments.length}
        />
      </div>

      {activeTab === 'my' ? (
        <ShipmentsListTab
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
          statusDropdownDir={statusDropdownDir}
          onOpenRouteModal={(id) => setRouteModalId(id)}
          onClaim={handleAccept}
          isAccepting={isAccepting}
          hasActiveShipment={hasActiveShipment}
          page={myPage}
          totalItems={myMeta?.totalItems ?? 0}
          totalPages={myMeta?.totalPages ?? 1}
          onPageChange={setMyPage}
          pageSize={PAGE_SIZE}
        />
      ) : activeTab === 'org' ? (
        <ShipmentsListTab
          shipments={orgShipments}
          isLoading={shipmentsLoading}
          selectedShipment={selectedShipment}
          onSelectShipment={setSelectedShipment}
          selectedShipmentData={selectedShipmentData}
          statusOpenId={statusOpenId}
          onStatusToggle={handleStatusToggle}
          onStatusChange={handleStatusChange}
          getValidTransitions={getValidTransitions}
          isUpdatingStatus={isUpdatingStatus}
          statusDropdownDir={statusDropdownDir}
          onOpenRouteModal={(id) => setRouteModalId(id)}
          onClaim={handleAccept}
          isAccepting={isAccepting}
          hasActiveShipment={hasActiveShipment}
          page={orgPage}
          totalItems={orgMeta?.totalItems ?? 0}
          totalPages={orgMeta?.totalPages ?? 1}
          onPageChange={setOrgPage}
          pageSize={PAGE_SIZE}
          listTitle="Organization Shipments"
          emptyTitle="No Unclaimed Org Shipments"
          emptyDescription="There are no unclaimed shipments waiting in your organization right now. Check the Available tab to claim new work."
        />
      ) : (
        <AvailableShipmentsTab
          shipments={availableShipments}
          isLoading={shipmentsLoading}
          onAccept={handleAccept}
          isAccepting={isAccepting}
          hasActiveShipment={hasActiveShipment}
          page={availablePage}
          totalItems={availableMeta?.totalItems ?? 0}
          totalPages={availableMeta?.totalPages ?? 1}
          onPageChange={setAvailablePage}
          pageSize={PAGE_SIZE}
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

/* ── Shipments List Tab (shared by "My Shipments" and "Org Shipments") ── */

function ShipmentsListTab({
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
  statusDropdownDir,
  onOpenRouteModal,
  onClaim,
  isAccepting,
  hasActiveShipment,
  page,
  totalItems,
  totalPages,
  onPageChange,
  pageSize,
  listTitle = 'Your Shipments',
  emptyTitle = 'No Assigned Shipments',
  emptyDescription = "You haven't accepted any shipments yet. Check the Available tab to find shipments you can claim.",
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
  statusDropdownDir: 'down' | 'up';
  onOpenRouteModal: (id: string) => void;
  onClaim: (s: Shipment) => void;
  isAccepting: boolean;
  hasActiveShipment: boolean;
  page: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  listTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
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
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Shipment list - left sidebar */}
      <div className="xl:col-span-1 space-y-3">
        <h2 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider px-1">
          {listTitle}
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
              {shipment.carrierUser ? (
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
              ) : (
                // Org-claimed shipment with no driver assigned yet — it now
                // lives in "My Shipments" (not "Available"), so the driver
                // self-assigns from here.
                <div className="mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1A3D5A]/60">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onClaim(shipment)}
                    disabled={isAccepting || hasActiveShipment}
                    className={cn(
                      'w-full flex items-center justify-center gap-1.5 text-xs',
                      hasActiveShipment && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <FaHandPaper className="w-3 h-3" />
                    {isAccepting
                      ? 'Claiming...'
                      : hasActiveShipment
                        ? 'Complete Active Shipment First'
                        : 'Claim for Yourself'}
                  </Button>
                </div>
              )}
            </button>
          );
        })}
        {totalItems > 0 && (
          <div className="pt-2">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              limit={pageSize}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>

      {/* Detail panel - right side */}
      <div className="xl:col-span-2">
        {selectedShipmentData ? (
          <ShipmentDetailPanel
            key={selectedShipmentData.id}
            shipment={selectedShipmentData}
            statusOpenId={statusOpenId}
            onStatusToggle={onStatusToggle}
            onStatusChange={onStatusChange}
            getValidTransitions={getValidTransitions}
            isUpdatingStatus={isUpdatingStatus}
            statusDropdownDir={statusDropdownDir}
            onOpenRouteModal={onOpenRouteModal}
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
  statusDropdownDir,
  onOpenRouteModal,
}: {
  shipment: Shipment;
  statusOpenId: string | null;
  onStatusToggle: (id: string, el: HTMLDivElement | null) => void;
  onStatusChange: (s: Shipment, status: ShipmentStatus) => void;
  getValidTransitions: (status: string) => ShipmentStatus[];
  isUpdatingStatus: boolean;
  statusDropdownDir: 'down' | 'up';
  onOpenRouteModal: (id: string) => void;
}) {
  const { mutate: updateStatus } = useUpdateShipmentStatus();

  const toFixed6 = (value: number | null | undefined) =>
    value != null ? value.toFixed(6) : '';

  // Pre-fill from the shipment's last reported position so the map opens there
  // Keyed remount (key={shipment.id}) re-initializes these per shipment,
  // so no effect-sync is needed.
  const [latitude, setLatitude] = useState(() => toFixed6(shipment.currentLatitude));
  const [longitude, setLongitude] = useState(() => toFixed6(shipment.currentLongitude));

  // Checkpoints come enriched on the shipment payload (server-side),
  // so we never need to load the full routes list.
  const checkpoints = shipment.route?.checkpoints || [];
  const sortedCheckpoints = [...checkpoints].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );

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

  const events: ShipmentEvent[] = shipmentDetail?.events ?? [];

  // Determine which checkpoint is current by looking at events
  const currentCheckpointSeq = (() => {
    const checkpointEvents = events
      .filter((e) => e.type === 'status_change' && e.checkpointId)
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );

    if (checkpointEvents.length > 0) {
      const lastCpId = checkpointEvents[0].checkpointId;
      const match = sortedCheckpoints.find(
        (rc) => rc.id === lastCpId,
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              {shipment.route ? (
                <div>
                  <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
                    {shipment.route.route_name}{' '}
                    <span className="text-[#94A3B8]">({shipment.route.route_code})</span>
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {shipment.route.estimatedDays != null
                      ? `Est. ${shipment.route.estimatedDays} day${shipment.route.estimatedDays === 1 ? '' : 's'} journey`
                      : 'No estimated duration'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#94A3B8]">
                  No route assigned yet. Assign a route to enable checkpoint tracking.
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => onOpenRouteModal(shipment.id)}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <FaRoute className="w-3 h-3" />
              {shipment.route ? 'Change Route' : 'Assign Route'}
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
                            {rc.name}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            {rc.city} · {rc.type}
                          </p>
                        </div>
                        {!isReached && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCheckpointReached(rc.id)
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
            {events.slice(0, 10).map((event) => (
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
                    <ShipmentStatusBadge status={event.status as ShipmentStatus} />
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
  page,
  totalItems,
  totalPages,
  onPageChange,
  pageSize,
}: {
  shipments: Shipment[];
  isLoading: boolean;
  onAccept: (s: Shipment) => void;
  isAccepting: boolean;
  hasActiveShipment: boolean;
  page: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
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

      {totalItems > 0 && (
        <div className="pt-2">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
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
