import { useMemo, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Pagination } from '../../ui/Pagination';
import { Tabs } from '../../ui/Tabs';
import { useCheckpoints } from '../../../hooks/useCheckpoints';
import { useAddRouteCheckpoint, useRemoveRouteCheckpoint } from '../../../hooks/useRoutes';
import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaCheckCircle,
  FaEye,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import type { Route, RouteCheckpoint } from '../../../types/route.types';
import type { Checkpoint } from '../../../types/checkpoint.types';
import { cn } from '../../../lib/utils';

const PAGE_SIZE = 8;

interface RouteCheckpointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
}

export const RouteCheckpointsModal = ({ isOpen, onClose, route }: RouteCheckpointsModalProps) => {
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view');
  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');
  const [newSequence, setNewSequence] = useState('');
  const [cpSearch, setCpSearch] = useState('');
  const [cpPage, setCpPage] = useState(1);
  const [viewPage, setViewPage] = useState(1);

  // ── Route's current checkpoints (already loaded on the route object) ──
  const routeCheckpoints: RouteCheckpoint[] = route?.checkpoints ?? [];
  const sortedRouteCheckpoints = useMemo(
    () => [...routeCheckpoints].sort((a, b) => a.sequenceOrder - b.sequenceOrder),
    [routeCheckpoints],
  );
  const routeCheckpointIds = useMemo(
    () => new Set(routeCheckpoints.map((rc) => rc.id)),
    [routeCheckpoints],
  );
  const suggestedSequence = useMemo(
    () =>
      routeCheckpoints.length > 0
        ? Math.max(...routeCheckpoints.map((rc) => rc.sequenceOrder)) + 1
        : 1,
    [routeCheckpoints],
  );

  // "View" tab — client-side pagination over the route's own checkpoints
  const viewTotalPages = Math.max(1, Math.ceil(sortedRouteCheckpoints.length / PAGE_SIZE));
  const clampedViewPage = Math.min(viewPage, viewTotalPages);
  const viewItems = sortedRouteCheckpoints.slice(
    (clampedViewPage - 1) * PAGE_SIZE,
    clampedViewPage * PAGE_SIZE,
  );

  // "Add" tab — server-side search + pagination over the full catalog
  const { data: checkpointsData, isLoading: checkpointsLoading } = useCheckpoints({
    page: cpPage,
    limit: PAGE_SIZE,
    search: cpSearch || undefined,
  });
  const checkpointsMeta = checkpointsData?.meta;
  const allCheckpoints: Checkpoint[] = checkpointsData?.data || [];

  const { mutate: addCheckpoint, isPending: isAdding } = useAddRouteCheckpoint();
  const { mutate: removeCheckpoint, isPending: isRemoving } = useRemoveRouteCheckpoint();

  // Reset per-route state when the opened route changes.
  // Sentinel-normalized so it never re-fires (the old `route?.id` vs null bug).
  const currentRouteId = route?.id ?? null;
  const [prevRouteId, setPrevRouteId] = useState<string | null>(null);
  if (currentRouteId !== prevRouteId) {
    setPrevRouteId(currentRouteId);
    setNewSequence(String(suggestedSequence));
    setSelectedCheckpointId('');
    setCpSearch('');
    setActiveTab('view');
    setViewPage(1);
    setCpPage(1);
  }

  const handleAdd = () => {
    if (!selectedCheckpointId || !newSequence || !route) return;
    addCheckpoint(
      {
        routeId: route.id,
        data: {
          checkpointId: selectedCheckpointId,
          sequenceOrder: parseInt(newSequence, 10),
        },
      },
      {
        onSuccess: () => {
          setSelectedCheckpointId('');
          const maxSeq =
            routeCheckpoints.length > 0
              ? Math.max(...routeCheckpoints.map((rc) => rc.sequenceOrder))
              : 0;
          setNewSequence(String(maxSeq + 2));
        },
      },
    );
  };

  const handleRemove = (checkpointId: string) => {
    if (!route) return;
    if (window.confirm('Remove this checkpoint from the route?')) {
      removeCheckpoint({ routeId: route.id, checkpointId });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Route Checkpoints — ${route?.name || ''}`} size="lg">
      <Tabs
        variant="pills"
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'view' | 'add')}
        tabs={[
          {
            id: 'view',
            label: 'View',
            icon: <FaEye className="w-3.5 h-3.5" />,
            badge: sortedRouteCheckpoints.length,
            content: (
              <div className="space-y-3">
                {sortedRouteCheckpoints.length === 0 ? (
                  <p className="text-sm text-[#94A3B8] py-10 text-center border border-dashed border-[#E2E8F0] dark:border-[#1A3D5A] rounded-lg">
                    No checkpoints attached to this route yet. Switch to the <b>Add</b> tab to attach some.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {viewItems.map((rc) => (
                        <div
                          key={`${rc.id}-${rc.sequenceOrder}`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1A3D5A]/50 border border-[#E2E8F0] dark:border-[#1A3D5A]"
                        >
                          <div className="flex items-center gap-1">
                            <span className="w-6 h-6 rounded-full bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white text-xs flex items-center justify-center font-medium">
                              {rc.sequenceOrder}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white truncate">
                              {rc.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                              <span className="capitalize">{rc.type?.replace('_', ' ') || '—'}</span>
                              <span>·</span>
                              <span>{rc.city || '—'}</span>
                              <span>·</span>
                              <span className="font-mono">{rc.code || '—'}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemove(rc.id)}
                            disabled={isRemoving}
                            className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                          >
                            {isRemoving ? <LoadingSpinner size="sm" /> : <FaTrash className="w-3 h-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A] pt-3">
                      <Pagination
                        page={clampedViewPage}
                        totalPages={viewTotalPages}
                        totalItems={sortedRouteCheckpoints.length}
                        limit={PAGE_SIZE}
                        onPageChange={setViewPage}
                      />
                    </div>
                  </>
                )}
              </div>
            ),
          },
          {
            id: 'add',
            label: 'Add',
            icon: <FaPlus className="w-3.5 h-3.5" />,
            content: (
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={cpSearch}
                    onChange={(e) => {
                      setCpSearch(e.target.value);
                      setCpPage(1);
                    }}
                    placeholder="Search by name or code…"
                    className="w-full rounded-md border border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] pl-9 pr-3 py-2 text-sm text-[#1A2A3A] dark:text-white focus:border-[#0A2E4A] dark:focus:border-[#2D9B6E] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E] placeholder:text-[#94A3B8]"
                  />
                </div>

                {checkpointsLoading ? (
                  <div className="py-10 flex justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : allCheckpoints.length === 0 ? (
                  <p className="text-sm text-[#94A3B8] py-10 text-center border border-dashed border-[#E2E8F0] dark:border-[#1A3D5A] rounded-lg">
                    {cpSearch
                      ? 'No checkpoints match your search.'
                      : 'No checkpoints found. Create one first from the Checkpoints page.'}
                  </p>
                ) : (
                  <>
                    {/* Paginated picker — every checkpoint on the page is shown, added ones are marked */}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {allCheckpoints.map((cp) => {
                        const alreadyAdded = routeCheckpointIds.has(cp.id);
                        const selected = selectedCheckpointId === cp.id;
                        return (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => {
                              if (alreadyAdded) return;
                              setSelectedCheckpointId(selected ? '' : cp.id);
                            }}
                            disabled={alreadyAdded}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150',
                              alreadyAdded
                                ? 'opacity-60 cursor-not-allowed border-[#E2E8F0] dark:border-[#1A3D5A]'
                                : selected
                                  ? 'border-[#2D9B6E] bg-[#F0FDF4] dark:bg-[#1A3D5A] ring-1 ring-[#2D9B6E]'
                                  : 'border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A]/40 hover:border-[#0A2E4A] dark:hover:border-[#2D9B6E]',
                            )}
                          >
                            <FaMapMarkerAlt className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1A2A3A] dark:text-white truncate">
                                {cp.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                                <span className="capitalize">{cp.type?.replace('_', ' ') || '—'}</span>
                                <span>·</span>
                                <span>{cp.city || '—'}</span>
                                <span>·</span>
                                <span className="font-mono">{cp.code || '—'}</span>
                              </div>
                            </div>
                            {alreadyAdded ? (
                              <span className="flex items-center gap-1 text-xs font-medium text-[#2D9B6E] flex-shrink-0">
                                <FaCheckCircle className="w-3.5 h-3.5" />
                                Added
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                                  selected
                                    ? 'border-[#2D9B6E] bg-[#2D9B6E]'
                                    : 'border-[#CBD5E1] dark:border-[#1A3D5A]',
                                )}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Add bar */}
                    <div className="flex items-end gap-3 pt-3 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                          {selectedCheckpointId
                            ? 'Selected checkpoint'
                            : 'Select a checkpoint above'}
                        </label>
                        <p className="text-sm text-[#1A2A3A] dark:text-white truncate">
                          {allCheckpoints.find((c) => c.id === selectedCheckpointId)?.name ?? '—'}
                        </p>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-[#94A3B8] mb-1">Sequence</label>
                        <input
                          type="number"
                          min="1"
                          value={newSequence}
                          onChange={(e) => setNewSequence(e.target.value)}
                          className="w-full rounded-md border border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] px-3 py-2 text-sm text-[#1A2A3A] dark:text-white focus:border-[#0A2E4A] dark:focus:border-[#2D9B6E] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E]"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleAdd}
                        disabled={!selectedCheckpointId || !newSequence || isAdding}
                        className="flex items-center gap-1.5"
                      >
                        {isAdding ? <LoadingSpinner size="sm" /> : <FaPlus className="w-3 h-3" />}
                        Add
                      </Button>
                    </div>

                    {/* Server-side pagination over the whole catalog (selected + not) */}
                    {checkpointsMeta && checkpointsMeta.totalItems > 0 && (
                      <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A] pt-3">
                        <Pagination
                          page={cpPage}
                          totalPages={checkpointsMeta.totalPages}
                          totalItems={checkpointsMeta.totalItems}
                          limit={PAGE_SIZE}
                          onPageChange={setCpPage}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};
