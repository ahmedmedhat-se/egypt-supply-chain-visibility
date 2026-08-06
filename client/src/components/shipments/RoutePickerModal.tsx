import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { routesApi } from '../../api/routes.api';
import { useAssignRoute } from '../../hooks/useShipments';
import { cn } from '../../lib/utils';
import {
  FaRoute,
  FaSearch,
  FaCheckCircle,
  FaMapSigns,
  FaClock,
} from 'react-icons/fa';
import type { Route } from '../../types/route.types';
import type { Shipment } from '../../types/shipment.types';

interface RoutePickerModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Searchable + paginated route picker used to assign a route to a shipment.
 * Fetches routes on demand (page/search) instead of loading the full list.
 */
export const RoutePickerModal = ({
  shipment,
  isOpen,
  onClose,
}: RoutePickerModalProps) => {
  const { mutate: assignRoute, isPending: isAssigning } = useAssignRoute();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const limit = 10;

  // Reset the picker when the modal opens (or switches to another shipment)
  // using the adjust-state-during-render pattern — no effect needed.
  const [openedForId, setOpenedForId] = useState<string | undefined>(undefined);
  if (isOpen && openedForId !== shipment?.id) {
    setOpenedForId(shipment?.id);
    setSelectedRouteId(shipment?.route?.route_id || '');
    setSearch('');
    setPage(1);
  }
  if (!isOpen && openedForId !== undefined) {
    setOpenedForId(undefined);
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['routes-picker', page, search],
    queryFn: async () => {
      const res = await routesApi.getAll({
        page,
        limit,
        search: search || undefined,
        isActive: true,
      });
      return res.data;
    },
    enabled: isOpen,
  });

  if (!shipment) return null;

  const routes: Route[] = data?.data ?? [];
  const meta = data?.meta;

  const handleConfirm = () => {
    if (!selectedRouteId) return;
    assignRoute(
      { id: shipment.id, routeId: selectedRouteId },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Route — ${shipment.referenceNumber}`}
      size="md"
    >
      <p className="text-sm text-[#94A3B8] mb-4">
        Choose the route this shipment will follow. Checkpoints and estimated
        duration come from the selected route.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search routes by name or code..."
          className="w-full rounded-lg border border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] pl-10 pr-3 py-2.5 text-sm text-[#1A2A3A] dark:text-white focus:border-[#0A2E4A] dark:focus:border-[#2D9B6E] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E] placeholder:text-[#94A3B8]"
        />
      </div>

      {/* Route list */}
      <div className="space-y-2 min-h-[180px] max-h-72 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : routes.length === 0 ? (
          <p className="text-sm text-[#94A3B8] py-8 text-center">
            {search
              ? `No routes match "${search}".`
              : 'No active routes available yet.'}
          </p>
        ) : (
          routes.map((route) => {
            const isSelected = selectedRouteId === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRouteId(route.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all duration-200',
                  isSelected
                    ? 'border-[#2D9B6E] bg-[#D1FAE5]/30 dark:bg-[#1F7A52]/20'
                    : 'border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#94A3B8]',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0A2E4A] dark:text-white">
                    {route.name}{' '}
                    <span className="text-[#94A3B8]">({route.code})</span>
                  </span>
                  {isSelected && (
                    <FaCheckCircle className="w-4 h-4 text-[#2D9B6E]" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#94A3B8]">
                  <span className="inline-flex items-center gap-1">
                    <FaMapSigns className="w-3 h-3" />
                    {route.originCity} → {route.destinationCity}
                  </span>
                  {route.estimatedDays != null && (
                    <span className="inline-flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                      ~{route.estimatedDays} day
                      {route.estimatedDays === 1 ? '' : 's'}
                    </span>
                  )}
                  {route.checkpoints && route.checkpoints.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FaRoute className="w-3 h-3" />
                      {route.checkpoints.length} checkpoint
                      {route.checkpoints.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}

        {isFetching && !isLoading && (
          <div className="py-2 flex justify-center">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 0 && (
        <div className="mt-4">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.totalItems}
            limit={limit}
            onPageChange={setPage}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-5">
        <Button size="sm" variant="outline" onClick={onClose} disabled={isAssigning}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!selectedRouteId || isAssigning}
          isLoading={isAssigning}
        >
          <FaRoute className="w-3 h-3 mr-1.5" />
          {shipment.route ? 'Change Route' : 'Assign Route'}
        </Button>
      </div>
    </Modal>
  );
};
